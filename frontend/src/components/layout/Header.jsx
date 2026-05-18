import { useState, useEffect, useRef } from 'react';
import { X, User, Printer } from 'lucide-react';

export default function Header({ currentUser, onLogout, printer, showNotification }) {
  const [open, setOpen] = useState(false);
  const prevConnected = useRef(printer?.connected ?? false);

  useEffect(() => {
    if (printer?.connected && !prevConnected.current) {
      showNotification?.('Impresora conectada correctamente', 'success');
    }
    prevConnected.current = printer?.connected ?? false;
  }, [printer?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-linear-to-r from-[#3982ac] to-[#125f69] text-white p-4 sm:p-6 shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Comercial TB</h1>

        <div className="flex items-center gap-2">
          {/* Printer status / connect button — always shown when printer prop is present */}
          {printer && (
            <button
              onClick={printer.connected ? undefined : printer.connect}
              title={printer.connected ? 'Impresora conectada' : 'Conectar impresora'}
              className={`p-2 rounded-lg transition ${
                printer.connected
                  ? 'bg-green-400/30 text-green-300 cursor-default'
                  : 'bg-white/20 text-white/70 hover:bg-white/30 hover:text-white'
              }`}
            >
              <Printer size={20} />
            </button>
          )}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="bg-white/20 p-2 rounded-lg"
            >
              <User size={20} />
            </button>

            {open && (
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
