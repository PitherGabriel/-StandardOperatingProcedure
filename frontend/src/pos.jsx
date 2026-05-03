import React, { useState, useEffect, forwardRef } from 'react';
import { ShoppingCart, Trash2, Search, Loader, Plus, DollarSign, Printer } from 'lucide-react';
import CameraModal from './camera';
import { usePrinter } from './usePrinter';
import PostSaleModal from './PostSaleModal';
import { generateSaleId } from './printerService';

const BUSINESS = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'Mi Tienda',
  ruc: import.meta.env.VITE_BUSINESS_RUC || '0000000000001',
  address: import.meta.env.VITE_BUSINESS_ADDRESS || 'Dirección del negocio',
};

export default function PosBox({ inventory, setInventory, currentUser, showNotification }) {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [receivedMoney, setReceivedMoney] = useState('');
    const [processingSale, setProcessingSale] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);
    const printer = usePrinter();

    // Filtrar productos por búsqueda
    const filteredInventory = searchTerm.trim() === '' ? []
        : inventory.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Agregar producto al carrito
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (product.cantidad === 0) {
            alert('¡Producto sin stock!');
            return;
        }

        if (existingItem) {
            if (existingItem.cantidadVendida >= product.cantidad) {
                alert('¡No hay suficiente stock!');
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, cantidadVendida: item.cantidadVendida + 1 }
                    : item
            ));

        } else {
            setCart([...cart,
            {
                ...product,
                cantidadVendida: product.unidad == 'unidad' ? 1 : 1,
                priceType: 'precio',
                precioActual: product.precio
            }]);
            setSearchTerm('');
        }
    };

    // Eliminar producto de carrito
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // Cambiar tipo de precio en el carrito
    const changePriceType = (productId, newPriceType) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                return {
                    ...item,
                    priceType: newPriceType,
                    precioActual: item[newPriceType]
                };
            }
            return item;
        }));
    };

    // Updated function to handle empty inputs
    const setCartQuantity = (productId, newQuantity) => {
        const product = inventory.find(p => p.id === productId);

        // Allow empty input (user is typing) - set to 0 temporarily
        if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
            setCart(cart.map(item =>
                item.id === productId
                    ? { ...item, cantidadVendida: 0 }
                    : item
            ));
            return;
        }

        const quantity = parseFloat(newQuantity);

        // If NaN, set to 0
        if (isNaN(quantity)) {
            setCart(cart.map(item =>
                item.id === productId
                    ? { ...item, cantidadVendida: 0 }
                    : item
            ));
            return;
        }

        // Only remove if user explicitly sets negative (optional - you can remove this check)
        if (quantity < 0) {
            return; // Don't allow negative
        }

        // Check stock
        if (quantity > product.cantidad) {
            alert('¡No hay suficiente stock!');
            // Set to max available instead of blocking
            setCart(cart.map(item =>
                item.id === productId
                    ? { ...item, cantidadVendida: product.cantidad }
                    : item
            ));
            return;
        }

        // Update normally
        setCart(cart.map(item =>
            item.id === productId
                ? { ...item, cantidadVendida: quantity }
                : item
        ));
    };

    // Calcular total de la venta
    const calculateTotal = () => {
        return cart.reduce(
            (sum, item) =>
                sum + (item.precioActual ?? item.precio) * item.cantidadVendida,
            0
        )
    };

    // Calcular el cambio para el cliente
    const calculateChange = () => {
        const total = calculateTotal().toFixed(2);
        const received = parseFloat(receivedMoney) || 0;
        return received - total;
    };

    // Procesar venta simple
    const processSale = async () => {
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }

        setProcessingSale(true);

        // Snapshot sale data before the async call
        const total = calculateTotal();
        const received = parseFloat(receivedMoney) || 0;
        const saleSnapshot = {
            items: cart.map(item => ({
                name: item.nombre,
                code: item.codigo,
                qty: item.cantidadVendida,
                unit: item.unidad,
                price: item.precioActual ?? item.precio,
            })),
            total,
            received,
            change: Math.max(0, received - total),
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
                tipoPrecio: item.priceType
            }));

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/sale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart: cartData,
                    vendedor: currentUser?.nombre
                })
            });

            const result = await response.json();

            if (result.success) {
                const updatedInventory = inventory.map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    if (cartItem) {
                        return { ...item, cantidad: item.cantidad - cartItem.cantidadVendida };
                    }
                    return item;
                });
                setInventory(updatedInventory);
                setCompletedSale(saleSnapshot);
            } else {
                showNotification(result.error, 'error');
            }

        } catch (error) {
            console.error('Error procesando venta:', error);
            showNotification('Error al procesar la venta', 'error');
        } finally {
            setProcessingSale(false);
        }
    };

    const dismissSaleModal = () => {
        setCompletedSale(null);
        setCart([]);
        setReceivedMoney('');
        setSearchTerm('');
        showNotification('¡Venta procesada exitosamente!', 'success');
    };

    const handlePrint = async () => {
        try {
            await printer.printReceipt(completedSale, BUSINESS);
        } catch {
            // error already surfaced in printer.error
        }
    };

    const processPhotoSale = async (img, onResult) => {
        const formData = new FormData();
        formData.append('image', img);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/analyze-picture`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Backend error body:', errorBody);
                throw new Error(`Error del servidor: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();
            if (result.success) {
                onResult?.(result.cart); // pass result back to CameraModal
            }
        } catch (error) {
            console.error('Error al analizar foto:', error);
            showNotification('Error al analizar foto', 'error');
            throw error; // re-throw so CameraModal catches it and goes back to preview
        }
    };

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-210px)]">
            {/* Búsqueda de Productos */}
            <div className="bg-white rounded-lg shadow-lg flex flex-col overflow-hidden h-[45vh] lg:h-full">
                {/* Fixed header - never shrinks */}
                <div className="p-4 shrink-0">
                    <h2 className="text-xl sm:text-small font-bold text-gray-800 mb-4">Productos</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Busca por nombre o codigo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                        />
                    </div>
                </div>

                {/* Scrollable area - takes remaining space */}
                <div className="overflow-y-auto p-4 flex-1 min-h-0">
                    {searchTerm.trim() === '' ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <Search size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Comienza a escribir para buscar productos</p>
                            </div>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>No se encontraron productos</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredInventory.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => product.cantidad > 0 && addToCart(product)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-all duration-150
                            ${product.cantidad === 0
                                            ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
                                            : 'bg-white border-gray-200 shadow-sm cursor-pointer hover:border-[#008cc8] hover:shadow-md'
                                        }`}
                                >
                                    {/* Name + code */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-sm text-gray-800 truncate" title={product.nombre}>
                                            {product.nombre}
                                        </span>
                                        <span className="text-xs text-gray-500">{product.codigo}</span>
                                        <span className="text-xs text-gray-500 shrink-0">
                                            Inventario: {product.cantidad} {product.unidad}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <span className="flex items-center text-sm font-bold text-[#0075a7] shrink-0">
                                        ${product.precio}
                                    </span>

                                    {/* Add button */}
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold shrink-0
                            ${product.cantidad === 0
                                            ? 'bg-gray-200 text-gray-400'
                                            : 'bg-[#0075a7] text-white'
                                        }`}>
                                        <Plus size={14} />
                                        <span>Añadir</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Carrito de Venta */}
            <div className="bg-white rounded-lg shadow-lg flex flex-col overflow-hidden h-[55vh] lg:h-full">
                <div className="p-4 shrink-0 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Caja</h2>
                    {printer.isSupported && (
                        <button
                            onClick={!printer.connected ? printer.connect : undefined}
                            title={printer.connected ? 'Impresora conectada' : 'Conectar impresora'}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition
                                ${printer.connected
                                    ? 'bg-green-100 text-green-700 cursor-default'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${printer.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <Printer size={13} />
                            {printer.connected ? 'Lista' : 'Conectar'}
                        </button>
                    )}
                </div>

                {/* Fixed table header - only shows when cart has items */}
                {cart.length > 0 && (
                    <div className="px-4 shrink-0">
                        <div className="hidden sm:grid grid-cols-12 gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                            <div className="col-span-4 text-xs font-medium text-gray-500 uppercase">Producto</div>
                            <div className="col-span-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</div>
                            <div className="col-span-3 text-center text-xs font-medium text-gray-500 uppercase">Precio</div>
                            <div className="col-span-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</div>
                        </div>
                    </div>
                )}

                {/* Scrollable cart items */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4">
                    {cart.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                <p>El carrito está vacío</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map(item => {
                                const hasTwoPrices = item.precio_2 !== undefined && item.precio_2 !== null && item.precio_2 > 0;

                                return (
                                    <div key={item.id} className="bg-gray-100 p-3 rounded-lg">

                                        {/* MOBILE CARD */}
                                        <div className="sm:hidden space-y-2">

                                            {/* Product name + delete */}
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-sm text-gray-800">
                                                    {item.nombre}
                                                </h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1 text-[#bb1c49] hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Quantity */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Cantidad</span>
                                                <input
                                                    type="number"
                                                    value={item.cantidadVendida || ''}
                                                    placeholder="0"
                                                    step={item.unidad === 'unidad' ? "1" : '0.01'}
                                                    min="0"
                                                    onChange={(e) => setCartQuantity(item.id, e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="w-24 text-center text-sm font-semibold bg-gray-50 border border-gray-300 rounded px-2 py-1"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Precio</span>

                                                {hasTwoPrices ? (
                                                    <select
                                                        value={item.priceType || 'precio'}
                                                        onChange={(e) => changePriceType(item.id, e.target.value)}
                                                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="precio">${item.precio?.toFixed(3)}</option>
                                                        {item.precio_2 > 0 && (
                                                            <option value="precio_2">${item.precio_2?.toFixed(3)}</option>
                                                        )}
                                                        {item.precio_3 > 0 && (
                                                            <option value="precio_3">${item.precio_3?.toFixed(3)}</option>
                                                        )}
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-semibold">
                                                        ${item.precio?.toFixed(3)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Subtotal */}
                                            <div className="flex justify-between items-center border-t pt-2">
                                                <span className="text-xs text-gray-500">Subtotal</span>
                                                <span className="text-sm font-bold text-gray-800">
                                                    ${((item.precioActual || item.precio) * item.cantidadVendida).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* DESKTOP TABLE ROW */}
                                        <div className="hidden sm:grid grid-cols-12 gap-2 items-center">

                                            <div className="col-span-4 min-w-0">
                                                <h3 className="font-semibold text-sm text-gray-800 truncate">
                                                    {item.nombre}
                                                </h3>
                                            </div>

                                            <div className="col-span-3 flex justify-center">
                                                <input
                                                    type="number"
                                                    value={item.cantidadVendida || ''}
                                                    step={item.unidad === 'unidad' ? "1" : '0.01'}
                                                    min="0"
                                                    onChange={(e) => setCartQuantity(item.id, e.target.value)}
                                                    className="w-20 text-center text-sm bg-gray-50 border rounded px-2 py-1"
                                                />
                                            </div>

                                            <div className="col-span-3 flex justify-center">
                                                {hasTwoPrices ? (
                                                    <select
                                                        value={item.priceType || 'precio'}
                                                        onChange={(e) => changePriceType(item.id, e.target.value)}
                                                        className="text-xs border rounded px-2 py-1"
                                                    >
                                                        <option value="precio">${item.precio?.toFixed(3)}</option>
                                                        {item.precio_2 > 0 && (
                                                            <option value="precio_2">${item.precio_2?.toFixed(3)}</option>
                                                        )}
                                                        {item.precio_3 > 0 && (
                                                            <option value="precio_3">${item.precio_3?.toFixed(3)}</option>
                                                        )}
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-semibold">
                                                        ${item.precio?.toFixed(3)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-span-2 flex justify-end items-center gap-2">
                                                <p className="text-sm font-bold text-gray-800">
                                                    ${((item.precioActual || item.precio) * item.cantidadVendida).toFixed(2)}
                                                </p>

                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1 text-[#bb1c49] hover:bg-red-50 rounded"
                                                >
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

                {/* Total y Pago */}
                <div className="p-3 lg:p-4 space-y-2 shrink-0">
                    <div className="h-px bg-gray-800"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg lg:text-2xl font-semibold">Total</span>
                        <span className="text-lg lg:text-2xl font-semibold text-[#2b2929]">$ {calculateTotal().toFixed(2)}</span>
                    </div>

                    {/* Dinero Recibido y Vuelto */}
                    <div className="space-y-2">
                        {/* Recibe row */}
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

                        {/* Vuelto */}
                        {receivedMoney && parseFloat(receivedMoney) >= parseFloat(calculateTotal().toFixed(2)) && calculateTotal() > 0 && (
                            <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                                <span className="text-sm font-medium text-green-800">Vuelto</span>
                                <span className="text-lg font-bold text-green-600">
                                    ${calculateChange().toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* Falta */}
                        {receivedMoney && parseFloat(receivedMoney) < parseFloat(calculateTotal().toFixed(2)) && calculateTotal() > 0 && (
                            <div className="flex justify-between items-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                <span className="text-sm font-medium text-red-800">Falta</span>
                                <span className="text-lg font-bold text-red-600">
                                    ${(calculateTotal() - parseFloat(receivedMoney)).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Processing overlay */}
                    {processingSale && (
                        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-8">
                            <div className="text-center">
                                <p className="text-white text-xl font-semibold">Procesando venta</p>
                                <p className="text-white/60 text-sm mt-2">Por favor espera un momento</p>
                            </div>
                            <div className="flex gap-2">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-[#008cc8] animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={processSale}
                            disabled={cart.length === 0 || processingSale}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 
                                ${cart.length === 0 || processingSale
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#1d8a02] text-white hover:bg-[#006b00]'
                                }`}
                        >
                            Pagar
                        </button>
                        <div className='flex-1'>
                            <CameraModal
                                showNotification={showNotification}
                                currentUser={currentUser}
                                inventory={inventory}
                                setInventory={setInventory}
                                onCapture={async (file, onResult) => {
                                    await processPhotoSale(file, onResult);
                                }}
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
                onPrint={handlePrint}
                onClose={dismissSaleModal}
            />
        )}
        </>
    );
}