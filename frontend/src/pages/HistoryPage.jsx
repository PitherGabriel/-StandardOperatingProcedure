import { History } from 'lucide-react';

export default function HistoryPage({
  salesHistory,
  filteredHistory,
  filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate,
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Historial de Ventas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio:</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin:</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredHistory.length} de {salesHistory.length} ventas
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No hay ventas en el rango seleccionado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHistory.map((sale, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(`${sale.Fecha}T${sale.Hora}`).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{sale.Nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.Cantidad}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">${sale.PrecioUnitario}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">${sale.Subtotal}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">${sale.TotalVenta}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.Vendedor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
