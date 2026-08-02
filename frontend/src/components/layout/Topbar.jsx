import { useState, useEffect, useRef } from 'react';
import { List as Menu, MagnifyingGlass as Search, Printer, Bell, Prohibit as PackageX, Warning as AlertTriangle } from '@phosphor-icons/react';

const TITLES = {
  pos: 'Caja',
  dashboard: 'Dashboard',
  productos: 'Productos',
  history: 'Historial',
};

function initials(user) {
  const name = user?.nombre || user?.username || '';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function Topbar({ activeTab, printer, showNotification, alerts = [], onMenuClick, currentUser }) {
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
    <header className="h-16 shrink-0 bg-canvas flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-white lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-2xl font-bold text-ink">{TITLES[activeTab] || 'Comercial TB'}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => showNotification?.('Búsqueda global — próximamente', 'info')}
          title="Buscar"
          className="p-2.5 rounded-full bg-white shadow-sm text-gray-500 hover:text-ink transition"
        >
          <Search size={18} />
        </button>

        {/* Printer */}
        {printer && (
          <button
            onClick={printer.connected ? undefined : printer.connect}
            title={printer.connected ? 'Impresora conectada' : 'Conectar impresora'}
            className={`p-2.5 rounded-full transition shadow-sm ${
              printer.connected
                ? 'bg-accent-500/10 text-accent-600 cursor-default'
                : 'bg-white text-gray-500 hover:text-ink'
            }`}
          >
            <Printer size={18} weight={printer.connected ? 'fill' : 'regular'} />
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(o => !o)}
            className="relative p-2.5 rounded-full bg-white shadow-sm text-gray-500 hover:text-ink transition"
            title="Notificaciones"
          >
            <Bell size={18} weight={bellOpen ? 'fill' : 'regular'} />
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

        {/* User */}
        <button
          title={`${currentUser?.nombre || currentUser?.username || ''}${currentUser?.role ? ` · ${currentUser.role}` : ''}`}
          className="h-10 w-10 shrink-0 rounded-full bg-accent-100 text-accent-600 font-semibold text-sm flex items-center justify-center shadow-sm hover:bg-accent-500/20 transition"
        >
          {initials(currentUser)}
        </button>
      </div>
    </header>
  );
}
