import { useState } from 'react';
import { fetchSalesHistory, fetchProfitAnalysis } from '../services/salesService';

export function useSales() {
  const [salesHistory, setSalesHistory] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadHistory = async (limit = 50) => {
    try {
      const data = await fetchSalesHistory(limit);
      if (data.success) setSalesHistory(data.data);
    } catch (e) {
      console.error('Error loading sales history:', e);
    }
  };

  const loadProfits = async (period = selectedPeriod) => {
    try {
      const data = await fetchProfitAnalysis(
        period,
        period === 'custom' ? customStartDate : undefined,
        period === 'custom' ? customEndDate : undefined,
      );
      if (data.success) setProfitAnalysis(data.data);
    } catch (e) {
      console.error('Error loading profit analysis:', e);
    }
  };

  const filteredHistory = salesHistory.filter(sale => {
    if (!filterStartDate && !filterEndDate) return true;
    const saleDate = new Date(sale.Fecha);
    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if (start && end) return saleDate >= start && saleDate <= end;
    if (start) return saleDate >= start;
    if (end) return saleDate <= end;
    return true;
  });

  return {
    salesHistory,
    filteredHistory,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    profitAnalysis,
    selectedPeriod, setSelectedPeriod,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    loadHistory,
    loadProfits,
  };
}
