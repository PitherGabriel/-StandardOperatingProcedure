import { useState } from "react";
import { X, User } from "lucide-react";

export default function Header({ currentUser, handleLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-linear-to-r from-[#008cc8] to-[#005174] text-white p-4 sm:p-6 shadow-lg">
      
      <div className="flex justify-between items-center">
        
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Comercial TB
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Gestión de Ventas e Inventario
          </p>
        </div>

        {/* Desktop user section */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="bg-white/20 px-3 py-2 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">
                {currentUser?.nombre || currentUser?.username}
              </span>
            </p>
            <p className="text-xs text-blue-100">
              {currentUser?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <X size={18} />
            Cerrar Sesión
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setOpen(!open)}
            className="bg-white/20 p-2 rounded-lg"
          >
            <User size={20} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
              
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">
                  {currentUser?.nombre || currentUser?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.role}
                </p>
              </div>

              <button
                onClick={handleLogout}
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