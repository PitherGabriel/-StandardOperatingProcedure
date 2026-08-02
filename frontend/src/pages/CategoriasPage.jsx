import { useState, useEffect, useCallback } from 'react';
import { CaretDown as ChevronDown, CaretRight as ChevronRight, Spinner as Loader, Plus, X } from '@phosphor-icons/react';
import { fetchCategories, addCategory } from '../services/inventoryService';

const STORE_EMOJIS = [
  '🍎','🥩','🧀','🥛','🍞','🧃','🥤','🍫','🍬','🧁',
  '🥦','🍋','🥕','🌽','🍅','🧄','🧅','🥑','🍇','🍓',
  '🧴','🧹','🪣','🧺','🧻','🪥','🫧','🧽','🏠','🛋️',
  '👕','👟','🎒','🧢','⌚','💄','🪞','🛍️','📦','🔧',
  '⚡','📱','💻','🔋','💡','🎮','📷','🖨️','🎵','📚',
];

function EmojiPicker({ selected, onSelect }) {
  return (
    <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-white">
      <div className="grid grid-cols-10 gap-1">
        {STORE_EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(selected === e ? '' : e)}
            className={`text-lg p-1 rounded transition hover:bg-blue-50 ${selected === e ? 'bg-blue-100 ring-2 ring-[#008cc8]' : ''}`}
          >
            {e}
          </button>
        ))}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => onSelect('')}
          className="mt-2 text-xs text-gray-400 hover:text-red-500 transition"
        >
          Quitar emoji
        </button>
      )}
    </div>
  );
}

export default function CategoriasPage({ showNotification }) {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoria: '', subcategoria: '', isNewCat: true, emoji: '' });
  const [showEmoji, setShowEmoji] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(() => {
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch(() => showNotification('Error al cargar categorías', 'error'))
      .finally(() => setLoading(false));
  }, [showNotification]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const toggleExpand = (cat) =>
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleSubmit = async () => {
    const base = form.categoria.trim();
    if (!base) {
      showNotification('El nombre de la categoría es requerido', 'error');
      return;
    }
    const cat = form.emoji ? `${form.emoji} ${base}` : base;
    setSaving(true);
    try {
      const result = await addCategory(cat, form.subcategoria.trim());
      if (result.success) {
        showNotification('Categoría guardada exitosamente', 'success');
        setForm({ categoria: '', subcategoria: '', isNewCat: true, emoji: '' });
        setShowEmoji(false);
        setShowForm(false);
        loadCategories();
      } else {
        showNotification(result.error || 'Error al guardar', 'error');
      }
    } catch {
      showNotification('Error al guardar categoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  const categoryList = Object.entries(categories);
  const existingCats = Object.keys(categories).sort();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Categorías</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#008cc8] text-white rounded-lg font-semibold hover:bg-[#057caf] transition text-sm"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancelar' : 'Nueva categoría'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border border-[#008cc8] rounded-lg bg-blue-50">
            <h3 className="font-semibold text-gray-800 mb-4">Agregar categoría / subcategoría</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setForm(f => ({ ...f, isNewCat: true, categoria: '', emoji: '' }))}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  form.isNewCat ? 'bg-[#008cc8] text-white' : 'bg-white text-gray-600 border border-gray-300'
                }`}
              >
                Nueva categoría
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, isNewCat: false, categoria: existingCats[0] || '', emoji: '' }))}
                disabled={existingCats.length === 0}
                className={`px-3 py-1.5 rounded text-sm font-medium transition disabled:opacity-40 ${
                  !form.isNewCat ? 'bg-[#008cc8] text-white' : 'bg-white text-gray-600 border border-gray-300'
                }`}
              >
                Subcategoría de existente
              </button>
            </div>

            <div className="space-y-3">
              {form.isNewCat ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de categoría</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmoji(v => !v)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-lg leading-none"
                      title="Elegir emoji"
                    >
                      {form.emoji || '😀'}
                    </button>
                    <input
                      type="text"
                      value={form.categoria}
                      onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                      placeholder="Ej: Alimentos"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                    />
                  </div>
                  {form.emoji && (
                    <p className="text-xs text-gray-500 mt-1">
                      Vista previa: <span className="font-medium">{form.emoji} {form.categoria || 'Categoría'}</span>
                    </p>
                  )}
                  {showEmoji && (
                    <EmojiPicker selected={form.emoji} onSelect={e => { setForm(f => ({ ...f, emoji: e })); setShowEmoji(false); }} />
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                  >
                    {existingCats.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoría <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.subcategoria}
                  onChange={(e) => setForm(f => ({ ...f, subcategoria: e.target.value }))}
                  placeholder="Ej: Lácteos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-2 bg-[#008cc8] text-white rounded-lg font-semibold hover:bg-[#057caf] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-[#008cc8]" size={32} />
          </div>
        ) : categoryList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No hay categorías configuradas</p>
            <p className="text-sm mt-1">Usa el botón de arriba para crear tu primera categoría.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryList.map(([category, subcategories]) => (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(category)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                >
                  <span className="font-semibold text-gray-800">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
                    </span>
                    {expanded[category]
                      ? <ChevronDown size={16} weight="regular" className="text-gray-400" />
                      : <ChevronRight size={16} weight="regular" className="text-gray-400" />
                    }
                  </div>
                </button>

                {expanded[category] && (
                  <div className="px-4 py-2 divide-y divide-gray-100">
                    {subcategories.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Sin subcategorías</p>
                    ) : (
                      subcategories.map(sub => (
                        <div key={sub} className="py-2 text-sm text-gray-700 pl-2">
                          {sub}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
