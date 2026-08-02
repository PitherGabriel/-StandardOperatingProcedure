import { useState } from 'react';
import { ShoppingCart, SquaresFour as LayoutDashboard, Package, ClockCounterClockwise as History, SignOut as LogOut, CaretDown as ChevronDown, ListBullets as List, PlusCircle, Tag as Tags } from '@phosphor-icons/react';

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
];

// Labels/text: hidden on the collapsed desktop rail, revealed on hover; always
// visible in the mobile drawer (where the sidebar is full-width).
const REVEAL = 'whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200';

export default function Sidebar({
  activeTab, activeSubTab, onTabChange, onSubTabChange,
  onLogout, open = false, onClose,
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
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition';

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Desktop spacer: reserves the 64px rail so the content sits beside it.
          The aside itself is fixed and expands OVER the content on hover, so the
          content never reflows. */}
      <div className="hidden lg:block w-16 shrink-0" aria-hidden="true" />

      <aside
        className={`group fixed z-40 inset-y-0 left-0 flex flex-col bg-canvas overflow-hidden
          w-64 lg:w-16 lg:hover:w-64
          transition-[width,transform] duration-200 ease-out
          lg:translate-x-0 lg:hover:shadow-xl lg:hover:shadow-black/5
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 h-16 shrink-0">
          <img src="/logo.png" alt="Comercial TB" className="h-9 w-9 object-contain shrink-0" />
          <span className={`font-bold text-ink ${REVEAL}`}>Comercial TB</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMain(item)}
                  title={item.label}
                  className={`${itemBase} ${
                    active
                      ? 'bg-white shadow-sm text-ink'
                      : 'text-gray-500 hover:bg-white/70 hover:text-ink'
                  }`}
                >
                  <Icon size={18} weight={active ? 'fill' : 'regular'} className={`shrink-0 ${active ? 'text-ink' : ''}`} />
                  <span className={`flex-1 text-left ${REVEAL}`}>{item.label}</span>
                  {item.subs && (
                    <ChevronDown
                      size={16}
                      weight="regular"
                      className={`shrink-0 transition-transform ${REVEAL} ${productsExpanded && active ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {item.subs && productsExpanded && active && (
                  <div className="mt-1 ml-5 pl-4 border-l border-gray-200 space-y-1">
                    {item.subs.map(sub => {
                      const subActive = activeSubTab === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => { onSubTabChange(sub.id); onClose?.(); }}
                          title={sub.label}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                            subActive
                              ? 'text-accent-700 font-semibold'
                              : 'text-gray-500 hover:text-ink hover:bg-white/70'
                          }`}
                        >
                          <SubIcon size={15} weight={subActive ? 'fill' : 'regular'} className="shrink-0" />
                          <span className={REVEAL}>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 shrink-0">
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-white/70 hover:text-danger transition"
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`flex-1 text-left ${REVEAL}`}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
