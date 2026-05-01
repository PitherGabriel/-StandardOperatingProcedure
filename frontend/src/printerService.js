const LINE_WIDTH = 42;

const CMD = {
  INIT:          [0x1B, 0x40],
  ALIGN_LEFT:    [0x1B, 0x61, 0x00],
  ALIGN_CENTER:  [0x1B, 0x61, 0x01],
  BOLD_ON:       [0x1B, 0x45, 0x01],
  BOLD_OFF:      [0x1B, 0x45, 0x00],
  DOUBLE_WH:     [0x1D, 0x21, 0x11], // double width + height (business name)
  DOUBLE_H:      [0x1D, 0x21, 0x01], // double height only, same width (TOTAL row)
  NORMAL_SIZE:   [0x1D, 0x21, 0x00],
  CHARSET_PC850: [0x1B, 0x74, 0x02],
  BAR_HEIGHT:    [0x1D, 0x68, 0x50], // 80 dots
  BAR_WIDTH:     [0x1D, 0x77, 0x02],
  BAR_HRI_BELOW: [0x1D, 0x48, 0x02],
  LF:            [0x0A],
  CUT:           [0x1D, 0x56, 0x00],
};

// PC850 (Latin-1 Multilingual) byte values for Spanish characters
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
    else bytes.push(0x3F); // '?' for unmapped chars
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

export function generateSaleId() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VTA-${date}-${rand}`;
}

export class PrinterService {
  #port = null;
  #writer = null;

  isSupported() {
    return 'serial' in navigator;
  }

  isConnected() {
    return this.#port !== null;
  }

  async tryAutoConnect() {
    if (!this.isSupported()) return false;
    try {
      const ports = await navigator.serial.getPorts();
      if (!ports.length) return false;
      this.#port = ports[0];
      await this.#port.open({ baudRate: 9600 });
      this.#writer = this.#port.writable.getWriter();
      return true;
    } catch {
      this.#port = null;
      this.#writer = null;
      return false;
    }
  }

  async connect() {
    if (!this.isSupported())
      throw new Error('Web Serial API no disponible. Usa Chrome o Edge.');
    this.#port = await navigator.serial.requestPort();
    await this.#port.open({ baudRate: 9600 });
    this.#writer = this.#port.writable.getWriter();
  }

  async disconnect() {
    try {
      if (this.#writer) {
        this.#writer.releaseLock();
        this.#writer = null;
      }
      if (this.#port) {
        await this.#port.close();
      }
    } finally {
      this.#port = null;
    }
  }

  async #send(bytes) {
    await this.#writer.write(new Uint8Array(bytes));
  }

  async #line(text) {
    await this.#writer.write(encode(text + '\n'));
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
