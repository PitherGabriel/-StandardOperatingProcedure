const LINE_WIDTH = 42;

const CMD = {
  INIT:          [0x1B, 0x40],
  ALIGN_LEFT:    [0x1B, 0x61, 0x00],
  ALIGN_CENTER:  [0x1B, 0x61, 0x01],
  BOLD_ON:       [0x1B, 0x45, 0x01],
  BOLD_OFF:      [0x1B, 0x45, 0x00],
  DOUBLE_WH:     [0x1D, 0x21, 0x11],
  DOUBLE_H:      [0x1D, 0x21, 0x01],
  NORMAL_SIZE:   [0x1D, 0x21, 0x00],
  CHARSET_PC850: [0x1B, 0x74, 0x02],
  BAR_HEIGHT:    [0x1D, 0x68, 0x50],
  BAR_WIDTH:     [0x1D, 0x77, 0x02],
  BAR_HRI_BELOW: [0x1D, 0x48, 0x02],
  LF:            [0x0A],
  CUT:           [0x1D, 0x56, 0x00],
};

const PC850 = {
  'é': 0x82, 'â': 0x83, 'à': 0x85, 'ç': 0x87, 'ê': 0x88,
  'è': 0x8A, 'î': 0x8C, 'ì': 0x8D, 'É': 0x90, 'ô': 0x93,
  'ò': 0x95, 'û': 0x96, 'ù': 0x97, 'ÿ': 0x98, 'Ö': 0x99,
  'Ü': 0x9A, 'á': 0xA0, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
  'ñ': 0xA4, 'Ñ': 0xA5, '¿': 0xA8, '¡': 0xAD,
  'Á': 0xB5, 'Í': 0xD6, 'Ó': 0xE0, 'Ú': 0xE9,
};

function encode(text) {
  const bytes = [];
  for (const ch of text) {
    if (PC850[ch] !== undefined) bytes.push(PC850[ch]);
    else if (ch.charCodeAt(0) < 128) bytes.push(ch.charCodeAt(0));
    else bytes.push(0x3F);
  }
  return new Uint8Array(bytes);
}

function twoCol(left, right, width = LINE_WIDTH) {
  const maxLeft = width - right.length;
  return left.slice(0, maxLeft).padEnd(maxLeft) + right;
}

function dots(width = LINE_WIDTH) {
  return '.'.repeat(width);
}

function fmtQty(qty) {
  return parseFloat(qty.toFixed(2)).toString();
}

// Accepts "0x04B8", "1208", or plain number — all resolve correctly
const VENDOR_ID  = Number(import.meta.env.VITE_PRINTER_VENDOR_ID)  || 0;
const PRODUCT_ID = Number(import.meta.env.VITE_PRINTER_PRODUCT_ID) || 0;

export function generateSaleId() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VTA-${date}-${rand}`;
}

export class PrinterService {
  #device = null;
  #interfaceNumber = null;
  #endpointNumber = null;

  isSupported() {
    return 'usb' in navigator;
  }

  isConnected() {
    return this.#device !== null;
  }

  async tryAutoConnect() {
    if (!this.isSupported()) return false;
    try {
      const devices = await navigator.usb.getDevices();
      if (!devices.length) return false;
      const device = (VENDOR_ID && PRODUCT_ID)
        ? devices.find(d => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID)
        : devices[0];
      if (!device) return false;
      this.#device = device;
      await this.#openDevice();
      return true;
    } catch {
      this.#device = null;
      this.#interfaceNumber = null;
      this.#endpointNumber = null;
      return false;
    }
  }

  async connect() {
    if (!this.isSupported())
      throw new Error('WebUSB no disponible. Usa Chrome o Edge.');
    // If VID/PID configured, filter to exact printer; otherwise show all USB printers
    const filters = (VENDOR_ID && PRODUCT_ID)
      ? [{ vendorId: VENDOR_ID, productId: PRODUCT_ID }]
      : [{ classCode: 0x07 }]; // USB Printer class
    this.#device = await navigator.usb.requestDevice({ filters });
    await this.#openDevice();
  }

  async #openDevice() {
    await this.#device.open();
    if (this.#device.configuration === null) {
      await this.#device.selectConfiguration(1);
    }
    // Walk interfaces to find the bulk OUT endpoint
    outer: for (const iface of this.#device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        for (const ep of alt.endpoints) {
          if (ep.direction === 'out' && ep.type === 'bulk') {
            this.#interfaceNumber = iface.interfaceNumber;
            this.#endpointNumber = ep.endpointNumber;
            break outer;
          }
        }
      }
    }
    if (this.#endpointNumber === null) {
      await this.#device.close();
      this.#device = null;
      throw new Error('No se encontró endpoint bulk OUT en la impresora.');
    }
    await this.#device.claimInterface(this.#interfaceNumber);
  }

  async disconnect() {
    try {
      if (this.#device) {
        if (this.#interfaceNumber !== null)
          await this.#device.releaseInterface(this.#interfaceNumber);
        await this.#device.close();
      }
    } finally {
      this.#device = null;
      this.#interfaceNumber = null;
      this.#endpointNumber = null;
    }
  }

  async #send(bytes) {
    await this.#device.transferOut(this.#endpointNumber, new Uint8Array(bytes));
  }

  async #line(text) {
    await this.#device.transferOut(this.#endpointNumber, encode(text + '\n'));
  }

  async printReceipt(sale, biz) {
    if (!this.isConnected()) throw new Error('Impresora no conectada');

    await this.#send(CMD.INIT);
    await this.#send(CMD.CHARSET_PC850);

    // ── Header ─────────────────────────────────
    await this.#send(CMD.ALIGN_CENTER);
    await this.#send(CMD.BOLD_ON);
    await this.#send(CMD.DOUBLE_WH);
    await this.#line(biz.name);
    await this.#send(CMD.NORMAL_SIZE);
    await this.#send(CMD.BOLD_OFF);
    await this.#line(`RUC: ${biz.ruc}`);
    await this.#line(biz.address);
    await this.#line(dots());

    // ── Sale info ──────────────────────────────
    await this.#send(CMD.ALIGN_LEFT);
    await this.#line(`Fecha:   ${sale.date}   ${sale.time}`);
    await this.#line(`Cajero:  ${sale.cajero}`);
    await this.#line(dots());

    // ── Items ──────────────────────────────────
    for (const item of sale.items) {
      const subtotal = (item.price * item.qty).toFixed(2);
      await this.#line(`${item.name} (${item.code})`.slice(0, LINE_WIDTH));
      const left = `  ${fmtQty(item.qty)} ${item.unit}  x  $${item.price.toFixed(3)}`;
      await this.#line(twoCol(left, `$${subtotal}`));
      await this.#line(dots());
    }

    // ── Totals ─────────────────────────────────
    await this.#line(twoCol('Subtotal:', `$ ${sale.total.toFixed(2)}`));
    await this.#line(dots());

    await this.#send(CMD.BOLD_ON);
    await this.#send(CMD.DOUBLE_H);
    await this.#line(twoCol('TOTAL:', `$ ${sale.total.toFixed(2)}`));
    await this.#send(CMD.NORMAL_SIZE);
    await this.#send(CMD.BOLD_OFF);

    await this.#line(twoCol('Recibido:', `$ ${sale.received.toFixed(2)}`));
    await this.#line(twoCol('Cambio:', `$ ${sale.change.toFixed(2)}`));
    await this.#line(dots());

    // ── Payment ────────────────────────────────
    await this.#line(twoCol('EFECTIVO', 'PAGADO'));
    await this.#line(dots());

    // ── Footer ─────────────────────────────────
    await this.#send(CMD.ALIGN_CENTER);
    await this.#send(CMD.LF);
    await this.#send(CMD.BOLD_ON);
    await this.#line('¡Gracias por su compra!');
    await this.#send(CMD.BOLD_OFF);
    await this.#send(CMD.LF);

    // ── Barcode (Code128) ──────────────────────
    await this.#send(CMD.BAR_HEIGHT);
    await this.#send(CMD.BAR_WIDTH);
    await this.#send(CMD.BAR_HRI_BELOW);
    const idBytes = Array.from(sale.saleId).map(c => c.charCodeAt(0));
    await this.#send([0x1D, 0x6B, 0x49, idBytes.length, ...idBytes]);
    await this.#send(CMD.LF);
    await this.#send(CMD.LF);
    await this.#send(CMD.LF);

    // ── Cut ────────────────────────────────────
    await this.#send(CMD.CUT);
  }
}
