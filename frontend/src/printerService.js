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

const BRIDGE = (import.meta.env.VITE_PRINT_BRIDGE_URL || 'http://localhost:6543').replace(/\/$/, '');

// ── Byte buffer ────────────────────────────────────────────────────────────
class ByteBuffer {
  #buf = [];

  cmd(...arrays) {
    for (const arr of arrays) this.#buf.push(...arr);
    return this;
  }

  text(str) {
    for (const ch of str + '\n') {
      const b = PC850[ch];
      if (b !== undefined) this.#buf.push(b);
      else if (ch.charCodeAt(0) < 128) this.#buf.push(ch.charCodeAt(0));
      else this.#buf.push(0x3F);
    }
    return this;
  }

  toUint8Array() { return new Uint8Array(this.#buf); }
}

function twoCol(left, right, width = LINE_WIDTH) {
  const maxLeft = width - right.length;
  return left.slice(0, maxLeft).padEnd(maxLeft) + right;
}

function dots(width = LINE_WIDTH) { return '.'.repeat(width); }

function fmtQty(qty) { return parseFloat(qty.toFixed(2)).toString(); }

function buildReceipt(sale, biz) {
  const b = new ByteBuffer();

  b.cmd(CMD.INIT, CMD.CHARSET_PC850);

  // ── Header ─────────────────────────────────
  b.cmd(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_WH).text(biz.name);
  b.cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  b.text(`RUC: ${biz.ruc}`);
  b.text(biz.address);
  b.text(dots());

  // ── Sale info ──────────────────────────────
  b.cmd(CMD.ALIGN_LEFT);
  b.text(`Fecha:   ${sale.date}   ${sale.time}`);
  b.text(`Cajero:  ${sale.cajero}`);
  b.text(dots());

  // ── Items ──────────────────────────────────
  for (const item of sale.items) {
    const subtotal = (item.price * item.qty).toFixed(2);
    b.text(`${item.name} (${item.code})`.slice(0, LINE_WIDTH));
    const left = `  ${fmtQty(item.qty)} ${item.unit}  x  $${item.price.toFixed(3)}`;
    b.text(twoCol(left, `$${subtotal}`));
    b.text(dots());
  }

  // ── Totals ─────────────────────────────────
  b.text(twoCol('Subtotal:', `$ ${sale.total.toFixed(2)}`));
  b.text(dots());
  b.cmd(CMD.BOLD_ON, CMD.DOUBLE_H).text(twoCol('TOTAL:', `$ ${sale.total.toFixed(2)}`));
  b.cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  b.text(twoCol('Recibido:', `$ ${sale.received.toFixed(2)}`));
  b.text(twoCol('Cambio:', `$ ${sale.change.toFixed(2)}`));
  b.text(dots());

  // ── Payment ────────────────────────────────
  b.text(twoCol('EFECTIVO', 'PAGADO'));
  b.text(dots());

  // ── Footer ─────────────────────────────────
  b.cmd(CMD.ALIGN_CENTER, CMD.LF, CMD.BOLD_ON);
  b.text('¡Gracias por su compra!');
  b.cmd(CMD.BOLD_OFF, CMD.LF);

  // ── Barcode (Code128) ──────────────────────
  b.cmd(CMD.BAR_HEIGHT, CMD.BAR_WIDTH, CMD.BAR_HRI_BELOW);
  const idBytes = Array.from(sale.saleId).map(c => c.charCodeAt(0));
  b.cmd([0x1D, 0x6B, 0x49, idBytes.length, ...idBytes]);
  b.cmd(CMD.LF, CMD.LF, CMD.LF);

  // ── Cut ────────────────────────────────────
  b.cmd(CMD.CUT);

  return b.toUint8Array();
}

export function generateSaleId() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VTA-${date}-${rand}`;
}

export class PrinterService {
  #connected = false;

  isSupported() { return true; }

  isConnected() { return this.#connected; }

  async tryAutoConnect() {
    try {
      const res = await fetch(`${BRIDGE}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      this.#connected = res.ok;
    } catch {
      this.#connected = false;
    }
    return this.#connected;
  }

  async connect() {
    const ok = await this.tryAutoConnect();
    if (!ok) throw new Error(`Bridge no disponible en ${BRIDGE} — ejecuta bridge.py en Windows`);
  }

  async disconnect() {
    this.#connected = false;
  }

  async printReceipt(sale, biz) {
    if (!this.#connected) throw new Error('Impresora no conectada');
    const bytes = buildReceipt(sale, biz);
    let res;
    try {
      res = await fetch(`${BRIDGE}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: bytes,
      });
    } catch {
      this.#connected = false;
      throw new Error('Bridge desconectado — verifica que bridge.py esté corriendo');
    }
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error);
    }
  }
}
