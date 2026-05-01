import { CheckCircle, Printer, X } from 'lucide-react';

export default function PostSaleModal({
  sale,
  connected,
  printing,
  error,
  isSupported,
  onConnect,
  onPrint,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={22} />
            <span className="font-bold text-lg">¡Venta completada!</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Sale summary */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}</span>
            <span className="font-mono text-xs">{sale.saleId}</span>
          </div>
          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>$ {sale.total.toFixed(2)}</span>
          </div>
          {sale.received > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Recibido</span>
              <span>$ {sale.received.toFixed(2)}</span>
            </div>
          )}
          {sale.change > 0 && (
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Cambio</span>
              <span>$ {sale.change.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Printer section */}
        {isSupported && (
          <div className="space-y-2">
            {error && (
              <p className="text-red-500 text-xs px-1">{error}</p>
            )}
            {!connected ? (
              <button
                onClick={onConnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                <Printer size={17} />
                Conectar impresora
              </button>
            ) : (
              <button
                onClick={onPrint}
                disabled={printing}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition
                  ${printing
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#008cc8] text-white hover:bg-[#0075a7]'}`}
              >
                <Printer size={17} />
                {printing ? 'Imprimiendo...' : 'Imprimir Recibo'}
              </button>
            )}
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Cerrar
        </button>

      </div>
    </div>
  );
}
