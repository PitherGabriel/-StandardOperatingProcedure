import { CheckCircle, Printer, X } from 'lucide-react';
import ReceiptPreview from './ReceiptPreview';

export default function PostSaleModal({
  sale,
  biz,
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
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-white rounded-t-xl border-b border-gray-200">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={22} />
            <span className="font-bold text-lg">¡Venta completada!</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 flex justify-center">
          <ReceiptPreview sale={sale} biz={biz} />
        </div>

        <div className="px-5 py-4 bg-white rounded-b-xl border-t border-gray-200 space-y-2">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {isSupported && (
            !connected ? (
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
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition ${
                  printing
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#008cc8] text-white hover:bg-[#0075a7]'
                }`}
              >
                <Printer size={17} />
                {printing ? 'Imprimiendo...' : 'Imprimir Recibo'}
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
