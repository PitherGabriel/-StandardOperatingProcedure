import { useState } from 'react';
import {
  ShoppingCart, LayoutDashboard, Package, History, TrendingUp,
  Search, LogOut, ChevronDown, List, PlusCircle, Tags,
} from 'lucide-react';

const NAV = [
  { id: 'pos', label: 'Caja', icon: ShoppingCart },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'productos', label: 'Productos', icon: Package,
    subs: [
      { id: 'ver-inventario', label: 'Ver inventario', icon: List },
      { id: 'anadir-producto', label: 'Añadir producto', icon: PlusCircle },
      { id: 'categorias', label: 'Categorías', icon: Tags },
    ],
  },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'profits', label: 'Utilidades', icon: TrendingUp },
];

function initials(user) {
  const name = user?.nombre || user?.username || '';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export default function Sidebar({
  activeTab, activeSubTab, onTabChange, onSubTabChange,
  currentUser, onLogout, open = false, onClose,
}) {
  const [productsExpanded, setProductsExpanded] = useState(activeTab === 'productos');

  const handleMain = (item) => {
    if (item.subs) {
      setProductsExpanded(e => !e || activeTab !== 'productos');
      onTabChange(item.id);
      if (activeTab !== 'productos') onSubTabChange(item.subs[0].id);
    } else {
      onTabChange(item.id);
    }
    onClose?.();
  };

  const itemBase =
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition';

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
          <img src="logo.png" alt="Comercial TB" className="h-9 w-auto" />
          <span className="font-bold text-gray-900">Comercial TB</span>
        </div>

        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {NAV.map(item => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMain(item)}
                  className={`${itemBase} ${
                    active
                      ? 'bg-forest-500/10 text-forest-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.subs && (
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform ${productsExpanded && active ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {item.subs && productsExpanded && active && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {item.subs.map(sub => {
                      const subActive = activeSubTab === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => { onSubTabChange(sub.id); onClose?.(); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                            subActive
                              ? 'text-forest-700 font-semibold'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <SubIcon size={15} className="shrink-0" />
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-forest-500/10 text-forest-700 font-semibold flex items-center justify-center text-sm">
              {initials(currentUser)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser?.nombre || currentUser?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-gray-100 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
