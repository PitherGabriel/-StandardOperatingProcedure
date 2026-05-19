const MAIN_TABS = [
  { id: 'pos', label: 'Caja' },
  { id: 'productos', label: 'Productos' },
  { id: 'history', label: 'Historial' },
  { id: 'profits', label: 'Utilidades' },
  { id: 'dashboard', label: 'Dashboard' },
];

const PRODUCT_SUBTABS = [
  { id: 'ver-inventario', label: 'Ver Inventario' },
  { id: 'anadir-producto', label: 'Añadir Producto' },
  { id: 'categorias', label: 'Categorías' },
];

export default function TabNav({ activeTab, activeSubTab, onTabChange, onSubTabChange }) {
  return (
    <div className="bg-white shadow">
      {/* Main tabs */}
      <div className="flex sm:justify-center items-center gap-0 sm:gap-1 px-2 sm:px-6 overflow-x-auto">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                : 'text-gray-600 hover:text-[#008cc8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs — only visible under Productos */}
      {activeTab === 'productos' && (
        <div className="flex sm:justify-center items-center gap-1 px-6 overflow-x-auto bg-gray-50 border-t border-gray-100">
          {PRODUCT_SUBTABS.map(sub => (
            <button
              key={sub.id}
              onClick={() => onSubTabChange(sub.id)}
              className={`px-5 py-2 text-sm font-medium transition whitespace-nowrap ${
                activeSubTab === sub.id
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-500 hover:text-[#008cc8]'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
