import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const userId = 1; // Después se puede tomar del login

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCart(userId);
      setCart({ items: data.items || [], total: data.total || 0 });
    } catch (e) {
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    await api.addToCart(userId, productId, quantity);
    await refreshCart();
  }, [userId, refreshCart]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    await api.updateCartItem(userId, cartItemId, quantity);
    await refreshCart();
  }, [userId, refreshCart]);

  const removeItem = useCallback(async (cartItemId) => {
    await api.removeCartItem(userId, cartItemId);
    await refreshCart();
  }, [userId, refreshCart]);

  const createOrder = useCallback(async (orderData) => {
    const result = await api.createOrder(userId, orderData);
    await refreshCart();
    return result;
  }, [userId, refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        createOrder,
        userId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
