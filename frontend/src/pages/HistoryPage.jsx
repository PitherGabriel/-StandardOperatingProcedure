import { useState, useMemo } from 'react';
import { History, RotateCcw, X, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { refundSale } from '../services/salesService';

// ── Refund Modal ──────────────────────────────────────────────────────────────
function RefundModal({ sale, onClose, onRefunded, showNotification }) {
  const [selectedItems, setSelectedItems] = useState(
    sale.items.map(item => ({ ...item, selected: true, refundQty: item.Cantidad }))
  );
  const [processing, setProcessing] = useState(false);

  const toggle = (idx) => setSelectedItems(s => s.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  const setQty = (idx, qty) => setSelectedItems(s => s.map((it, i) => i === idx ? { ...it, refundQty: qty } : it));

  const handleRefund = async () => {
    const toRefund = selectedItems.filter(i => i.selected && i.refundQty > 0);
    if (toRefund.length === 0) { showNotification('Selecciona al menos un ítem', 'error'); return; }
    setProcessing(true);
    try {
      const result = await refundSale(sale.VentaID, toRefund.map(i => ({
        codigo: i.Codigo,
        cantidad: parseFloat(i.refundQty),
      })));
      if (result.success) {
        showNotification(`Devolución procesada correctamente`, 'success');
        onRefunded();
        onClose();
      } else {
        showNotification(result.error || 'Error al procesar devolución', 'error');
      }
    } catch (e) {
      showNotification(`Error: ${e.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">Procesar Devolución</h2>
            <p className="text-xs text-gray-500 mt-0.5">Venta: {sale.VentaID}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          {selectedItems.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition ${item.selected ? 'border-[#008cc8] bg-blue-50' : 'border-gray-200'}`}>
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggle(i)}
                className="w-4 h-4 text-[#008cc8] rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.Nombre}</p>
                <p className="text-xs text-gray-500">Código: {item.Codigo} · Precio: ${item.PrecioUnitario}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Cant.:</span>
                <input
                  type="number"
                  min="0.01"
                  max={item.Cantidad}
                  step="0.01"
                  value={item.refundQty}
                  onChange={e => setQty(i, e.target.value)}
                  disabled={!item.selected}
                  className="w-16 text-center text-sm border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#008cc8] disabled:bg-gray-100 disabled:text-gray-400"
                />
                <span className="text-xs text-gray-400">/ {item.Cantidad}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm">
            Cancelar
          </button>
          <button onClick={handleRefund} disabled={processing}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {processing ? <Loader size={16} className="animate-spin" /> : <><RotateCcw size={15} />Devolver</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History Page ──────────────────────────────────────────────────────────────
export default function HistoryPage({
  salesHistory,
  filteredHistory,
  filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate,
  onHistoryChange,
  showNotification,
}) {
  const [refundSaleData, setRefundSaleData] = useState(null);
  const [expandedSales, setExpandedSales] = useState(new Set());

  // Group flat history rows by VentaID
  const groupedSales = useMemo(() => {
    const map = new Map();
    for (const row of filteredHistory) {
      const id = row.VentaID;
      if (!map.has(id)) {
        map.set(id, { VentaID: id, Fecha: row.Fecha, Hora: row.Hora, Vendedor: row.Vendedor, items: [], total: 0 });
      }
      const sale = map.get(id);
      sale.items.push(row);
      sale.total = parseFloat(row.Total || row.TotalVenta || 0);
    }
    return [...map.values()].sort((a, b) => `${b.Fecha} ${b.Hora}`.localeCompare(`${a.Fecha} ${a.Hora}`));
  }, [filteredHistory]);

  const toggleExpand = (id) => setExpandedSales(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const isRefund = (sale) => sale.VentaID.startsWith('DEV-');

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Historial de Ventas</h2>
            <span className="text-sm text-gray-500">{groupedSales.length} transacciones</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio:</label>
              <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin:</label>
              <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Limpiar Filtros
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredHistory.length} líneas en {groupedSales.length} transacciones
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {groupedSales.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No hay ventas en el rango seleccionado</p>
            </div>
          ) : (
            groupedSales.map(sale => {
              const expanded = expandedSales.has(sale.VentaID);
              const isDevolucion = isRefund(sale);
              return (
                <div key={sale.VentaID} className={isDevolucion ? 'bg-red-50' : ''}>
                  {/* Sale header row */}
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(sale.VentaID)}>
                    <button className="text-gray-400 shrink-0">
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-medium ${isDevolucion ? 'text-red-600' : 'text-[#008cc8]'}`}>
                          {sale.VentaID}
                        </span>
                        {isDevolucion && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">DEVOLUCIÓN</span>}
                        <span className="text-xs text-gray-500">
                          {new Date(`${sale.Fecha}T${sale.Hora}`).toLocaleString('es-EC')}
                        </span>
                        <span className="text-xs text-gray-400">{sale.Vendedor}</span>
                      </div>
                      <div className="text-xs text-gray-500">{sale.items.length} ítem{sale.items.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-semibold text-sm ${isDevolucion ? 'text-red-600' : 'text-gray-800'}`}>
                        {isDevolucion ? '-' : ''}${sale.total.toFixed(2)}
                      </span>
                      {!isDevolucion && (
                        <button
                          onClick={e => { e.stopPropagation(); setRefundSaleData(sale); }}
                          title="Procesar devolución"
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition"
                        >
                          <RotateCcw size={13} />
                          Devolver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded item rows */}
                  {expanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 uppercase">
                            <th className="px-6 py-2 text-left">Producto</th>
                            <th className="px-6 py-2 text-right">Cantidad</th>
                            <th className="px-6 py-2 text-right">Precio</th>
                            <th className="px-6 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sale.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white">
                              <td className="px-6 py-2 text-gray-800">{item.Nombre}</td>
                              <td className="px-6 py-2 text-right text-gray-600">{item.Cantidad}</td>
                              <td className="px-6 py-2 text-right text-gray-600">${item.PrecioUnitario}</td>
                              <td className="px-6 py-2 text-right font-medium text-gray-800">${item.Subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {refundSaleData && (
        <RefundModal
          sale={refundSaleData}
          onClose={() => setRefundSaleData(null)}
          onRefunded={() => { onHistoryChange?.(); }}
          showNotification={showNotification}
        />
      )}
    </>
  );
}
