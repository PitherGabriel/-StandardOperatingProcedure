import { useEffect, useState } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { CurrencyDollar as DollarSign, CalendarBlank, ArrowUpRight, ArrowDownRight, DownloadSimple as Download, Spinner as Loader } from '@phosphor-icons/react';
import { fetchSalesChart, fetchProfitAnalysis } from '../services/salesService';
import { ChartSkeleton } from '../components/ui/Skeleton';
import DateRangePicker from '../components/dashboard/DateRangePicker';
import { presetRange, fmtRangeLong } from '../components/dashboard/dateRange';
import DataTable from '../components/dashboard/DataTable';
import FolderCard from '../components/ui/FolderCard';

// Chart colors mirror the accent-* design tokens (recharts needs literal colors).
const ACCENT = '#6366f1';      // accent-500 (indigo)
const GRID = '#eef0f4';        // subtle grid on white
const AXIS = '#9ca3af';        // gray-400

const money = (n) => `$${(n ?? 0).toFixed(2)}`;
const BASE = (import.meta.env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');

const ChartCard = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-accent-700">{format(payload[0].value)}</p>
    </div>
  );
};

function Trend({ value }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
        up ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
      }`}
    >
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(value)}%
    </span>
  );
}

function HeroKpiCard({ icon, title, subtitle, value, trend, barLabel, barValue, metrics = [] }) {
  const Icon = icon;
  const pct = Math.max(0, Math.min(100, Number(barValue) || 0));
  return (
    <FolderCard innerClassName="p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Icon size={18} weight="bold" className="text-accent-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xl text-ink leading-tight">{title}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>

      <p className="text-4xl font-bold text-gray-900 mt-5">{value}</p>
      {trend != null && (
        <div className="flex items-center gap-2 mt-3">
          <Trend value={trend} />
          <span className="text-xs text-gray-400">vs período anterior</span>
        </div>
      )}

      {/* Margen progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-500">{barLabel}</span>
          <span className="font-semibold text-ink">{barValue}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Secondary metrics */}
      {metrics.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{m.label}</span>
              <span className="font-semibold text-ink">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </FolderCard>
  );
}

export default function DashboardPage({ currentUser, showNotification }) {
  const [range, setRange] = useState(() => presetRange('today'));
  const [chartData, setChartData] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // The selected range drives both the time-series (chart) and the aggregate
  // profit analysis (KPIs, breakdown, tables) — including arbitrary custom ranges.
  const load = async (r) => {
    setLoading(true);
    try {
      const [chartRes, profitRes] = await Promise.all([
        fetchSalesChart(r.preset, r.start, r.end),
        fetchProfitAnalysis(r.preset, r.start, r.end),
      ]);
      // Clear on failure so a new range never shows the previous range's data.
      // (The chart endpoint has no custom-range support yet, so a custom range
      // returns success:false — handled by the "no disponible" note below.)
      setChartData(chartRes.success ? chartRes.data : null);
      setProfit(profitRes.success ? profitRes.data : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range]);

  const points = chartData
    ? chartData.labels.map((label, i) => ({
        label,
        revenue: chartData.revenue[i],
        sales: chartData.sales_count[i],
      }))
    : [];

  const trimmedPoints = range.preset === 'today'
    ? points.filter((_, i) => i <= points.findLastIndex(p => p.revenue > 0 || p.sales > 0) + 1)
    : points;
  const displayPoints = trimmedPoints.length > 0 ? trimmedPoints : points;

  const firstName = (currentUser?.nombre || currentUser?.username || '').split(' ')[0];

  // Excel export of the cierre de caja for the selected range. The backend's
  // export endpoint understands today/week/month + custom (start/end), so any
  // other preset (Ayer, Mes pasado) is sent as a custom range.
  const handleExport = async () => {
    setExporting(true);
    try {
      const period = ['today', 'week', 'month'].includes(range.preset) ? range.preset : 'custom';
      const params = new URLSearchParams({ period });
      if (period === 'custom') {
        params.set('start_date', range.start);
        params.set('end_date', range.end);
      }
      const res = await fetch(`${BASE}/sales/export?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('No se pudo generar el archivo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cierre_caja_${range.start}_a_${range.end}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showNotification?.(`Error al exportar: ${e.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting + date-range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Hola{firstName ? `, ${firstName}` : ''}!
          </h2>
          <p className="text-gray-500 mt-1 flex items-center gap-1.5 text-sm">
            <CalendarBlank size={14} weight="fill" className="text-accent-500 shrink-0" />
            <span>Mostrando datos de: <span className="font-medium text-gray-700">{fmtRangeLong(range.start, range.end)}</span></span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-white shadow-sm rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink hover:shadow transition disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {exporting
              ? <Loader size={16} className="animate-spin text-accent-600" />
              : <Download size={16} className="text-accent-600" />}
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {/* Hero KPI (Ingresos) + Ingresos chart, side by side */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSkeleton height="h-80" />
          <div className="lg:col-span-2"><ChartSkeleton height="h-80" /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HeroKpiCard
            icon={DollarSign}
            title="Ingresos"
            subtitle={range.label}
            value={money(profit?.total_ingresos)}
            trend={profit?.revenue_trend}
            barLabel="Margen"
            barValue={profit?.margen_total ?? 0}
            metrics={[
              { label: 'Costos', value: money(profit?.total_costos) },
              { label: 'Utilidad neta', value: money(profit?.utilidad_neta) },
              { label: 'Ventas', value: profit?.total_ventas ?? 0 },
              { label: 'Unidades', value: profit?.total_unidades ?? 0 },
            ]}
          />
          <FolderCard side="right" mobileSide="left" className="lg:col-span-2" innerClassName="p-5">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-left lg:text-right">Ingresos</h3>
            <div className="flex-1 min-h-65">
              {!chartData ? (
                <div className="h-full flex items-center justify-center text-center text-sm text-gray-400 px-4">
                  Gráfico no disponible para este rango
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={55} />
                  <Tooltip content={(p) => <ChartCard {...p} format={money} />} />
                  <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2}
                    fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </FolderCard>
        </div>
      )}

      {/* Detail tables */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataTable
            title="Productos más rentables"
            rows={profit?.productos_vendidos ?? []}
            columns={[
              { key: 'producto', label: 'Producto', className: 'font-medium text-gray-900' },
              { key: 'cantidad', label: 'Cant.', align: 'right', render: (r) => Math.round(r.cantidad) },
              { key: 'ingresos', label: 'Ingresos', align: 'right', render: (r) => money(r.ingresos) },
              { key: 'utilidad', label: 'Utilidad', align: 'right', className: 'font-semibold text-success', render: (r) => money(r.utilidad) },
            ]}
          />
          <DataTable
            title="Rendimiento por vendedor"
            rows={profit?.vendedores ?? []}
            columns={[
              { key: 'vendedor', label: 'Vendedor', className: 'font-medium text-gray-900' },
              { key: 'ventas', label: 'Ventas', align: 'right' },
              { key: 'ingresos', label: 'Ingresos', align: 'right', render: (r) => money(r.ingresos) },
              { key: 'utilidad', label: 'Utilidad', align: 'right', className: 'font-semibold text-success', render: (r) => money(r.utilidad) },
            ]}
          />
        </div>
      )}
    </div>
  );
}
