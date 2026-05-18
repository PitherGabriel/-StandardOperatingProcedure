import { useState } from 'react';

const round2 = v => Math.round(v * 100) / 100;

export function useCart(inventory, onError) {
  const [cart, setCart] = useState([]);

  const notify = (msg) => onError ? onError(msg, 'error') : console.warn(msg);

  const addToCart = (product) => {
    if (product.cantidad === 0) {
      notify('¡Producto sin stock!');
      return;
    }
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.cantidadVendida >= product.cantidad) {
        notify('¡No hay suficiente stock!');
        return;
      }
      setCart(c => c.map(i =>
        i.id === product.id
          ? { ...i, cantidadVendida: i.cantidadVendida + 1 }
          : i
      ));
    } else {
      const descuento = product.descuento || 0;
      setCart(c => [...c, {
        ...product,
        cantidadVendida: 1,
        priceType: 'precio',
        precioActual: descuento > 0 ? round2(product.precio * (1 - descuento / 100)) : product.precio,
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(c => c.filter(i => i.id !== productId));
  };

  const setCartQuantity = (productId, newQuantity) => {
    const product = inventory.find(p => p.id === productId);
    if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
      setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: 0 } : i));
      return;
    }
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: 0 } : i));
      return;
    }
    if (quantity > product.cantidad) {
      notify('¡No hay suficiente stock!');
      setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: product.cantidad } : i));
      return;
    }
    setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: quantity } : i));
  };

  const changePriceType = (productId, newPriceType) => {
    setCart(c => c.map(i => {
      if (i.id !== productId) return i;
      const basePrice = i[newPriceType];
      const descuento = i.descuento || 0;
      const precioActual = descuento > 0 ? round2(basePrice * (1 - descuento / 100)) : basePrice;
      return { ...i, priceType: newPriceType, precioActual };
    }));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (sum, item) => sum + (item.precioActual ?? item.precio) * item.cantidadVendida,
    0
  );

  return { cart, setCart, addToCart, removeFromCart, setCartQuantity, changePriceType, clearCart, total };
}
