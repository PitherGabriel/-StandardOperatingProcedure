import { useState, useMemo } from 'react';
import { Pencil, PlusCircle, X, Loader } from 'lucide-react';
import { updateProduct, adjustStock, fetchCategories } from '../../services/inventoryService';
import { useEffect } from 'react';

function StockBadge({ cantidad, minStock }) {
  if (cantidad === 0)
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Sin Stock</span>;
  if (cantidad <= minStock)
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Stock Bajo</span>;
  return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Normal</span>;
}

// ── Edit Product Modal ────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSaved, showNotification }) {
  const [form, setForm] = useState({
    nombre: product.nombre,
    costo: product.costo ?? '',
    precio1: product.precio ?? '',
    precio2: product.precio_2 > 0 ? product.precio_2 : '',
    precio3: product.precio_3 > 0 ? product.precio_3 : '',
    minStock: product.minStock ?? '',
    categoria: product.categoria ?? '',
    subcategoria: product.subcategoria ?? '',
    hasPrecio2: (product.precio_2 ?? 0) > 0,
    hasPrecio3: (product.precio_3 ?? 0) > 0,
    descuento: product.descuento ?? 0,
  });
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState({});

  useEffect(() => { fetchCategories().then(setCategories).catch(() => {}); }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const margin = (price, cost) => {
    if (!cost || !price) return null;
    const pct = (((parseFloat(price) - parseFloat(cost)) / parseFloat(cost)) * 100).toFixed(1);
    const abs = (parseFloat(price) - parseFloat(cost)).toFixed(2);
    return { pct, abs };
  };

  const handleSave = async () => {
    if (!form.nombre || !form.costo || !form.precio1) {
      showNotification('Nombre, Costo y Precio son obligatorios', 'error');
      return;
    }
    setProcessing(true);
    try {
      const result = await updateProduct(product.codigo, {
        nombre: form.nombre,
        costo: parseFloat(form.costo),
        precio_1: parseFloat(form.precio1),
        precio_2: form.hasPrecio2 && form.precio2 ? parseFloat(form.precio2) : 0,
        precio_3: form.hasPrecio3 && form.precio3 ? parseFloat(form.precio3) : 0,
        minStock: parseInt(form.minStock) || 0,
        categoria: form.categoria,
        subcategoria: form.subcategoria,
        descuento: parseFloat(form.descuento) || 0,
      });
      if (result.success) {
        showNotification('Producto actualizado correctamente', 'success');
        onSaved();
        onClose();
      } else {
        showNotification(result.message || result.error || 'Error al actualizar', 'error');
      }
    } catch (e) {
      showNotification(`Error: ${e.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Editar Producto</h2>
            <p className="text-xs text-gray-500 mt-0.5">Código: {product.codigo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={form.costo} onChange={e => set('costo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="number" value={form.minStock} onChange={e => set('minStock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.descuento} onChange={e => set('descuento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0" />
          </div>

          {/* Precio 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Principal <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={form.precio1} onChange={e => set('precio1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0.00" />
            {margin(form.precio1, form.costo) && (
              <p className="text-xs text-blue-600 mt-1">Margen: {margin(form.precio1, form.costo).pct}% (${margin(form.precio1, form.costo).abs})</p>
            )}
          </div>

          {/* Precio 2 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <input type="checkbox" id="ep2" checked={form.hasPrecio2} onChange={e => set('hasPrecio2', e.target.checked)} className="w-4 h-4 rounded" />
              <label htmlFor="ep2" className="text-sm font-medium text-gray-700">Precio 2 (mayorista)</label>
            </div>
            {form.hasPrecio2 && (
              <input type="number" step="0.01" value={form.precio2} onChange={e => set('precio2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0.00" />
            )}
          </div>

          {/* Precio 3 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <input type="checkbox" id="ep3" checked={form.hasPrecio3} onChange={e => set('hasPrecio3', e.target.checked)} className="w-4 h-4 rounded" />
              <label htmlFor="ep3" className="text-sm font-medium text-gray-700">Precio 3</label>
            </div>
            {form.hasPrecio3 && (
              <input type="number" step="0.01" value={form.precio3} onChange={e => set('precio3', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" placeholder="0.00" />
            )}
          </div>

          {/* Category */}
          {Object.keys(categories).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={form.categoria} onChange={e => { set('categoria', e.target.value); set('subcategoria', ''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm">
                  <option value="">Sin categoría</option>
                  {Object.keys(categories).sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                <select value={form.subcategoria} onChange={e => set('subcategoria', e.target.value)}
                  disabled={!form.categoria || (categories[form.categoria] || []).length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="">Sin subcategoría</option>
                  {(categories[form.categoria] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={processing}
            className="flex-1 px-4 py-2.5 bg-[#008cc8] text-white rounded-lg font-semibold hover:bg-[#057caf] transition flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {processing ? <Loader size={16} className="animate-spin" /> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────
function StockAdjustModal({ product, onClose, onSaved, showNotification }) {
  const [amount, setAmount] = useState('');
  const [motivo, setMotivo] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAdjust = async () => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val === 0) {
      showNotification('Ingresa un ajuste diferente de cero', 'error');
      return;
    }
    setProcessing(true);
    try {
      const result = await adjustStock(product.codigo, val, motivo);
      if (result.success) {
        showNotification(`Stock ajustado. Nuevo stock: ${result.new_quantity} ${product.unidad}`, 'success');
        onSaved();
        onClose();
      } else {
        showNotification(result.error || 'Error al ajustar stock', 'error');
      }
    } catch (e) {
      showNotification(`Error: ${e.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const val = parseFloat(amount) || 0;
  const newQty = Math.max(0, product.cantidad + val);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-800">Ajustar Stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">{product.nombre} — Stock actual: <strong>{product.cantidad} {product.unidad}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a ajustar</label>
            <p className="text-xs text-gray-400 mb-2">Positivo para añadir stock, negativo para reducir</p>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="+10 ó -3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm font-mono"
            />
          </div>

          {amount && !isNaN(val) && (
            <div className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold ${
              newQty === 0 ? 'bg-red-50 text-red-700' : newQty <= product.minStock ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
            }`}>
              <span>Nuevo stock:</span>
              <span>{newQty} {product.unidad}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Recepción de mercadería, conteo físico..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm">
            Cancelar
          </button>
          <button onClick={handleAdjust} disabled={processing}
            className="flex-1 px-4 py-2.5 bg-[#1d8a02] text-white rounded-lg font-semibold hover:bg-[#006b00] transition flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {processing ? <Loader size={16} className="animate-spin" /> : 'Aplicar ajuste'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main StockTable ───────────────────────────────────────────────────────────
export default function StockTable({ inventory, onInventoryChange, showNotification }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

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
    if (selectedCat === cat) { setSelectedCat(''); setSelectedSub(''); }
    else { setSelectedCat(cat); setSelectedSub(''); }
  };

  const filtered = useMemo(() => {
    if (!selectedCat) return inventory;
    if (selectedCat === '__none__') return inventory.filter(i => !i.categoria);
    const byCat = inventory.filter(i => (i.categoria || '') === selectedCat);
    if (!selectedSub) return byCat;
    return byCat.filter(i => (i.subcategoria || '') === selectedSub);
  }, [inventory, selectedCat, selectedSub]);

  const subcategories = selectedCat ? (categoryMap[selectedCat] || []) : [];
  const uncategorized = inventory.filter(i => !i.categoria);

  const handleSaved = () => { onInventoryChange?.(); };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {/* Mobile: horizontal category filter pills */}
        <div className="md:hidden border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto p-3">
            <button
              onClick={() => { setSelectedCat(''); setSelectedSub(''); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                !selectedCat ? 'bg-[#008cc8] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCatClick(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCat === cat ? 'bg-[#008cc8] text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
            {uncategorized.length > 0 && (
              <button
                onClick={() => { setSelectedCat('__none__'); setSelectedSub(''); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCat === '__none__' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Sin categoría
              </button>
            )}
          </div>
        </div>

        <div className="md:flex md:h-175">

          {/* LEFT SIDEBAR — desktop only */}
          <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Categorías</h2>
            </div>
            <nav className="p-2 space-y-1">
              <button
                onClick={() => { setSelectedCat(''); setSelectedSub(''); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                  !selectedCat ? 'bg-[#008cc8] text-white shadow' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Todos</span>
              </button>

              {categories.map(cat => {
                const isActive = selectedCat === cat;
                return (
                  <div key={cat}>
                    <button
                      onClick={() => handleCatClick(cat)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                        isActive ? 'bg-[#008cc8] text-white shadow' : 'text-gray-700 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                    {isActive && subcategories.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                        <button
                          onClick={() => setSelectedSub('')}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            !selectedSub ? 'bg-blue-100 text-[#006fa0] font-medium' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Todas las subcategorías
                        </button>
                        {subcategories.map(sub => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSub(selectedSub === sub ? '' : sub)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                              selectedSub === sub ? 'bg-blue-100 text-[#006fa0] font-medium' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span>{sub}</span>
                            <span className="text-xs opacity-60">
                              {inventory.filter(i => (i.categoria || '') === selectedCat && (i.subcategoria || '') === sub).length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {uncategorized.length > 0 && (
                <button
                  onClick={() => { setSelectedCat('__none__'); setSelectedSub(''); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                    selectedCat === '__none__' ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Sin categoría</span>
                  <span className="text-xs opacity-70">{uncategorized.length}</span>
                </button>
              )}
            </nav>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 overflow-y-auto">
            {/* Mobile: card list */}
            <div className="md:hidden space-y-2 p-3">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-10">
                  {selectedCat ? 'No hay productos en esta categoría' : 'No hay productos en el inventario'}
                </p>
              ) : (
                filtered.map(item => (
                  <div key={item.id ?? item.codigo} className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{item.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.codigo}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-sm font-bold ${
                          item.cantidad === 0 ? 'text-red-600' : item.cantidad <= item.minStock ? 'text-yellow-600' : 'text-green-600'
                        }`}>{item.cantidad} {item.unidad}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-700">${Number(item.precio).toFixed(2)}</span>
                        <StockBadge cantidad={item.cantidad} minStock={item.minStock} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => setEditingProduct(item)}
                        className="p-2 text-[#008cc8] hover:bg-blue-50 rounded-lg transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setAdjustingProduct(item)}
                        className="p-2 text-[#1d8a02] hover:bg-green-50 rounded-lg transition">
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">2° Precio</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {selectedCat ? 'No hay productos en esta categoría' : 'No hay productos en el inventario'}
                    </td>
                  </tr>
                ) : (
                  (() => {
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
                            <td colSpan={7} className="px-4 py-2 text-xs font-bold text-[#008cc8] uppercase tracking-wide">{cat}</td>
                          </tr>
                        );
                        for (const item of grouped[cat]) {
                          rows.push(
                            <ProductRow key={item.id ?? item.codigo} item={item}
                              onEdit={() => setEditingProduct(item)}
                              onAdjust={() => setAdjustingProduct(item)}
                            />
                          );
                        }
                      }
                      if (none.length > 0) {
                        rows.push(
                          <tr key="__cat__none" className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Sin categoría</td>
                          </tr>
                        );
                        for (const item of none) {
                          rows.push(
                            <ProductRow key={item.id ?? item.codigo} item={item}
                              onEdit={() => setEditingProduct(item)}
                              onAdjust={() => setAdjustingProduct(item)}
                            />
                          );
                        }
                      }
                      return rows;
                    }
                    return filtered.map(item => (
                      <ProductRow key={item.id ?? item.codigo} item={item}
                        onEdit={() => setEditingProduct(item)}
                        onAdjust={() => setAdjustingProduct(item)}
                      />
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleSaved}
          showNotification={showNotification}
        />
      )}

      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={handleSaved}
          showNotification={showNotification}
        />
      )}
    </>
  );
}

function ProductRow({ item, onEdit, onAdjust }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.codigo}</td>
      <td className="px-4 py-3 text-sm text-gray-800">{item.nombre}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`font-semibold ${
          item.cantidad === 0 ? 'text-red-600' : item.cantidad <= item.minStock ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {item.cantidad} {item.unidad}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-800">${Number(item.precio).toFixed(2)}</td>
      <td className="px-4 py-3 text-sm text-gray-800">
        {item.precio_2 ? `$${Number(item.precio_2).toFixed(2)}` : '-'}
      </td>
      <td className="px-4 py-3 text-sm">
        <StockBadge cantidad={item.cantidad} minStock={item.minStock} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Editar producto"
            className="p-1.5 text-[#008cc8] hover:bg-blue-50 rounded-lg transition"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onAdjust}
            title="Ajustar stock"
            className="p-1.5 text-[#1d8a02] hover:bg-green-50 rounded-lg transition"
          >
            <PlusCircle size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
