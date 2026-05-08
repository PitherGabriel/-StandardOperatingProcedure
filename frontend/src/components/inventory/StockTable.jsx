import { useState, useMemo } from 'react';

function StockBadge({ cantidad, minStock }) {
  if (cantidad === 0)
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Sin Stock</span>;
  if (cantidad <= minStock)
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Stock Bajo</span>;
  return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Normal</span>;
}

export default function StockTable({ inventory }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  // Build category → subcategories map from inventory
  const categoryMap = useMemo(() => {
    const map = {};
    for (const item of inventory) {
      const cat = item.categoria || '';
      const sub = item.subcategoria || '';
      if (!cat) continue;
      if (!map[cat]) map[cat] = new Set();
      if (sub) map[cat].add(sub);
    }
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, [...v].sort()])
    );
  }, [inventory]);

  const categories = useMemo(() => Object.keys(categoryMap).sort(), [categoryMap]);

  const handleCatClick = (cat) => {
    if (selectedCat === cat) {
      setSelectedCat('');
      setSelectedSub('');
    } else {
      setSelectedCat(cat);
      setSelectedSub('');
    }
  };

  const filtered = useMemo(() => {
    if (!selectedCat) return inventory;
    const byCat = inventory.filter(i => (i.categoria || '') === selectedCat);
    if (!selectedSub) return byCat;
    return byCat.filter(i => (i.subcategoria || '') === selectedSub);
  }, [inventory, selectedCat, selectedSub]);

  const subcategories = selectedCat ? (categoryMap[selectedCat] || []) : [];
  const uncategorized = inventory.filter(i => !i.categoria);

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="flex h-175">

        {/* LEFT SIDEBAR */}
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">

          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Categorías
            </h2>
          </div>

          <nav className="p-2 space-y-1">

            {/* ALL */}
            <button
              onClick={() => {
                setSelectedCat('');
                setSelectedSub('');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition
            ${!selectedCat
                  ? 'bg-[#008cc8] text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
                }
          `}
            >
              <span>Todos</span>
            </button>

            {/* CATEGORIES */}
            {categories.map(cat => {
              const count = inventory.filter(
                i => (i.categoria || '') === cat
              ).length;

              const isActive = selectedCat === cat;

              return (
                <div key={cat}>
                  <button
                    onClick={() => handleCatClick(cat)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition
                  ${isActive
                        ? 'bg-[#008cc8] text-white shadow'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                      }
                `}
                  >
                    <span>{cat}</span>
                  </button>

                  {/* SUBCATEGORIES */}
                  {isActive && subcategories.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">

                      <button
                        onClick={() => setSelectedSub('')}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition
                      ${!selectedSub
                            ? 'bg-blue-100 text-[#006fa0] font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                    `}
                      >
                        Todas las subcategorías
                      </button>

                      {subcategories.map(sub => {
                        const count = inventory.filter(
                          i =>
                            (i.categoria || '') === selectedCat &&
                            (i.subcategoria || '') === sub
                        ).length;

                        return (
                          <button
                            key={sub}
                            onClick={() =>
                              setSelectedSub(
                                selectedSub === sub ? '' : sub
                              )
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                          ${selectedSub === sub
                                ? 'bg-blue-100 text-[#006fa0] font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                              }
                        `}
                          >
                            <span>{sub}</span>
                            <span className="text-xs opacity-60">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* UNCATEGORIZED */}
            {uncategorized.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCat('__none__');
                  setSelectedSub('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition
              ${selectedCat === '__none__'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
            `}
              >
                <span>Sin categoría</span>
                <span className="text-xs opacity-70">
                  {uncategorized.length}
                </span>
              </button>
            )}

          </nav>
        </aside>

        {/* RIGHT CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Segundo precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* your existing rows */}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {selectedCat
                      ? 'No hay productos en esta categoría'
                      : 'No hay productos en el inventario'}
                  </td>
                </tr>
              ) : (
                (() => {
                  // When browsing all with no category filter, group by category
                  if (!selectedCat && categories.length > 0) {
                    const rows = [];
                    const grouped = {};
                    const none = [];
                    for (const item of filtered) {
                      const cat = item.categoria || '';
                      if (!cat) { none.push(item); continue; }
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(item);
                    }
                    for (const cat of categories) {
                      if (!grouped[cat]?.length) continue;
                      rows.push(
                        <tr key={`__cat__${cat}`} className="bg-blue-50">
                          <td colSpan={6} className="px-6 py-2 text-xs font-bold text-[#008cc8] uppercase tracking-wide">
                            {cat}
                          </td>
                        </tr>
                      );
                      for (const item of grouped[cat]) {
                        rows.push(<ProductRow key={item.id ?? item.codigo} item={item} />);
                      }
                    }
                    if (none.length > 0) {
                      rows.push(
                        <tr key="__cat__none" className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                            Sin categoría
                          </td>
                        </tr>
                      );
                      for (const item of none) {
                        rows.push(<ProductRow key={item.id ?? item.codigo} item={item} />);
                      }
                    }
                    return rows;
                  }
                  // Filtered view — flat list
                  return filtered.map(item => (
                    <ProductRow key={item.id ?? item.codigo} item={item} />
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function ProductRow({ item }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm text-gray-600">{item.codigo}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{item.nombre}</td>
      <td className="px-6 py-4 text-sm">
        <span className={`font-semibold ${item.cantidad === 0 ? 'text-red-600' :
          item.cantidad <= item.minStock ? 'text-yellow-600' :
            'text-green-600'
          }`}>
          {item.cantidad}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-800">${item.precio}</td>
      <td className="px-6 py-4 text-sm text-gray-800">
        {item.precio_2 ? `$${item.precio_2.toFixed(2)}` : '-'}
      </td>
      <td className="px-6 py-4 text-sm">
        <StockBadge cantidad={item.cantidad} minStock={item.minStock} />
      </td>
    </tr>
  );
}
