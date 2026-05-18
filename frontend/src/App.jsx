import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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

const POSSystem = () => {
  const auth = useAuth();
  const { notification, setNotification, showNotification } = useNotification();
  const sales = useSales();
  const printer = usePrinter();
  const [activeTab, setActiveTab] = useState('pos');
  const [activeSubTab, setActiveSubTab] = useState('ver-inventario');

  const lowStock = auth.inventory.filter(item => item.cantidad <= item.minStock);

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
      />

      <TabNav
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onTabChange={handleTabChange}
        onSubTabChange={setActiveSubTab}
      />

      {activeTab === 'productos' && activeSubTab === 'ver-inventario' && lowStock.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4 rounded shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" />
            <p className="text-yellow-800 font-semibold">{lowStock.length} productos con stock bajo</p>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 min-h-0 overflow-auto">
        {activeTab === 'pos' && (
          <PosBox
            inventory={auth.inventory}
            setInventory={auth.setInventory}
            currentUser={auth.currentUser}
            showNotification={showNotification}
            printer={printer}
          />
        )}

        {activeTab === 'productos' && activeSubTab === 'ver-inventario' && (
          <StockTable
            inventory={auth.inventory}
            onInventoryChange={auth.refreshInventory}
            showNotification={showNotification}
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
            salesHistory={sales.salesHistory}
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
