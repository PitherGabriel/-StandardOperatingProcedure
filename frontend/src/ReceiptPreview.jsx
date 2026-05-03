import Barcode from 'react-barcode';

const W = 42;
const MONO = '"Courier New", Courier, monospace';

function dots() { return '.'.repeat(W); }
function fmtQty(qty) { return parseFloat(qty.toFixed(2)).toString(); }

function Line({ text = '', center = false, bold = false, large = false }) {
  return (
    <div style={{
      fontFamily: MONO,
      fontSize: large ? '13px' : '11px',
      fontWeight: bold ? 'bold' : 'normal',
      textAlign: center ? 'center' : 'left',
      whiteSpace: 'pre',
      lineHeight: '1.5',
      color: '#111',
    }}>
      {text}
    </div>
  );
}

function Row({ left, right, bold = false, large = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: MONO,
      fontSize: large ? '13px' : '11px',
      fontWeight: bold ? 'bold' : 'normal',
      lineHeight: '1.5',
      color: '#111',
    }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export default function ReceiptPreview({ sale, biz }) {
  return (
    <div style={{
      background: 'white',
      padding: '16px 12px',
      width: '320px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    }}>
      {/* Header */}
      <Line text={biz.name} center bold large />
      <Line text={`RUC: ${biz.ruc}`} center />
      <Line text={biz.address} center />
      <Line text={dots()} />

      {/* Sale info */}
      <Line text={`Fecha:   ${sale.date}   ${sale.time}`} />
      <Line text={`Cajero:  ${sale.cajero}`} />
      <Line text={dots()} />

      {/* Items */}
      {sale.items.map((item, i) => {
        const subtotal = (item.price * item.qty).toFixed(2);
        return (
          <div key={i}>
            <Line text={item.name.slice(0, W)} />
            <Row
              left={`  ${fmtQty(item.qty)} ${item.unit}  x  $${item.price.toFixed(3)}`}
              right={`$${subtotal}`}
            />
            <Line text={dots()} />
          </div>
        );
      })}

      {/* Totals */}
      <Row left="Subtotal:" right={`$ ${sale.total.toFixed(2)}`} />
      <Line text={dots()} />
      <Row left="TOTAL:" right={`$ ${sale.total.toFixed(2)}`} bold large />
      <Row left="Recibido:" right={`$ ${sale.received.toFixed(2)}`} />
      <Row left="Cambio:" right={`$ ${sale.change.toFixed(2)}`} />
      <Line text={dots()} />

      {/* Payment */}
      <Row left="EFECTIVO" right="PAGADO" />
      <Line text={dots()} />

      {/* Footer */}
      <Line text="¡Gracias por su compra!" center bold />

      {/* Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <Barcode
          value={sale.saleId}
          format="CODE128"
          width={1.2}
          height={50}
          fontSize={10}
          margin={0}
          displayValue
        />
      </div>
    </div>
  );
}
