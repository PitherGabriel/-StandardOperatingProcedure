import { useState } from 'react';
import { Minus, TrendingUp, CircleDollarSign, Download, Loader, Banknote, CreditCard, ArrowRightLeft } from 'lucide-react';
import { KpiCardSkeleton } from '../components/ui/Skeleton';

const METODO_CONFIG = {
  efectivo:      { label: 'Efectivo',      Icon: Banknote,       borderCls: 'border-green-500',  bgCls: 'bg-green-50',  textCls: 'text-green-700',  iconCls: 'text-green-500'  },
  tarjeta:       { label: 'Tarjeta',       Icon: CreditCard,     borderCls: 'border-blue-500',   bgCls: 'bg-blue-50',   textCls: 'text-blue-700',   iconCls: 'text-blue-500'   },
  transferencia: { label: 'Transferencia', Icon: ArrowRightLeft, borderCls: 'border-purple-500', bgCls: 'bg-purple-50', textCls: 'text-purple-700', iconCls: 'text-purple-500' },
};

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
  { id: 'custom', label: 'Personalizado' },
];

const BASE = (import.meta.env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');

export default function ProfitsPage({
  loading = false,
  profitAnalysis,
  selectedPeriod, setSelectedPeriod,
  customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate,
  onLoadProfits,
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ period: selectedPeriod });
      if (selectedPeriod === 'custom') {
        params.set('start_date', customStartDate);
        params.set('end_date', customEndDate);
      }
      const res = await fetch(`${BASE}/sales/export?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cierre_caja_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Error al exportar: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Cierre de caja</h2>
          {profitAnalysis && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm disabled:opacity-60"
            >
              {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              Exportar Excel
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPeriod(p.id);
                if (p.id !== 'custom') onLoadProfits(p.id);
              }}
              className={`px-4 py-3 rounded-lg font-semibold transition ${
                selectedPeriod === p.id
                  ? 'bg-[#008cc8] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => onLoadProfits('custom')}
                className="w-full px-4 py-2 bg-[#008cc8] text-white rounded-lg hover:bg-[#0176a8] transition"
              >
                Consultar
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <KpiCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && profitAnalysis && (
        <>
          <div className="bg-linear-to-r from-[#008cc8] to-[#0070a0] text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-center">{profitAnalysis.periodo}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ingresos', value: `$${profitAnalysis.total_ingresos}`, color: 'blue', Icon: TrendingUp },
              { label: 'Costos', value: `$${profitAnalysis.total_costos}`, color: 'red', Icon: Minus },
              { label: 'Utilidad Neta', value: `$${profitAnalysis.utilidad_neta}`, color: 'green', Icon: CircleDollarSign },
              { label: 'Margen', value: `${profitAnalysis.margen_total}%`, color: 'purple', Icon: TrendingUp },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-white p-6 rounded-lg shadow-lg border-l-4 border-${kpi.color}-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{kpi.label}</p>
                    <p className={`text-2xl font-bold text-${kpi.color}-600 mt-1`}>{kpi.value}</p>
                  </div>
                  <kpi.Icon className={`text-${kpi.color}-500`} size={32} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Total de Ventas</p>
              <p className="text-xl font-bold text-gray-800">{profitAnalysis.total_ventas}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Unidades Vendidas</p>
              <p className="text-xl font-bold text-gray-800">{profitAnalysis.total_unidades}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Ticket Promedio</p>
              <p className="text-xl font-bold text-gray-800">${profitAnalysis.ticket_promedio}</p>
            </div>
          </div>

          {profitAnalysis.metodo_pago_breakdown?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Ingresos por Método de Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {profitAnalysis.metodo_pago_breakdown.map(({ metodo, ingresos, transacciones }) => {
                  const cfg = METODO_CONFIG[metodo] || {
                    label: metodo, Icon: CircleDollarSign,
                    borderCls: 'border-gray-400', bgCls: 'bg-gray-50', textCls: 'text-gray-700', iconCls: 'text-gray-500',
                  };
                  const { label, Icon, borderCls, bgCls, textCls, iconCls } = cfg;
                  return (
                    <div key={metodo} className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${borderCls} ${bgCls}`}>
                      <Icon className={`${iconCls} shrink-0`} size={28} />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                        <p className={`text-xl font-bold ${textCls}`}>${ingresos.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{transacciones} línea{transacciones !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profitAnalysis.productos_vendidos?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Top 10 Productos Más Rentables</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {profitAnalysis.productos_vendidos.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{p.producto}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{p.cantidad.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">${p.ingresos.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">${p.costos.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">${p.utilidad.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profitAnalysis.vendedores?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">Rendimiento por Vendedor</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {profitAnalysis.vendedores.map((v, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{v.vendedor}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{v.ventas}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">${v.ingresos.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">${v.utilidad.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
