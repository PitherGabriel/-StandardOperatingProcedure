import { useState } from 'react';

export function useCart(inventory) {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    if (product.cantidad === 0) {
      alert('¡Producto sin stock!');
      return;
    }
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.cantidadVendida >= product.cantidad) {
        alert('¡No hay suficiente stock!');
        return;
      }
      setCart(c => c.map(i =>
        i.id === product.id
          ? { ...i, cantidadVendida: i.cantidadVendida + 1 }
          : i
      ));
    } else {
      setCart(c => [...c, {
        ...product,
        cantidadVendida: 1,
        priceType: 'precio',
        precioActual: product.precio,
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
      alert('¡No hay suficiente stock!');
      setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: product.cantidad } : i));
      return;
    }
    setCart(c => c.map(i => i.id === productId ? { ...i, cantidadVendida: quantity } : i));
  };

  const changePriceType = (productId, newPriceType) => {
    setCart(c => c.map(i =>
      i.id === productId
        ? { ...i, priceType: newPriceType, precioActual: i[newPriceType] }
        : i
    ));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (sum, item) => sum + (item.precioActual ?? item.precio) * item.cantidadVendida,
    0
  );

  return { cart, setCart, addToCart, removeFromCart, setCartQuantity, changePriceType, clearCart, total };
}
