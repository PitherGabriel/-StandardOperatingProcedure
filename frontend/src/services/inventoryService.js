import { api } from '../api/client';

export async function fetchInventory() {
  const res = await api.get('/inventory');
  const data = await res.json();
  if (!data.success) throw new Error('Failed to load inventory');
  return data.data.map(item => ({
    id: item.ID,
    nombre: item.Nombre,
    cantidad: item.Cantidad,
    unidad: item.Unidad,
    precio: parseFloat(item.Precio_1),
    precio_2: parseFloat(item.Precio_2),
    precio_3: parseFloat(item.Precio_3),
    costo: parseFloat(item.Costo || 0),
    minStock: item.MinStock,
    codigo: item.Codigo,
    categoria: item.Categoria || '',
    subcategoria: item.Subcategoria || '',
  }));
}

export async function addProduct(productData) {
  const res = await api.post('/inventory/add', productData);
  return res.json();
}

export async function fetchCategories() {
  const res = await api.get('/categories');
  const data = await res.json();
  if (!data.success) throw new Error('Failed to load categories');
  return data.data;
}

export async function addCategory(categoria, subcategoria = '') {
  const res = await api.post('/categories', { categoria, subcategoria });
  return res.json();
}

export async function updateProduct(codigo, updates) {
  const res = await api.put(`/inventory/${codigo}`, updates);
  return res.json();
}

export async function adjustStock(codigo, cantidadAjuste, motivo = '') {
  const res = await api.post(`/inventory/${codigo}/adjust`, { cantidad_ajuste: cantidadAjuste, motivo });
  return res.json();
}
