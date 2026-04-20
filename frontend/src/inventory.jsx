import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';


export default function Inventory({ loadInventory, showNotification }) {
    // Estados para nuevo producto
    const [newProduct, setNewProduct] = useState({
        nombre: '',
        codigo: '',
        costo: '',
        unidad: '',
        precio1: '',
        precio2: '',
        precio3: '',
        cantidad: '',
        minStock: '',
        hasPrecio2: false,
        hasPrecio3: false
    });
    const [processingNewProduct, setProcessingNewProduct] = useState(false);

    // Codigo de nuevo producto
    useEffect(() => {
        if (newProduct.nombre) {
            setNewProduct(prev => ({ ...prev, codigo: generateProductCode(prev.nombre) }));
        }
    }, [newProduct.nombre]);

    // Generar código único basado en el nombre
    const generateProductCode = (nombre) => {
        if (!nombre) return '';

        // Tomar las primeras 3 letras del nombre (sin espacios)
        const cleanName = nombre.replace(/\s+/g, '').toUpperCase();
        const prefix = cleanName.substring(0, 3);

        // Generar 5 dígitos aleatorios
        const randomNum = Math.floor(10000 + Math.random() * 90000);

        return `${prefix}${randomNum}`;
    };

    // Agregar nuevo producto
    const addNewProduct = async () => {
        if (!newProduct.nombre || !newProduct.costo || !newProduct.precio1) {
            showNotification('Por favor complete los campos obligatorios: Nombre, Costo y Precio', 'error');
            return;
        }

        try {
            setProcessingNewProduct(true);
            const productData = {
                codigo: newProduct.codigo || generateProductCode(newProduct.nombre),
                nombre: newProduct.nombre,
                cantidad: newProduct.unidad === 'unidad'
                    ? parseInt(newProduct.cantidad) || 0
                    : parseFloat(newProduct.cantidad) || 0.0,
                costo: parseFloat(newProduct.costo),
                precio_1: parseFloat(newProduct.precio1),
                precio_2: newProduct.precio2 ? parseFloat(newProduct.precio2) : 0.0,
                precio_3: newProduct.precio3 ? parseFloat(newProduct.precio3) : 0.0,
                minStock: parseInt(newProduct.minStock) || 0,
                unidad: newProduct.unidad || 'unidad',
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/inventory/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            const result = await response.json();

            if (result.success) {
                showNotification(`Producto agregado exitosamente!\nCódigo: ${newProduct.codigo}`, 'success');
                setNewProduct({
                    nombre: '',
                    codigo: '',
                    costo: '',
                    precio1: '',
                    precio2: '',
                    precio3: '',
                    cantidad: '',
                    minStock: '',
                    unidad: 'unidad',
                    hasPrecio2: false,
                    hasPrecio3: false
                });
                loadInventory();
                setProcessingNewProduct(false);
            } else {
                showNotification(`Error al agregar producto: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error agregando producto:', error);
            showNotification(`Error al agregar producto: ${error}`, 'error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    Agregar Nuevo Producto
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newProduct.nombre}
                            onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                            placeholder="Escriba el nombre del producto"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad Inicial
                            </label>
                            <input
                                type="number"
                                step={newProduct.unidad === 'unidad' ? "1" : "0.01"}
                                value={newProduct.cantidad}
                                onChange={(e) => setNewProduct({ ...newProduct, cantidad: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Mínimo
                            </label>
                            <input
                                type="number"
                                step={newProduct.unidad === 'unidad' ? "1" : "0.01"}
                                value={newProduct.minStock}
                                onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Unidad de medida */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unidad de Medida <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={newProduct.unidad || 'unidad'}
                            onChange={(e) => setNewProduct({ ...newProduct, unidad: e.target.value })}
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

                    {/* Costo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Costo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={newProduct.costo}
                                onChange={(e) => setNewProduct({ ...newProduct, costo: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Precio 1 - obligatorio*/}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={newProduct.precio1 || ''}
                                onChange={(e) => setNewProduct({ ...newProduct, precio1: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                placeholder="0"
                            />
                        </div>
                        {newProduct.costo && newProduct.precio1 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-sm text-gray-600">Ganancia:</span>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-blue-600">
                                        {(((parseFloat(newProduct.precio1) - parseFloat(newProduct.costo)) / parseFloat(newProduct.costo)) * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        (${(parseFloat(newProduct.precio1) - parseFloat(newProduct.costo)).toFixed(2)})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Precio 2 - Opcional */}
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasPrecio2"
                                checked={newProduct.hasPrecio2 || false}
                                onChange={(e) => setNewProduct({
                                    ...newProduct,
                                    hasPrecio2: e.target.checked,
                                    precio2: e.target.checked ? newProduct.precio2 : ''
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-[#008cc8]"
                            />
                            <label htmlFor="hasPrecio2" className="text-sm font-semibold text-gray-700">
                                Precio 2
                            </label>
                        </div>
                        {newProduct.hasPrecio2 && (

                            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newProduct.precio2 || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, precio2: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                        placeholder="0.00"
                                    />
                                </div>
                                {newProduct.costo && newProduct.precio2 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Ganancia:</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-green-600">
                                                {(((parseFloat(newProduct.precio2) - parseFloat(newProduct.costo)) / parseFloat(newProduct.costo)) * 100).toFixed(1)}%
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                (${(parseFloat(newProduct.precio2) - parseFloat(newProduct.costo)).toFixed(2)})
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Precio 3 - Opcional */}
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasPrecio3"
                                checked={newProduct.hasPrecio3 || false}
                                onChange={(e) => setNewProduct({
                                    ...newProduct,
                                    hasPrecio3: e.target.checked,
                                    precio3: e.target.checked ? newProduct.precio3 : ''
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-[#008cc8]"
                            />
                            <label htmlFor="hasPrecio3" className="text-sm font-semibold text-gray-700">
                                Precio 3
                            </label>
                        </div>
                        {newProduct.hasPrecio3 && (
                            <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newProduct.precio3 || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, precio3: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                                        placeholder="0.00"
                                    />
                                </div>
                                {newProduct.costo && newProduct.precio3 && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Ganancia:</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-purple-600">
                                                {(((parseFloat(newProduct.precio3) - parseFloat(newProduct.costo)) / parseFloat(newProduct.costo)) * 100).toFixed(1)}%
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                (${(parseFloat(newProduct.precio3) - parseFloat(newProduct.costo)).toFixed(2)})
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Vista previa del código */}
                    {newProduct.nombre && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Código que se generará:</p>
                            <p className="text-lg font-mono font-bold text-gray-800 mt-1">
                                {newProduct.codigo}
                            </p>
                        </div>
                    )}


                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setNewProduct({
                                nombre: '',
                                costo: '',
                                precio1: '',
                                precio2: '',
                                precio3: '',
                                cantidad: '',
                                minStock: '',
                                unidad: 'unidad',
                                hasPrecio2: false,
                                hasPrecio3: false
                            })}
                            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={addNewProduct}
                            className="flex-1 px-4 py-3 bg-[#008cc8] text-white rounded-lg font-semibold hover:bg-[#057caf] transition flex items-center justify-center gap-2"
                        >
                            {processingNewProduct ? <Loader className="animate-spin" /> : 'Agregar producto'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}