import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, ShoppingCart, Receipt, ArrowUpRight, ArrowDownRight,
  PackageX, AlertTriangle,
} from 'lucide-react';
import { fetchSalesChart } from '../services/salesService';
import { KpiCardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';

// Chart colors mirror the forest-* design tokens (recharts needs literal colors).
const GREEN = '#1b843f';       // forest-500
const GRID = '#f3f4f6';        // gray-100
const AXIS = '#9ca3af';        // gray-400

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
];

const money = (n) => `$${(n ?? 0).toFixed(2)}`;

const ChartCard = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-forest-700">{format(payload[0].value)}</p>
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

function KpiCard({ icon, label, value, trend, spark }) {
  const Icon = icon;
  const gid = `spark-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-forest-500/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-forest-600" />
        </div>
        <Trend value={trend} />
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-4">{label}</p>
      <div className="flex items-end justify-between gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {spark?.length > 1 && (
          <div className="w-24 h-9 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={GREEN} strokeWidth={1.5}
                  fill={`url(#${gid})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({ currentUser, inventory = [] }) {
  const [period, setPeriod] = useState('today');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (p) => {
    setLoading(true);
    try {
      const res = await fetchSalesChart(p);
      if (res.success) setChartData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(period); }, [period]);

  const points = chartData
    ? chartData.labels.map((label, i) => ({
        label,
        revenue: chartData.revenue[i],
        sales: chartData.sales_count[i],
      }))
    : [];

  const trimmedPoints = period === 'today'
    ? points.filter((_, i) => i <= points.findLastIndex(p => p.revenue > 0 || p.sales > 0) + 1)
    : points;
  const displayPoints = trimmedPoints.length > 0 ? trimmedPoints : points;

  const revenueSpark = displayPoints.map(p => ({ v: p.revenue }));
  const salesSpark = displayPoints.map(p => ({ v: p.sales }));

  const firstName = (currentUser?.nombre || currentUser?.username || '').split(' ')[0];
  const lowStock = inventory
    .filter(p => p.cantidad <= p.minStock)
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting + period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Hola{firstName ? `, ${firstName}` : ''}! 👋
          </h2>
          <p className="text-gray-500 mt-1">Este es el resumen de tu negocio.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                period === p.id
                  ? 'bg-forest-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <KpiCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={DollarSign} label="Ingresos" value={money(chartData?.total_revenue)}
            trend={chartData?.revenue_trend} spark={revenueSpark} />
          <KpiCard icon={ShoppingCart} label="Ventas" value={chartData?.total_sales ?? 0}
            trend={chartData?.sales_trend} spark={salesSpark} />
          <KpiCard icon={Receipt} label="Ticket promedio" value={money(chartData?.avg_ticket)}
            trend={chartData?.ticket_trend} spark={revenueSpark} />
        </div>
      )}

      {/* Revenue chart + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="lg:col-span-2"><ChartSkeleton height="h-64" /></div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ingresos</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={displayPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={55} />
                <Tooltip content={(p) => <ChartCard {...p} format={money} />} />
                <Area type="monotone" dataKey="revenue" stroke={GREEN} strokeWidth={2}
                  fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Low stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock bajo</h3>
          {lowStock.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-8">
              Todo en orden
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map(p => {
                const out = p.cantidad === 0;
                return (
                  <div key={p.codigo} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      out ? 'bg-red-50' : 'bg-yellow-50'
                    }`}>
                      {out
                        ? <PackageX size={15} className="text-danger" />
                        : <AlertTriangle size={15} className="text-yellow-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {out ? 'Sin stock' : `Quedan ${p.cantidad} / mín. ${p.minStock}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      out ? 'bg-red-50 text-danger' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {out ? 'Agotado' : 'Bajo'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sales count chart */}
      {loading ? (
        <ChartSkeleton height="h-44" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Número de ventas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={displayPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={(p) => <ChartCard {...p} format={(v) => `${v} venta${v !== 1 ? 's' : ''}`} />} />
              <Bar dataKey="sales" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
