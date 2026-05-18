import { api } from '../api/client';

export async function processSale(cartData, vendedor, metodoPago = 'efectivo', referencia = '', descuentoPorcentaje = 0) {
  const res = await api.post('/sale', { cart: cartData, vendedor, metodoPago, referencia, descuentoPorcentaje });
  return res.json();
}

export async function fetchSalesHistory(limit = 50) {
  const res = await api.get(`/sales/history?limit=${limit}`);
  return res.json();
}

export async function refundSale(saleId, items) {
  const res = await api.post(`/sale/${encodeURIComponent(saleId)}/refund`, { items });
  return res.json();
}

export async function processInvoicedSale(cartData, vendedor, metodoPago = 'efectivo', referencia = '', descuentoPorcentaje = 0, cliente = {}) {
  const res = await api.post('/sale-with-invoice-sri', {
    cart: cartData, vendedor, metodoPago, referencia, descuentoPorcentaje, cliente,
  });
  return res.json();
}

export async function fetchSalesChart(period) {
  const res = await api.get(`/sales/chart?period=${period}`);
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
