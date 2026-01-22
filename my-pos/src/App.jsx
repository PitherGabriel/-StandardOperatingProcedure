import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, AlertTriangle, Plus, Minus, Trash2, Save, Search, History, TrendingUp, Calendar } from 'lucide-react';


const POSSystem = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('pos'); // pos, history, summary
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [vendedor, setVendedor] = useState('Sistema');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [clienteData, setClienteData] = useState({
    identificacion: '',
    razon_social: '',
    direccion: '',
    email: '',
    telefono: ''
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    const lowStock = inventory.filter(item => item.cantidad <= item.minStock);
    setAlerts(lowStock);
  }, [inventory]);

  const loadInventory = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`);
      const data = await response.json();
      if (data.success) {
        const formattedInventory = data.data.map(item => ({
          id: item.ID,
          nombre: item.Nombre,
          cantidad: item.Cantidad,
          precio: parseFloat(item.Precio),
          minStock: item.MinStock,
          codigo: item.Codigo
        }));
        setInventory(formattedInventory);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      setIsLoading(false);
    }
  };

  const loadSalesHistory = async (limit = 50) => {
    try {
      console.log("History requested")
      const response = await fetch(`${API_URL}/sales/history?limit=${limit}`);
      const data = await response.json();
      console.log(data)
      if (data.success) {
        setSalesHistory(data.data);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const loadSalesSummary = async (date = null) => {
    try {
      const url = date ? `${API_URL}/sales/summary?date=${date}` : `${API_URL}/sales/summary`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSalesSummary(data.data);
      }
    } catch (error) {
      console.error('Error cargando resumen:', error);
    }
  };

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
      setCart([...cart, { ...product, cantidadVendida: 1 }]);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    const product = inventory.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    const newQuantity = cartItem.cantidadVendida + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.cantidad) {
      alert('¡No hay suficiente stock!');
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, cantidadVendida: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const cartData = cart.map(item => ({
        codigo: item.codigo,
        cantidad_vendida: item.cantidadVendida
      }));

      const response = await fetch(`${API_URL}/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart: cartData, vendedor: vendedor })
      });

      const result = await response.json();

      if (result.success) {
        const updatedInventory = inventory.map(item => {
          const cartItem = cart.find(c => c.id === item.id);
          if (cartItem) {
            return {
              ...item,
              cantidad: item.cantidad - cartItem.cantidadVendida
            };
          }
          return item;
        });

        setInventory(updatedInventory);

        let message = `✅ Venta procesada exitosamente!\n`;
        message += `📝 ID: ${result.sale_id}\n`;
        message += `💰 Total: $${result.total.toFixed(2)}\n`;
        message += `📦 Productos: ${result.items}`;

        if (result.alerts && result.alerts.length > 0) {
          message += '\n\n⚠️ Alertas de stock bajo:\n';
          result.alerts.forEach(a => {
            message += `• ${a.producto}: ${a.cantidad_restante} unidades\n`;
          });
        }

        alert(message);
        setCart([]);
        loadInventory();
      } else {
        alert('Error procesando la venta: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidadVendida), 0);
  };

  const filteredInventory = inventory.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupSalesByID = (sales) => {
    const grouped = {};
    sales.forEach(sale => {
      if (!grouped[sale.VentaID]) {
        grouped[sale.VentaID] = {
          id: sale.VentaID,
          fecha: sale.Fecha,
          hora: sale.Hora,
          total: sale.TotalVenta,
          vendedor: sale.Vendedor,
          items: []
        };
      }
      grouped[sale.VentaID].items.push({
        nombre: sale.Nombre,
        codigo: sale.Codigo,
        cantidad: sale.Cantidad,
        precio: sale.PrecioUnitario,
        subtotal: sale.Subtotal
      });
    });
    return Object.values(grouped);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <img src='logo.png' alt='TB' className='h-14' />
          Centro Comercial TB
        </h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('pos')}
              className={`pb-2 px-4 font-medium transition ${activeTab === 'pos'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <ShoppingCart className="inline mr-2" size={18} />
              Punto de Venta
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                loadSalesHistory();
              }}
              className={`pb-2 px-4 font-medium transition ${activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <History className="inline mr-2" size={18} />
              Historial
            </button>
            <button
              onClick={() => {
                setActiveTab('summary');
                loadSalesSummary();
              }}
              className={`pb-2 px-4 font-medium transition ${activeTab === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <TrendingUp className="inline mr-2" size={18} />
              Resumen
            </button>
          </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && activeTab === 'pos' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Alertas de Inventario Bajo</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {alerts.map(item => (
                    <div key={item.id} className="mb-1">
                      <strong>{item.nombre}</strong>: {item.cantidad} unidades
                      (mínimo: {item.minStock})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Package size={20} />
                  Productos Disponibles
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInventory.map(product => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition ${product.cantidad === 0 ? 'bg-gray-100 opacity-60' :
                      product.cantidad <= product.minStock ? 'border-yellow-300 bg-yellow-50' :
                        'border-gray-200'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{product.nombre}</h3>
                        <p className="text-sm text-gray-500">{product.codigo}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        ${product.precio.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-sm ${product.cantidad === 0 ? 'text-red-600 font-semibold' :
                        product.cantidad <= product.minStock ? 'text-yellow-600 font-semibold' :
                          'text-gray-600'
                        }`}>
                        Stock: {product.cantidad}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.cantidad === 0}
                        className={`px-4 py-2 rounded-lg font-medium transition ${product.cantidad === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Carrito de Venta</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
                <input
                  type="text"
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del vendedor"
                />
              </div>

              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Carrito vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.nombre}</h4>
                            <p className="text-sm text-gray-500">${item.precio.toFixed(2)} c/u</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-semibold">
                              {item.cantidadVendida}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="font-bold text-gray-800">
                            ${(item.precio * item.cantidadVendida).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-700">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={processSale}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      Procesar Venta
                    </button>

                    <button className="w-full bg-purple-600 text-white py-3 rounded-lg">
                      💳 Procesar Venta con Factura
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Historial */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Historial de Ventas</h2>
              <button
                onClick={() => loadSalesHistory(50)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Actualizar
              </button>
            </div>

            {salesHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <History size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupSalesByID(salesHistory).reverse().map(sale => (
                  <div key={sale.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">Venta {sale.id}</h3>
                        <p className="text-sm text-gray-500">
                          {sale.fecha} - {sale.hora} | Vendedor: {sale.vendedor}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        ${sale.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos:</h4>
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.cantidad}x {item.nombre} ({item.codigo})
                            </span>
                            <span className="font-semibold text-gray-800">
                              ${item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Resumen */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Resumen de Ventas</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => loadSalesSummary()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Calendar size={20} />
                  Hoy
                </button>
              </div>
            </div>

            {salesSummary ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Fecha</p>
                    <p className="text-2xl font-bold text-blue-900">{salesSummary.date}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${salesSummary.total_amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Núm. Ventas</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {salesSummary.total_sales || 0}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium mb-1">Items Vendidos</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {salesSummary.items_sold || 0}
                    </p>
                  </div>
                </div>

                {salesSummary.sales && salesSummary.sales.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle del Día</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hora</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Producto</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Cant.</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Precio</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Vendedor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {salesSummary.sales.map((sale, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-gray-600">{sale.Hora}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">{sale.Nombre}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{sale.Cantidad}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">${sale.PrecioUnitario.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">${sale.Subtotal.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{sale.Vendedor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>Cargando resumen...</p>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Inventario */}
        {activeTab === 'pos' && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventario Actual</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Código</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Precio</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Mín. Stock</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.map(item => (
                    <tr key={item.id} className={item.cantidad <= item.minStock ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.codigo}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nombre}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">${item.precio.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{item.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{item.minStock}</td>
                      <td className="px-4 py-3 text-center">
                        {item.cantidad === 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">
                            Agotado
                          </span>
                        ) : item.cantidad <= item.minStock ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                            Bajo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSSystem;