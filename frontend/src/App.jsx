import React, { useState, useEffect, forwardRef } from 'react';
import Header from './header';
import LoginScreen from './login';
import NotificationToast from './notification';
import PosBox from './pos';
import Stock from './stock';
import Inventory from './inventory';

import {
  AlertTriangle, Minus,
  History,
  TrendingUp,
  CircleDollarSign
} from 'lucide-react';

const POSSystem = () => {

  // Al inicio del componente POSSystem, agregar estados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('pos'); // pos, inventario, inventory-add, history, summary
  const [salesHistory, setSalesHistory] = useState([]);
  const [notification, setNotification] = useState(null);

  // Estados para filtros de historial
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Estados para calculo de utilidades
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  // Acitivar alerta de inventario 
  useEffect(() => {
    const lowStock = inventory.filter(item => item.cantidad <= item.minStock);
    setAlerts(lowStock);
  }, [inventory]);

  // Notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    //setTimeout(() => setNotification(null), 5000); // Auto-hide after 5 seconds
  };

  const loadProfitAnalysis = async (period = selectedPeriod) => {
    try {
      let url = `${import.meta.env.VITE_BACKEND_API_URL}/sales/profit-analysis?period=${period}`;

      if (period === 'custom' && customStartDate && customEndDate) {
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setProfitAnalysis(data.data);
      }
    } catch (error) {
      console.error('Error cargando análisis de utilidades:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/inventory`);
      const data = await response.json();
      if (data.success) {
        const formattedInventory = data.data.map(item => ({
          id: item.ID,
          nombre: item.Nombre,
          cantidad: item.Cantidad,
          unidad: item.Unidad,
          precio: parseFloat(item.Precio_1),
          precio_2: parseFloat(item.Precio_2),
          precio_3: parseFloat(item.Precio_3),
          costo: parseFloat(item.Costo || 0),
          minStock: item.MinStock,
          codigo: item.Codigo
        }));
        //console.log(formattedInventory)
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
      //console.log("History requested")
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/sales/history?limit=${limit}`);
      const data = await response.json();
      //console.log(data)
      if (data.success) {
        setSalesHistory(data.data);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  // Filtrar ventas por fecha
  const filteredSalesHistory = salesHistory.filter(sale => {
    if (!filterStartDate && !filterEndDate) return true;

    const saleDate = new Date(sale.Fecha);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    if (startDate && endDate) {
      return saleDate >= startDate && saleDate <= endDate;
    } else if (startDate) {
      return saleDate >= startDate;
    } else if (endDate) {
      return saleDate <= endDate;
    }
    return true;
  });

  // Comprobar si existe una autentificación de usuario 
  const checkAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/auth/check`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        await loadInventory();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginScreen
        setCurrentUser={setCurrentUser}
        setIsAuthenticated={setIsAuthenticated}
        showNotification={showNotification}
        loadInventory={loadInventory}
        />

      ) : (

        <div className="min-h-screen bg-gray-50">
          {notification && (
            <NotificationToast
              notification={notification}
              setNotification={setNotification}
            />)}

          {/* Header */}
          <Header
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            setIsAuthenticated={setIsAuthenticated}
            setCart={setCart}
            setInventory={setInventory}
          />

          {/* Tabs */}
          <div className="bg-[#ffffff] shadow">
            <div className="flex sm:justify-center items-center gap-1 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'pos'
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-600 hover:text-[#008cc8]'
                  }`}
              >
                Caja
              </button>
              <button
                onClick={() => setActiveTab('inventory-add')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory-add'
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-600 hover:text-[#008cc8]'
                  }`}
              >
                Inventario
              </button>
              <button
                onClick={() => {
                  setActiveTab('inventario');
                }}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventario'
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-600 hover:text-[#008cc8]'
                  }`}
              >
                Stock
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  loadSalesHistory();
                }}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'history'
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-600 hover:text-[#008cc8]'
                  }`}
              >
                Historial de ventas
              </button>
              <button
                onClick={() => {
                  setActiveTab('profits');
                  loadProfitAnalysis();
                }}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'profits'
                  ? 'border-b-2 border-[#008cc8] text-[#008cc8]'
                  : 'text-gray-600 hover:text-[#008cc8]'
                  }`}
              >
                Utilidades
              </button>

            </div>
          </div>

          {/* Alertas */}
          {activeTab === 'inventario' && alerts.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" />
                <p className="text-yellow-800 font-semibold">
                  {alerts.length} productos con stock bajo
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {/* CAJA */}
            {activeTab === 'pos' && (
              <PosBox
                inventory={inventory}
                setInventory={setInventory}
                currentUser={currentUser}
                showNotification={showNotification}
              />
            )}

            {/* INVENTARIO - Agregar Productos */}
            {activeTab === 'inventory-add' && (
              <Inventory
                loadInventory={loadInventory}
                showNotification={showNotification} />
            )}

            {/* STOCK - Revisar estado de productos*/}
            {activeTab === 'inventario' && (
              <Stock
                inventory={inventory}
              />
            )}

            {/* HISTORIAL - Historial de ventas */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Historial de Ventas</h2>
                  </div>

                  {/* Filtros de Fecha */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio:
                      </label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin:
                      </label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setFilterStartDate('');
                          setFilterEndDate('');
                        }}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>

                  {/* Información de resultados */}
                  <div className="mt-4 text-sm text-gray-600">
                    Mostrando {filteredSalesHistory.length} de {salesHistory.length} ventas
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredSalesHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <History size={48} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No hay ventas en el rango seleccionado</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSalesHistory.map((sale, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(`${sale.Fecha}T${sale.Hora}`).toLocaleString('es-ES')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800">{sale.Nombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{sale.Cantidad}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">${sale.PrecioUnitario}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">${sale.Subtotal}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">${sale.TotalVenta}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{sale.Vendedor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* UTILIDADES - Analysis de ventas y utilidades*/}
            {activeTab === 'profits' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    Cierre de caja
                  </h2>

                  {/* Selector de Período */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <button
                      onClick={() => {
                        setSelectedPeriod('today');
                        loadProfitAnalysis('today');
                      }}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${selectedPeriod === 'today'
                        ? 'bg-[#008cc8] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPeriod('week');
                        loadProfitAnalysis('week');
                      }}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${selectedPeriod === 'week'
                        ? 'bg-[#008cc8] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Esta Semana
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPeriod('month');
                        loadProfitAnalysis('month');
                      }}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${selectedPeriod === 'month'
                        ? 'bg-[#008cc8] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Este Mes
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('custom')}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${selectedPeriod === 'custom'
                        ? 'bg-[#008cc8] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {/* Filtro personalizado */}
                  {selectedPeriod === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desde:</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hasta:</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008cc8]"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => loadProfitAnalysis('custom')}
                          className="w-full px-4 py-2 bg-[#008cc8] text-white rounded-lg hover:bg-[#0176a8] transition"
                        >
                          Consultar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {profitAnalysis && (
                  <>
                    {/* Encabezado del período */}
                    <div className="bg-linear-to-r from-[#008cc8] to-[#0070a0] text-white p-6 rounded-lg shadow-lg">
                      <h3 className="text-2xl font-bold text-center">{profitAnalysis.periodo}</h3>
                    </div>

                    {/* Tarjetas de Resumen - CIERRE DE CAJA */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">Ingresos</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              ${profitAnalysis.total_ingresos}
                            </p>
                          </div>
                          <TrendingUp className="text-blue-500" size={32} />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">Costos</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                              ${profitAnalysis.total_costos}
                            </p>
                          </div>
                          <Minus className="text-red-500" size={32} />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">Utilidad Neta</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              ${profitAnalysis.utilidad_neta}
                            </p>
                          </div>
                          <CircleDollarSign className="text-green-500" size={32} />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">Margen</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                              {profitAnalysis.margen_total}%
                            </p>
                          </div>
                          <TrendingUp className="text-purple-500" size={32} />
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas adicionales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-gray-500 text-sm">Total de Ventas</p>
                        <p className="text-xl font-bold text-gray-800">{profitAnalysis.total_ventas}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-gray-500 text-sm">Unidades Vendidas</p>
                        <p className="text-xl font-bold text-gray-800">{profitAnalysis.total_unidades}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-gray-500 text-sm">Ticket Promedio</p>
                        <p className="text-xl font-bold text-gray-800">${profitAnalysis.ticket_promedio}</p>
                      </div>
                    </div>

                    {/* Top Productos */}
                    {profitAnalysis.productos_vendidos && profitAnalysis.productos_vendidos.length > 0 && (
                      <div className="bg-white rounded-lg shadow">
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-800">Top 10 Productos Más Rentables</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {profitAnalysis.productos_vendidos.map((producto, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800">{producto.producto}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-600">{producto.cantidad.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right text-blue-600">
                                    ${producto.ingresos.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-red-600">
                                    ${producto.costos.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                    ${producto.utilidad.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Estadísticas por Vendedor */}
                    {profitAnalysis.vendedores && profitAnalysis.vendedores.length > 0 && (
                      <div className="bg-white rounded-lg shadow">
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-800">Rendimiento por Vendedor</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {profitAnalysis.vendedores.map((vendedor, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">{vendedor.vendedor}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-600">{vendedor.ventas}</td>
                                  <td className="px-4 py-3 text-sm text-right text-blue-600">
                                    ${vendedor.ingresos.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                    ${vendedor.utilidad.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default POSSystem;