import { useState, useMemo } from 'react';
import { ShoppingCart, Trash2, Search, Plus, ChevronLeft, LayoutGrid } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { usePrinter } from '../../hooks/usePrinter';
import { processSale } from '../../services/salesService';
import { generateSaleId } from '../../services/printerService';
import PriceSelector from './PriceSelector';
import QuantityInput from './QuantitySelector';
import CameraModal from '../camera/CameraModal';
import PostSaleModal from '../receipt/PostSaleModal';

const BUSINESS = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'Mi Tienda',
  ruc: import.meta.env.VITE_BUSINESS_RUC || '0000000000001',
  address: import.meta.env.VITE_BUSINESS_ADDRESS || 'Dirección del negocio',
};

const CAT_COLORS = [
  '#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6',
  '#6366F1','#EF4444','#EAB308','#06B6D4','#F43F5E','#059669',
  '#7C3AED','#D97706','#0EA5E9','#DC2626','#84CC16','#F59E0B',
];

export default function PosBox({ inventory, setInventory, currentUser, showNotification }) {
  const { cart, addToCart, removeFromCart, setCartQuantity, changePriceType, clearCart, total } = useCart(inventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [receivedMoney, setReceivedMoney] = useState('');
  const [processingSale, setProcessingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const printer = usePrinter();

  // Build sorted category list with counts and colors
  const categories = useMemo(() => {
    const map = {};
    for (const item of inventory) {
      const cat = item.categoria || '';
      if (!cat) continue;
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count], i) => ({ name, count, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [inventory]);

  const uncategorizedCount = useMemo(
    () => inventory.filter(i => !i.categoria).length,
    [inventory]
  );

  const hasCategories = categories.length > 0;

  // What to show in the product panel
  const isSearching = searchTerm.trim() !== '';
  const isGridMode = !isSearching && selectedCategory === null && hasCategories;

  const displayProducts = useMemo(() => {
    if (isSearching) {
      const q = searchTerm.toLowerCase();
      return inventory.filter(i =>
        i.nombre.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
      );
    }
    if (selectedCategory === '__none__') return inventory.filter(i => !i.categoria);
    if (selectedCategory) return inventory.filter(i => i.categoria === selectedCategory);
    return inventory; // fallback when no categories exist
  }, [inventory, searchTerm, selectedCategory]);

  const handleAddToCart = (product) => {
    addToCart(product);
    if (isSearching) setSearchTerm('');
  };

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    setSearchTerm('');
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  const change = Math.max(0, (parseFloat(receivedMoney) || 0) - total);
  const lacking = (parseFloat(receivedMoney) || 0) < total && total > 0 && receivedMoney;
  const hasChange = receivedMoney && parseFloat(receivedMoney) >= total && total > 0;

  const handleProcessSale = async () => {
    if (cart.length === 0) { showNotification('El carrito está vacío', 'error'); return; }
    setProcessingSale(true);
    const received = parseFloat(receivedMoney) || 0;
    const saleSnapshot = {
      items: cart.map(item => ({
        name: item.nombre, code: item.codigo, qty: item.cantidadVendida,
        unit: item.unidad, price: item.precioActual ?? item.precio,
      })),
      total, received, change: Math.max(0, received - total),
      date: new Date().toLocaleDateString('es-EC'),
      time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      cajero: currentUser?.nombre || 'Cajero',
      saleId: generateSaleId(),
    };
    try {
      const cartData = cart.map(item => ({
        codigo: item.codigo,
        cantidad_vendida: item.cantidadVendida,
        nombre: item.nombre,
        precio: item.precioActual || item.precio,
        tipoPrecio: item.priceType,
      }));
      const result = await processSale(cartData, currentUser?.nombre);
      if (result.success) {
        setInventory(inventory.map(item => {
          const cartItem = cart.find(c => c.id === item.id);
          return cartItem ? { ...item, cantidad: item.cantidad - cartItem.cantidadVendida } : item;
        }));
        setCompletedSale(saleSnapshot);
      } else {
        showNotification(result.error, 'error');
      }
    } catch {
      showNotification('Error al procesar la venta', 'error');
    } finally {
      setProcessingSale(false);
    }
  };

  const dismissSaleModal = () => {
    setCompletedSale(null);
    clearCart();
    setReceivedMoney('');
    setSearchTerm('');
    showNotification('¡Venta procesada exitosamente!', 'success');
  };

  const ProductCard = ({ product }) => (
    <div
      onClick={() => product.cantidad > 0 && handleAddToCart(product)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-all duration-150 ${
        product.cantidad === 0
          ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
          : 'bg-white border-gray-200 shadow-sm cursor-pointer hover:border-[#008cc8] hover:shadow-md'
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold text-sm text-gray-800 truncate">{product.nombre}</span>
        <span className="text-xs text-gray-500">{product.codigo}</span>
        <span className="text-xs text-gray-500">Inventario: {product.cantidad} {product.unidad}</span>
      </div>
      <span className="text-sm font-bold text-[#0075a7] shrink-0">${product.precio}</span>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold shrink-0 ${
        product.cantidad === 0 ? 'bg-gray-200 text-gray-400' : 'bg-[#0075a7] text-white'
      }`}>
        <Plus size={14} />
        <span>Añadir</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Product panel */}
        <div className="bg-white rounded-lg shadow-lg flex flex-col overflow-hidden h-[45vh] lg:h-full">

          {/* Header */}
          <div className="p-4 shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              {!isGridMode && selectedCategory !== null && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-xl font-bold text-gray-800 flex-1 truncate">
                {isGridMode
                  ? 'Productos'
                  : isSearching
                    ? 'Búsqueda'
                    : selectedCategory === '__none__'
                      ? 'Sin categoría'
                      : selectedCategory ?? 'Productos'}
              </h2>
              {!isGridMode && hasCategories && !isSearching && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs text-[#008cc8] hover:underline"
                >
                  <LayoutGrid size={14} /> Categorías
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Busca por nombre o código..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) setSelectedCategory(null); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
              />
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 flex-1 min-h-0">
            {isGridMode ? (
              /* Category grid */
              <div className="grid grid-cols-4 gap-5">
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    style={{ backgroundColor: cat.color }}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    <span className="font-bold text-sm text-center leading-tight line-clamp-2">{cat.name}</span>
                  </button>
                ))}
                {uncategorizedCount > 0 && (
                  <button
                    onClick={() => handleCategorySelect('__none__')}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center p-2 bg-gray-400 text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    <span className="font-bold text-sm text-center leading-tight">Otros</span>
                  </button>
                )}
              </div>
            ) : isSearching && displayProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {displayProducts.map(product => (
                  <ProductCard key={product.id ?? product.codigo} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart panel */}
        <div className="bg-white rounded-lg shadow-lg flex flex-col overflow-hidden h-[55vh] lg:h-full">
          <div className="py-3 px-3 shrink-0">
            <div className="hidden sm:grid grid-cols-12 gap-2 bg-white px-3 py-2 rounded-lg">
              <div className="col-span-4 text-xs font-medium text-gray-1000 uppercase">Nombre</div>
              <div className="col-span-3 text-center text-xs font-medium text-gray-1000 uppercase">Cantidad</div>
              <div className="col-span-3 text-center text-xs font-medium text-gray-1000 uppercase">Precio</div>
              <div className="col-span-2 text-right text-xs font-medium text-gray-1000 uppercase">Subtotal</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-3">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>El carrito está vacío</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => {
                  const hasTwoPrices = item.precio_2 != null && item.precio_2 > 0;
                  return (
                    <div key={item.id} className="bg-gray-100 p-3 rounded-lg">
                      {/* Mobile */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm text-gray-800">{item.nombre}</h3>
                          <button onClick={() => removeFromCart(item.id)} className="p-1 text-[#bb1c49] hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Cantidad</span>
                          <input
                            type="number"
                            value={item.cantidadVendida || ''}
                            placeholder="0"
                            step={item.unidad === 'unidad' ? '1' : '0.01'}
                            min="0"
                            onChange={(e) => setCartQuantity(item.id, e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            className="w-24 text-center text-sm font-semibold bg-gray-50 border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Precio</span>
                          {hasTwoPrices ? (
                            <select
                              value={item.priceType || 'precio'}
                              onChange={(e) => changePriceType(item.id, e.target.value)}
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                              <option value="precio">${item.precio?.toFixed(3)}</option>
                              {item.precio_2 > 0 && <option value="precio_2">${item.precio_2?.toFixed(3)}</option>}
                              {item.precio_3 > 0 && <option value="precio_3">${item.precio_3?.toFixed(3)}</option>}
                            </select>
                          ) : (
                            <span className="text-sm font-semibold">${item.precio?.toFixed(3)}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-xs text-gray-500">Subtotal</span>
                          <span className="text-sm font-bold text-gray-800">
                            ${((item.precioActual || item.precio) * item.cantidadVendida).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-800 truncate">{item.nombre}</h3>
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <QuantityInput
                            value={item.cantidadVendida}
                            unit={item.unidad}
                            onChange={(val) => setCartQuantity(item.id, val)}
                          />
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <PriceSelector item={item} hasTwoPrices={hasTwoPrices} onChange={changePriceType} />
                        </div>
                        <div className="col-span-2 flex justify-end items-center gap-2">
                          <p className="text-sm font-bold text-gray-800">
                            ${((item.precioActual || item.precio) * item.cantidadVendida).toFixed(2)}
                          </p>
                          <button onClick={() => removeFromCart(item.id)} className="p-1 text-[#bb1c49] hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total & payment */}
          <div className="p-3 lg:p-4 space-y-2 shrink-0">
            <div className="h-px bg-gray-800" />
            <div className="flex justify-between items-center">
              <span className="text-lg lg:text-2xl font-semibold">Total</span>
              <span className="text-lg lg:text-2xl font-semibold text-[#2b2929]">$ {total.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base lg:text-lg font-semibold text-gray-700">Recibe</span>
                <input
                  type="number"
                  step="0.01"
                  value={receivedMoney}
                  onChange={(e) => setReceivedMoney(e.target.value)}
                  placeholder="0.00"
                  className="w-28 lg:w-32 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-right font-semibold"
                  disabled={cart.length === 0}
                />
              </div>
              {hasChange && (
                <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium text-green-800">Vuelto</span>
                  <span className="text-lg font-bold text-green-600">${change.toFixed(2)}</span>
                </div>
              )}
              {lacking && (
                <div className="flex justify-between items-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-red-800">Falta</span>
                  <span className="text-lg font-bold text-red-600">
                    ${(total - parseFloat(receivedMoney)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {processingSale && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-8">
                <div className="text-center">
                  <p className="text-white text-xl font-semibold">Procesando venta</p>
                  <p className="text-white/60 text-sm mt-2">Por favor espera un momento</p>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#008cc8] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleProcessSale}
                disabled={cart.length === 0 || processingSale}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  cart.length === 0 || processingSale
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#1d8a02] text-white hover:bg-[#006b00]'
                }`}
              >
                Pagar
              </button>
              <div className="flex-1">
                <CameraModal
                  showNotification={showNotification}
                  currentUser={currentUser}
                  inventory={inventory}
                  setInventory={setInventory}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {completedSale && (
        <PostSaleModal
          sale={completedSale}
          biz={BUSINESS}
          connected={printer.connected}
          printing={printer.printing}
          error={printer.error}
          isSupported={printer.isSupported}
          onConnect={printer.connect}
          onPrint={() => printer.printReceipt(completedSale, BUSINESS).catch(() => {})}
          onClose={dismissSaleModal}
        />
      )}
    </>
  );
}
