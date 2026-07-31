import { useState, useEffect, useRef } from 'react';
import { Menu, Printer, Bell, PackageX, AlertTriangle } from 'lucide-react';

const TITLES = {
  pos: 'Caja',
  dashboard: 'Dashboard',
  productos: 'Productos',
  history: 'Historial',
  profits: 'Utilidades',
};

export default function Topbar({ activeTab, printer, showNotification, alerts = [], onMenuClick }) {
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const prevConnected = useRef(printer?.connected ?? false);

  useEffect(() => {
    if (printer?.connected && !prevConnected.current) {
      showNotification?.('Impresora conectada correctamente', 'success');
    }
    prevConnected.current = printer?.connected ?? false;
  }, [printer?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const outOfStock = alerts.filter(a => a.cantidad === 0);
  const lowStock = alerts.filter(a => a.cantidad > 0);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{TITLES[activeTab] || 'Comercial TB'}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Printer */}
        {printer && (
          <button
            onClick={printer.connected ? undefined : printer.connect}
            title={printer.connected ? 'Impresora conectada' : 'Conectar impresora'}
            className={`p-2 rounded-lg transition ${
              printer.connected
                ? 'bg-forest-500/10 text-forest-700 cursor-default'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Printer size={18} />
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(o => !o)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            title="Notificaciones"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {alerts.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900">Notificaciones</p>
                {alerts.length > 0 && (
                  <span className="text-xs bg-red-100 text-danger font-semibold px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">Sin notificaciones</div>
                ) : (
                  <>
                    {outOfStock.map(a => (
                      <div key={a.codigo} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <PackageX size={16} className="text-danger mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.nombre}</p>
                          <p className="text-xs text-danger font-semibold">Sin stock</p>
                        </div>
                      </div>
                    ))}
                    {lowStock.map(a => (
                      <div key={a.codigo} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.nombre}</p>
                          <p className="text-xs text-gray-400">
                            Stock: <span className="text-yellow-600 font-semibold">{a.cantidad}</span> / mín. {a.minStock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
