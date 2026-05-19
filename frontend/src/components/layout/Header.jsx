import { useState, useEffect, useRef } from 'react';
import { X, User, Printer, Bell, PackageX, AlertTriangle } from 'lucide-react';

export default function Header({ currentUser, onLogout, printer, showNotification, alerts = [] }) {
  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const prevConnected = useRef(printer?.connected ?? false);
  const bellRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (printer?.connected && !prevConnected.current) {
      showNotification?.('Impresora conectada correctamente', 'success');
    }
    prevConnected.current = printer?.connected ?? false;
  }, [printer?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const outOfStock = alerts.filter(a => a.cantidad === 0);
  const lowStock = alerts.filter(a => a.cantidad > 0);

  return (
    <div className="bg-linear-to-r from-[#3982ac] to-[#125f69] text-white px-4 py-2 sm:p-6 shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-base sm:text-2xl md:text-3xl font-bold">Comercial TB</h1>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Printer */}
          {printer && (
            <button
              onClick={printer.connected ? undefined : printer.connect}
              title={printer.connected ? 'Impresora conectada' : 'Conectar impresora'}
              className={`p-1.5 sm:p-2 rounded-lg transition ${
                printer.connected
                  ? 'bg-green-400/30 text-green-300 cursor-default'
                  : 'bg-white/20 text-white/70 hover:bg-white/30 hover:text-white'
              }`}
            >
              <Printer size={18} />
            </button>
          )}

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(o => !o); setUserOpen(false); }}
              className="relative bg-white/20 p-1.5 sm:p-2 rounded-lg hover:bg-white/30 transition"
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {alerts.length}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="font-semibold text-sm">Notificaciones</p>
                  {alerts.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                      {alerts.length}
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      Sin notificaciones
                    </div>
                  ) : (
                    <>
                      {outOfStock.map(a => (
                        <div key={a.codigo} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50">
                          <PackageX size={16} className="text-red-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{a.nombre}</p>
                            <p className="text-xs text-red-500 font-semibold">Sin stock</p>
                          </div>
                        </div>
                      ))}
                      {lowStock.map(a => (
                        <div key={a.codigo} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50">
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

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen(o => !o); setBellOpen(false); }}
              className="bg-white/20 p-1.5 sm:p-2 rounded-lg hover:bg-white/30 transition"
            >
              <User size={18} />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold">
                    {currentUser?.nombre || currentUser?.username}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser?.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <X size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
