import { useState } from 'react';
import { X, User } from 'lucide-react';

export default function Header({ currentUser, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-linear-to-r from-[#3982ac] to-[#125f69] text-white p-4 sm:p-6 shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Comercial TB</h1>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="bg-white/20 p-2 rounded-lg"
          >
            <User size={20} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
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
  );
}
