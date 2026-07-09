import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotification } from './hooks/useNotification';
import { useSales } from './hooks/useSales';
import { usePrinter } from './hooks/usePrinter';
import Header from './components/layout/Header';
import TabNav from './components/layout/TabNav';
import LoginScreen from './components/layout/LoginScreen';
import NotificationToast from './components/ui/NotificationToast';
import PosBox from './components/pos/PosBox';
import StockTable from './components/inventory/StockTable';
import InventoryForm from './components/inventory/InventoryForm';
import HistoryPage from './pages/HistoryPage';
import ProfitsPage from './pages/ProfitsPage';
import CategoriasPage from './pages/CategoriasPage';
import DashboardPage from './pages/DashboardPage';

const POSSystem = () => {
  const auth = useAuth();
  const { notification, setNotification, showNotification } = useNotification();
  const sales = useSales();
  const printer = usePrinter();
  const [activeTab, setActiveTab] = useState('pos');
  const [activeSubTab, setActiveSubTab] = useState('ver-inventario');

  const alerts = auth.inventory
    .filter(item => item.cantidad <= item.minStock)
    .map(item => ({ codigo: item.codigo, nombre: item.nombre, cantidad: item.cantidad, minStock: item.minStock }));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') sales.loadHistory();
    if (tab === 'profits') sales.loadProfits();
  };

  if (!auth.isAuthenticated) {
    return (
      <>
        {notification && <NotificationToast notification={notification} setNotification={setNotification} />}
        <LoginScreen onLogin={auth.handleLogin} showNotification={showNotification} />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {notification && <NotificationToast notification={notification} setNotification={setNotification} />}

      <Header
        currentUser={auth.currentUser}
        onLogout={auth.handleLogout}
        printer={printer}
        onPrinterConnect={printer.connect}
        showNotification={showNotification}
        alerts={alerts}
      />

      <TabNav
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onTabChange={handleTabChange}
        onSubTabChange={setActiveSubTab}
      />

<div className="p-4 flex-1 min-h-0 overflow-auto">
        {activeTab === 'dashboard' && <DashboardPage />}

        {activeTab === 'pos' && (
          <PosBox
            inventory={auth.inventory}
            setInventory={auth.setInventory}
            refreshInventory={auth.refreshInventory}
            currentUser={auth.currentUser}
            showNotification={showNotification}
            printer={printer}
            inventoryLoading={auth.inventoryLoading}
          />
        )}

        {activeTab === 'productos' && activeSubTab === 'ver-inventario' && (
          <StockTable
            inventory={auth.inventory}
            onInventoryChange={auth.refreshInventory}
            showNotification={showNotification}
            printer={printer}
          />
        )}
        {activeTab === 'productos' && activeSubTab === 'anadir-producto' && (
          <InventoryForm
            onAdded={auth.refreshInventory}
            showNotification={showNotification}
          />
        )}
        {activeTab === 'productos' && activeSubTab === 'categorias' && (
          <CategoriasPage showNotification={showNotification} />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            loading={sales.historyLoading}
            filteredHistory={sales.filteredHistory}
            filterStartDate={sales.filterStartDate}
            setFilterStartDate={sales.setFilterStartDate}
            filterEndDate={sales.filterEndDate}
            setFilterEndDate={sales.setFilterEndDate}
            onHistoryChange={() => { sales.loadHistory(); auth.refreshInventory(); }}
            showNotification={showNotification}
          />
        )}
        {activeTab === 'profits' && (
          <ProfitsPage
            loading={sales.profitsLoading}
            profitAnalysis={sales.profitAnalysis}
            selectedPeriod={sales.selectedPeriod}
            setSelectedPeriod={sales.setSelectedPeriod}
            customStartDate={sales.customStartDate}
            setCustomStartDate={sales.setCustomStartDate}
            customEndDate={sales.customEndDate}
            setCustomEndDate={sales.setCustomEndDate}
            onLoadProfits={sales.loadProfits}
          />
        )}
      </div>
    </div>
  );
};

export default POSSystem;
