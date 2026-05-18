import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, Receipt } from 'lucide-react';
import { fetchSalesChart } from '../services/salesService';
import { KpiCardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
];

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-[#008cc8]">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const CustomTooltipSales = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-green-600">{payload[0].value} venta{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function DashboardPage() {
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

  // For today, only show up to the current hour to avoid a long flat tail
  const trimmedPoints = period === 'today'
    ? points.filter((_, i) => i <= points.findLastIndex(p => p.revenue > 0 || p.sales > 0) + 1)
    : points;

  const displayPoints = trimmedPoints.length > 0 ? trimmedPoints : points;

  return (
    <div className="space-y-5">
      {/* Period toggle */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              period === p.id
                ? 'bg-[#008cc8] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <KpiCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-[#008cc8]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ingresos</p>
              <p className="text-2xl font-bold text-gray-800">${chartData?.total_revenue?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <ShoppingCart size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ventas</p>
              <p className="text-2xl font-bold text-gray-800">{chartData?.total_sales ?? 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Receipt size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-800">${chartData?.avg_ticket?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue chart */}
      {loading ? (
        <ChartSkeleton height="h-64" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ingresos</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={displayPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008cc8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#008cc8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={55} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#008cc8"
                strokeWidth={2}
                fill="url(#gradRevenue)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales count chart */}
      {loading ? (
        <ChartSkeleton height="h-44" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Número de Ventas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={displayPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<CustomTooltipSales />} />
              <Bar dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
