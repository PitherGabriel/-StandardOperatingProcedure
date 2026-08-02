import { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingCart, Trash as Trash2, MagnifyingGlass as Search, Plus, CaretLeft as ChevronLeft, GridFour as LayoutGrid, X } from '@phosphor-icons/react';
import { useCart } from '../../hooks/useCart';
import { processSale } from '../../services/salesService';
import { fetchInventory } from '../../services/inventoryService';
import { generateSaleId } from '../../services/printerService';
import PriceSelector from './PriceSelector';
import QuantityInput from './QuantitySelector';
import CameraModal from '../camera/CameraModal';
import PostSaleModal from '../receipt/PostSaleModal';
import InventoryForm from '../inventory/InventoryForm';
import { ProductRowSkeleton } from '../ui/Skeleton';
import FolderCard from '../ui/FolderCard';

const BUSINESS = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'Mi Tienda',
  ruc: import.meta.env.VITE_BUSINESS_RUC || '0000000000001',
  address: import.meta.env.VITE_BUSINESS_ADDRESS || 'Dirección del negocio',
};

export default function PosBox({ inventory, setInventory, refreshInventory, currentUser, showNotification, printer = {}, inventoryLoading = false }) {
  const { cart, addToCart, removeFromCart, setCartQuantity, changePriceType, clearCart, total } = useCart(inventory, showNotification);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [receivedMoney, setReceivedMoney] = useState('');
  const [processingSale, setProcessingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [referencia, setReferencia] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [registerCode, setRegisterCode] = useState(null);

  const searchRef = useRef(null);
  const receivedRef = useRef(null);

  const openSearch = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); };
  const closeSearch = () => { setSearchOpen(false); setSearchTerm(''); };

  // Barcode scanner detection — a scan gun "types" the code as a fast burst then Enter.
  // We track inter-key timing so it works regardless of focus and never hijacks human typing.
  const barcodeBuffer = useRef('');
  const firstKeyTime = useRef(0);
  const lastKeyTime = useRef(0);
  const HUMAN_GAP_MS = 50; // gaps larger than this => a person, not a scanner

  // Build sorted category list with colors
  const categories = useMemo(() => {
    const map = {};
    for (const item of inventory) {
      const cat = item.categoria || '';
      if (!cat) continue;
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [inventory]);

  const uncategorizedCount = useMemo(
    () => inventory.filter(i => !i.categoria).length,
    [inventory]
  );

  const hasCategories = categories.length > 0;
  const isSearching = searchTerm.trim() !== '';
  const isGridMode = !isSearching && selectedCategory === null && hasCategories;

  const displayProducts = useMemo(() => {
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return inventory.filter(i =>
        i.nombre.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
      );
    }
    if (selectedCategory === '__none__') return inventory.filter(i => !i.categoria);
    if (selectedCategory) return inventory.filter(i => i.categoria === selectedCategory);
    return inventory;
  }, [inventory, searchTerm, selectedCategory]);

  // After registering a product from an unknown scan, refresh inventory and add it to the cart
  const handleRegistered = async (codigo) => {
    setRegisterCode(null);
    try {
      const fresh = await fetchInventory();
      setInventory(fresh);
      const product = fresh.find(p => p.codigo === codigo);
      if (product && product.cantidad > 0) {
        addToCart(product);
        showNotification(`"${product.nombre}" añadido al carrito`, 'success');
      }
    } catch {
      refreshInventory?.();
    }
  };

  // Global keyboard shortcuts + barcode scanner detection
  useEffect(() => {
    const handleScannedCode = (code) => {
      const product = inventory.find(p => p.codigo.toLowerCase() === code.toLowerCase());
      if (product) {
        addToCart(product);
        setSearchTerm('');
        showNotification(`"${product.nombre}" añadido al carrito`, 'success');
      } else {
        // Unknown barcode → offer to register it (code becomes the product's codigo)
        setSearchTerm('');
        setRegisterCode(code);
        showNotification(`Código "${code}" no registrado — regístralo`, 'info');
      }
    };

    const handleKeyDown = (e) => {
      // Suspend scanning while the register modal is open (user is filling the form)
      if (registerCode !== null) return;

      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Barcode scanner: collect printable chars, resetting the buffer on any human-speed gap
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
        const now = Date.now();
        if (now - lastKeyTime.current > HUMAN_GAP_MS) {
          barcodeBuffer.current = '';
          firstKeyTime.current = now;
        }
        barcodeBuffer.current += e.key;
        lastKeyTime.current = now;
      } else if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim();
        const burstMs = Date.now() - firstKeyTime.current;
        const isScan = code.length >= 3 && burstMs < code.length * HUMAN_GAP_MS;
        barcodeBuffer.current = '';
        // Only treat as a scan (never hijack the received-money / pay-on-Enter field)
        if (isScan && document.activeElement !== receivedRef.current) {
          e.preventDefault();
          handleScannedCode(code);
          return;
        }
      }

      if (isTyping) return;

      if (e.key === '/' || e.key === 'F3') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchTerm) setSearchTerm('');
        else if (selectedCategory !== null) setSelectedCategory(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, selectedCategory, inventory, addToCart, showNotification, registerCode]);

  const handleRemoveFromCart = (id) => {
    removeFromCart(id);
    if (cart.length === 1) setReceivedMoney('');
  };


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

  const receivedAmt = parseFloat(receivedMoney) || 0;
  const change = Math.max(0, receivedAmt - total);
  const lacking = receivedMoney && receivedAmt < total && total > 0;

  const handleProcessSale = async () => {
    if (cart.length === 0) { showNotification('El carrito está vacío', 'error'); return; }
    setProcessingSale(true);
    const received = receivedAmt;
    const cartData = cart.map(item => ({
      codigo: item.codigo,
      cantidad_vendida: item.cantidadVendida,
      nombre: item.nombre,
      precio: item.precioActual || item.precio,
      tipoPrecio: item.priceType,
    }));
    const saleSnapshot = {
      items: cart.map(item => ({
        name: item.nombre, code: item.codigo, qty: item.cantidadVendida,
        unit: item.unidad, price: item.precioActual ?? item.precio,
      })),
      cart: cartData,
      vendedor: currentUser?.nombre || 'Sistema',
      total, received, change: Math.max(0, received - total),
      metodoPago,
      referencia,
      date: new Date().toLocaleDateString('es-EC'),
      time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      cajero: currentUser?.nombre || 'Cajero',
      saleId: generateSaleId(),
    };
    try {
      const result = await processSale(cartData, currentUser?.nombre, metodoPago, referencia);
      if (result.success) {
        setInventory(inventory.map(item => {
          const cartItem = cart.find(c => c.codigo === item.codigo);
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
    setReferencia('');
    setMetodoPago('efectivo');
    setSearchTerm('');
    showNotification('¡Venta procesada exitosamente!', 'success');
  };

  const ProductCard = ({ product }) => {
    const isOutOfStock = product.cantidad === 0;
    const isLowStock = !isOutOfStock && product.cantidad <= product.minStock;
    return (
      <div
        onClick={() => !isOutOfStock && handleAddToCart(product)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 border transition-all duration-150 ${isOutOfStock
            ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
            : 'bg-white border-gray-200 shadow-sm cursor-pointer hover:border-[#008cc8] hover:shadow-md'
          }`}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-xs lg:text-sm text-gray-800 truncate">{product.nombre}</span>
          <span className="text-xs text-gray-400">{product.codigo}</span>
          <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-orange-500' : 'text-gray-400'
            }`}>
            {isOutOfStock
              ? 'Agotado'
              : `${product.cantidad} ${product.unidad}${isLowStock ? ' · Stock bajo' : ''}`}
          </span>
        </div>
        <span className="text-xs lg:text-sm font-bold text-[#0075a7] shrink-0">${product.precio}</span>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md text-xs font-semibold shrink-0 ${isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-[#0075a7] text-white'
          }`}>
          <Plus size={12} />
          <span className="hidden lg:inline">Añadir</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 h-full">
        {/* Product panel */}
        <FolderCard className="flex-1 min-h-0 lg:h-full">

          {/* Header */}
          <div className="px-3 py-2 lg:p-4 shrink-0">

            {/* Title row — hidden on mobile when search is open */}
            <div className={`flex items-center gap-2 lg:mb-2 ${(searchOpen || isSearching) ? 'hidden lg:flex' : 'flex'}`}>
              {!isGridMode && selectedCategory !== null && (
                <button onClick={handleBack} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition">
                  <ChevronLeft size={18} />
                </button>
              )}
              <h2 className="text-base lg:text-2xl font-bold text-gray-800 flex-1 truncate">
                {isGridMode
                  ? 'Productos'
                  : isSearching
                    ? 'Búsqueda'
                    : selectedCategory === '__none__'
                      ? 'Sin categoría'
                      : selectedCategory ?? 'Productos'}
              </h2>
              <button onClick={openSearch} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                <Search size={18} />
              </button>
            </div>

            {/* Search row — always visible on desktop, toggle on mobile */}
            <div className={`flex items-center gap-2 ${(searchOpen || isSearching) ? 'flex' : 'hidden lg:flex'}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) setSelectedCategory(null); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { closeSearch(); e.target.blur(); } }}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8] text-sm"
                />
              </div>
              <button onClick={closeSearch} className="lg:hidden shrink-0 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

          </div>

          {/* Body */}
          <div className="overflow-y-auto p-2 lg:p-4 flex-1 min-h-0">
            {inventoryLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => <ProductRowSkeleton key={i} />)}
              </div>
            ) : isGridMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    className="aspect-square rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 p-3 hover:border-accent-300 hover:shadow-md active:scale-95 transition-all"
                  >
                    <span className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-600 flex items-center justify-center font-bold text-lg">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-sm text-ink text-center leading-tight line-clamp-2">{cat.name}</span>
                    <span className="text-gray-400 text-xs">{cat.count}</span>
                  </button>
                ))}
                {uncategorizedCount > 0 && (
                  <button
                    onClick={() => handleCategorySelect('__none__')}
                    className="aspect-square rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 p-3 hover:border-accent-300 hover:shadow-md active:scale-95 transition-all"
                  >
                    <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                      <LayoutGrid size={18} />
                    </span>
                    <span className="font-semibold text-sm text-ink text-center leading-tight">Otros</span>
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
        </FolderCard>

        {/* Cart panel */}
        <FolderCard side="right" mobileSide="left" className="flex-1 min-h-0 lg:h-full">
          <div className="px-3 lg:px-4 pt-2 lg:pt-4 shrink-0">
            <h2 className="text-base lg:text-2xl font-bold text-gray-800 mb-2 text-left lg:text-right">Carrito</h2>
            <div className="grid grid-cols-12 gap-2 px-1 py-1">
              <div className="col-span-4 text-xs font-medium text-gray-500 uppercase">Nombre</div>
              <div className="col-span-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</div>
              <div className="col-span-3 text-center text-xs font-medium text-gray-500 uppercase">Precio</div>
              <div className="col-span-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-3">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ShoppingCart size={35} className="mx-auto mb-2 opacity-50" />
                  <p>El carrito está vacío</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {cart.map(item => {
                  const hasTwoPrices = item.precio_2 != null && item.precio_2 > 0;
                  return (
                    <div key={item.id} className="bg-gray-100 p-2 rounded-lg">
                      <div className="grid grid-cols-12 gap-1 items-center">
                        <div className="col-span-4 min-w-0">
                          <h3 className="font-semibold text-xs text-gray-800 truncate">{item.nombre}</h3>
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
                        <div className="col-span-2 flex justify-end items-center gap-1">
                          <p className="text-xs font-bold text-gray-800">
                            ${((item.precioActual || item.precio) * item.cantidadVendida).toFixed(2)}
                          </p>
                          <button onClick={() => handleRemoveFromCart(item.id)} className="p-1 text-[#bb1c49] hover:bg-red-50 rounded">
                            <Trash2 size={14} />
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
          <div className="p-2 lg:p-4 space-y-1.5 lg:space-y-2 shrink-0">
            <div className="h-px bg-gray-200" />

            {/* Payment method selector */}
            {cart.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                  {[
                    { id: 'efectivo', label: 'Efectivo' },
                    { id: 'tarjeta', label: 'Tarjeta' },
                    { id: 'transferencia', label: 'Transferencia' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMetodoPago(m.id)}
                      className={`flex-1 py-1.5 transition ${metodoPago === m.id
                          ? 'bg-[#008cc8] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {metodoPago === 'transferencia' && (
                  <input
                    type="text"
                    placeholder="Número de referencia (opcional)"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                  />
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-base lg:text-2xl font-semibold">Total</span>
              <span className="text-base lg:text-2xl font-semibold text-[#2b2929]">$ {total.toFixed(2)}</span>
            </div>

            {/* Recibe + Vuelto */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600 shrink-0">Recibe</span>
                <input
                  ref={receivedRef}
                  type="number"
                  step="0.01"
                  value={receivedMoney}
                  onChange={(e) => setReceivedMoney(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && receivedMoney && cart.length > 0 && !processingSale) {
                      handleProcessSale();
                    }
                  }}
                  placeholder="0.00"
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right font-semibold"
                  disabled={cart.length === 0}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold shrink-0 ${lacking ? 'text-red-500' : 'text-gray-600'}`}>
                  {lacking ? 'Falta' : 'Vuelto'}
                </span>
                <div className={`flex-1 min-w-0 px-2 py-1 border rounded-lg text-sm text-right font-semibold ${lacking ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 bg-gray-50 text-gray-800'}`}>
                  ${lacking ? (total - receivedAmt).toFixed(2) : change.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleProcessSale}
                disabled={cart.length === 0 || processingSale}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${cart.length === 0 || processingSale
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-ink text-white hover:bg-ink-hover'
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
        </FolderCard>
      </div>

      {/* Full-screen overlay — must live at the fragment root, NOT inside a
          FolderCard: FolderCard applies a `filter`, which traps position:fixed
          descendants to the card instead of the viewport. */}
      {processingSale && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-center">
            <p className="text-white text-xl font-semibold">Procesando venta</p>
            <p className="text-white/60 text-sm mt-2">Por favor espera un momento</p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {registerCode !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Registrar producto escaneado</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Código: <span className="font-mono">{registerCode}</span>
                </p>
              </div>
              <button onClick={() => setRegisterCode(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              <InventoryForm
                initialCodigo={registerCode}
                onAdded={handleRegistered}
                showNotification={showNotification}
              />
            </div>
          </div>
        </div>
      )}

      {completedSale && (
        <PostSaleModal
          sale={completedSale}
          biz={BUSINESS}
          printing={printer.printing ?? false}
          error={printer.error ?? null}
          isSupported={printer.isSupported ?? false}
          onPrint={() => printer.printReceipt?.(completedSale, BUSINESS).catch(() => { })}
          onClose={dismissSaleModal}
          showNotification={showNotification}
        />
      )}
    </>
  );
}
