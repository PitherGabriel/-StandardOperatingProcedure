import { api } from '../api/client';

export async function processSale(cartData, vendedor) {
  const res = await api.post('/sale', { cart: cartData, vendedor });
  return res.json();
}

export async function fetchSalesHistory(limit = 50) {
  const res = await api.get(`/sales/history?limit=${limit}`);
  return res.json();
}

export async function fetchProfitAnalysis(period, startDate, endDate) {
  let url = `/sales/profit-analysis?period=${period}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  const res = await api.get(url);
  return res.json();
}
