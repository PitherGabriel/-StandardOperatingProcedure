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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inventario de Stock</h2>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCat(''); setSelectedSub(''); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                !selectedCat
                  ? 'bg-[#008cc8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({inventory.length})
            </button>
            {categories.map(cat => {
              const count = inventory.filter(i => (i.categoria || '') === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => handleCatClick(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedCat === cat
                      ? 'bg-[#008cc8] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
            {uncategorized.length > 0 && (
              <button
                onClick={() => { setSelectedCat('__none__'); setSelectedSub(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCat === '__none__'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                Sin categoría ({uncategorized.length})
              </button>
            )}
          </div>
        )}

        {/* Subcategory pills */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedSub('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                !selectedSub
                  ? 'bg-[#006fa0] text-white'
                  : 'bg-blue-50 text-[#008cc8] hover:bg-blue-100'
              }`}
            >
              Todas las subcategorías
            </button>
            {subcategories.map(sub => {
              const count = inventory.filter(
                i => (i.categoria || '') === selectedCat && (i.subcategoria || '') === sub
              ).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(selectedSub === sub ? '' : sub)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedSub === sub
                      ? 'bg-[#006fa0] text-white'
                      : 'bg-blue-50 text-[#008cc8] hover:bg-blue-100'
                  }`}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio 2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
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
  );
}

function ProductRow({ item }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.codigo}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{item.nombre}</td>
      <td className="px-6 py-4 text-sm">
        <span className={`font-semibold ${
          item.cantidad === 0 ? 'text-red-600' :
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
