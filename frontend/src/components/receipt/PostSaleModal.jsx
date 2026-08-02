import { useState } from 'react';
import { CheckCircle, Printer, X, FileText, Spinner as Loader } from '@phosphor-icons/react';
import ReceiptPreview from './ReceiptPreview';
import { processInvoicedSale } from '../../services/salesService';

// ── Invoice form ──────────────────────────────────────────────────────────────
function InvoiceForm({ sale, showNotification }) {
  const [form, setForm] = useState({ identificacion: '', razon_social: '', email: '', direccion: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.identificacion || !form.razon_social || !form.email) {
      showNotification('Identificación, razón social y email son requeridos', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await processInvoicedSale(
        sale.cart, sale.vendedor, sale.metodoPago, sale.referencia, sale.discountPct, form,
      );
      if (res.success) {
        setResult({ ok: true, invoice: res.invoice });
        showNotification('Factura electrónica emitida correctamente', 'success');
      } else {
        setResult({ ok: false, error: res.error || 'Error al emitir factura' });
        showNotification(res.error || 'Error al emitir factura', 'error');
      }
    } catch (e) {
      setResult({ ok: false, error: e.message });
      showNotification(`Error: ${e.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.ok) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-1 text-sm">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <CheckCircle size={15} /> Autorizada por el SRI
        </div>
        <p className="text-gray-600">Número: <span className="font-mono font-medium">{result.invoice.numero_factura}</span></p>
        <p className="text-gray-400 text-xs">Copia enviada al correo del cliente.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2.5">
      {[
        { key: 'identificacion', label: 'RUC / Cédula / Pasaporte', placeholder: '9999999999' },
        { key: 'razon_social',   label: 'Razón social / Nombre',    placeholder: 'Juan Pérez' },
        { key: 'email',          label: 'Email',                     placeholder: 'cliente@email.com', type: 'email' },
        { key: 'direccion',      label: 'Dirección (opcional)',       placeholder: 'Calle…' },
      ].map(({ key, label, placeholder, type = 'text' }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={e => update(key, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
          />
        </div>
      ))}
      {result?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{result.error}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full px-4 py-2 bg-[#008cc8] text-white rounded-lg text-sm font-semibold hover:bg-[#0075a7] transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting ? <Loader size={14} className="animate-spin" /> : <FileText size={14} />}
        Emitir factura
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PostSaleModal({
  sale,
  biz,
  printing,
  error,
  isSupported,
  onPrint,
  onClose,
  showNotification,
}) {
  const [showInvoice, setShowInvoice] = useState(false);

  const paymentLabel = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
  }[sale.metodoPago] || 'Efectivo';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={22} />
            <span className="font-bold text-lg text-gray-800">¡Venta completada!</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 min-h-0 divide-x divide-gray-100">

          {/* Left: receipt preview */}
          <div className="flex-1 overflow-y-auto py-6 flex justify-center bg-gray-50 rounded-bl-2xl">
            <ReceiptPreview sale={sale} biz={biz} />
          </div>

          {/* Right: actions */}
          <div className="w-72 shrink-0 flex flex-col p-6 gap-4 overflow-y-auto">

            {/* Payment summary */}
            <div className="space-y-1.5 pb-4 border-b border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-800">${sale.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Método de pago</span>
                <span className="font-semibold text-gray-700">{paymentLabel}</span>
              </div>
              {sale.discountPct > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Descuento</span>
                  <span className="font-semibold text-orange-600">{sale.discountPct}%</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {/* Print */}
              <button
                onClick={onPrint}
                disabled={printing || !isSupported}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition text-sm ${
                  !isSupported
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : printing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#008cc8] text-white hover:bg-[#0075a7]'
                }`}
              >
                <Printer size={17} />
                {printing ? 'Imprimiendo...' : 'Imprimir Recibo'}
              </button>

              {/* Invoice */}
              <button
                onClick={() => setShowInvoice(v => !v)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition text-sm border ${
                  showInvoice
                    ? 'bg-[#008cc8]/10 border-[#008cc8] text-[#008cc8]'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#008cc8] hover:text-[#008cc8]'
                }`}
              >
                <FileText size={17} />
                Generar Factura
              </button>
            </div>

            {/* Invoice form — expands below buttons */}
            {showInvoice && (
              <InvoiceForm sale={sale} showNotification={showNotification} />
            )}

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Close */}
            <div className="mt-auto pt-2">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
