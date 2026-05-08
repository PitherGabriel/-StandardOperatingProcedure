import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { addProduct, fetchCategories } from '../../services/inventoryService';

const EMPTY = {
  nombre: '', codigo: '', costo: '', unidad: 'unidad',
  precio1: '', precio2: '', precio3: '', cantidad: '', minStock: '',
  hasPrecio2: false, hasPrecio3: false,
  categoria: '', subcategoria: '',
};

function generateCode(nombre) {
  if (!nombre) return '';
  const prefix = nombre.replace(/\s+/g, '').toUpperCase().substring(0, 3);
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${rand}`;
}

export default function InventoryForm({ onAdded, showNotification }) {
  const [form, setForm] = useState(EMPTY);
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.nombre) {
      setForm(prev => ({ ...prev, codigo: generateCode(prev.nombre) }));
    }
  }, [form.nombre]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.nombre || !form.costo || !form.precio1) {
      showNotification('Complete los campos obligatorios: Nombre, Costo y Precio', 'error');
      return;
    }
    setProcessing(true);
    try {
      const result = await addProduct({
        codigo: form.codigo || generateCode(form.nombre),
        nombre: form.nombre,
        cantidad: form.unidad === 'unidad' ? parseInt(form.cantidad) || 0 : parseFloat(form.cantidad) || 0,
        costo: parseFloat(form.costo),
        precio_1: parseFloat(form.precio1),
        precio_2: form.precio2 ? parseFloat(form.precio2) : 0,
        precio_3: form.precio3 ? parseFloat(form.precio3) : 0,
        minStock: parseInt(form.minStock) || 0,
        unidad: form.unidad,
        categoria: form.categoria,
        subcategoria: form.subcategoria,
      });
      if (result.success) {
        showNotification(`Producto agregado!\nCódigo: ${form.codigo}`, 'success');
        setForm(EMPTY);
        onAdded?.();
      } else {
        showNotification(`Error: ${result.message}`, 'error');
      }
    } catch (e) {
      showNotification(`Error al agregar producto: ${e}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const margin = (price, cost) => {
    if (!cost || !price) return null;
    const pct = (((parseFloat(price) - parseFloat(cost)) / parseFloat(cost)) * 100).toFixed(1);
    const abs = (parseFloat(price) - parseFloat(cost)).toFixed(2);
    return { pct, abs };
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
              placeholder="Escriba el nombre del producto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad Inicial</label>
              <input
                type="number"
                step={form.unidad === 'unidad' ? '1' : '0.01'}
                value={form.cantidad}
                onChange={(e) => set('cantidad', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label>
              <input
                type="number"
                step={form.unidad === 'unidad' ? '1' : '0.01'}
                value={form.minStock}
                onChange={(e) => set('minStock', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad de Medida <span className="text-red-500">*</span>
            </label>
            <select
              value={form.unidad}
              onChange={(e) => set('unidad', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
            >
              <option value="unidad">Unidad</option>
              <option value="libras">Libras</option>
              <option value="kg">Kilogramos</option>
              <option value="gramos">Gramos</option>
              <option value="litros">Litros</option>
              <option value="ml">Mililitros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={form.costo}
              onChange={(e) => set('costo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
              placeholder="0"
            />
          </div>

          {['precio1', 'precio2', 'precio3'].map((field, idx) => {
            const isOptional = idx > 0;
            const toggleField = idx === 1 ? 'hasPrecio2' : 'hasPrecio3';
            const enabled = idx === 0 || form[toggleField];
            const colorClass = idx === 0 ? 'blue' : idx === 1 ? 'green' : 'purple';
            const m = margin(form[field], form.costo);

            if (isOptional && !enabled) {
              return (
                <div key={field} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={toggleField}
                    checked={false}
                    onChange={(e) => set(toggleField, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor={toggleField} className="text-sm font-semibold text-gray-700">
                    Precio {idx + 1}
                  </label>
                </div>
              );
            }

            return (
              <div key={field}>
                {isOptional && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={toggleField}
                      checked={true}
                      onChange={(e) => set(toggleField, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor={toggleField} className="text-sm font-semibold text-gray-700">
                      Precio {idx + 1}
                    </label>
                  </div>
                )}
                {!isOptional && (
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio <span className="text-red-500">*</span>
                  </label>
                )}
                <div className={isOptional ? `pl-4 border-l-2 border-${colorClass}-200` : ''}>
                  <input
                    type="number"
                    step="0.01"
                    value={form[field] || ''}
                    onChange={(e) => set(field, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                    placeholder="0"
                  />
                  {m && (
                    <div className={`mt-1 bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-2 flex justify-between items-center`}>
                      <span className="text-sm text-gray-600">Ganancia:</span>
                      <div className="text-right">
                        <span className={`text-lg font-bold text-${colorClass}-600`}>{m.pct}%</span>
                        <span className="text-sm text-gray-500 ml-2">(${m.abs})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Object.keys(categories).length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => { set('categoria', e.target.value); set('subcategoria', ''); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                >
                  <option value="">Sin categoría</option>
                  {Object.keys(categories).sort().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
                <select
                  value={form.subcategoria}
                  onChange={(e) => set('subcategoria', e.target.value)}
                  disabled={!form.categoria || (categories[form.categoria] || []).length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Sin subcategoría</option>
                  {(categories[form.categoria] || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {form.nombre && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Código que se generará:</p>
              <p className="text-lg font-mono font-bold text-gray-800 mt-1">{form.codigo}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setForm(EMPTY)}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Limpiar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-[#008cc8] text-white rounded-lg font-semibold hover:bg-[#057caf] transition flex items-center justify-center gap-2"
            >
              {processing ? <Loader className="animate-spin" /> : 'Agregar producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
