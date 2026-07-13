import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as cartApi from '../api/cart';
import { getApiErrorMessage } from '../api/axiosInstance';
import { normalizeAssetList } from '../utils/normalizeAsset';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn, isReady } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [totalHargaJuta, setTotalHargaJuta] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | ready

  const applyCartPayload = useCallback((data) => {
    setItems(normalizeAssetList(data.items));
    setTotalHargaJuta(data.totalHargaJuta ?? 0);
  }, []);

  const refetch = useCallback(async () => {
    if (!isLoggedIn) return;
    setStatus('loading');
    try {
      const data = await cartApi.getCart();
      applyCartPayload(data);
      setStatus('ready');
    } catch (error) {
      setStatus('ready');
      toast.error(getApiErrorMessage(error, 'Gagal memuat keranjang.'));
    }
  }, [isLoggedIn, applyCartPayload, toast]);

  // Load the cart once auth state is known, and clear it on logout so the
  // badge doesn't keep showing a stale count for the next user.
  useEffect(() => {
    if (!isReady) return;
    if (isLoggedIn) {
      refetch();
    } else {
      setItems([]);
      setTotalHargaJuta(0);
      setStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isLoggedIn]);

  const isInCart = useCallback(
    (assetId) => items.some((item) => item.id === assetId),
    [items],
  );

  async function addItem(assetId) {
    try {
      const data = await cartApi.addToCart(assetId);
      applyCartPayload(data);
      toast.success('Ditambahkan ke keranjang.');
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Gagal menambahkan ke keranjang.');
      toast.error(message);
      return { success: false, message };
    }
  }

  async function removeItem(assetId) {
    try {
      const data = await cartApi.removeFromCart(assetId);
      applyCartPayload(data);
      return { success: true };
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus dari keranjang.'));
      return { success: false };
    }
  }

  async function clear() {
    try {
      const data = await cartApi.clearCart();
      applyCartPayload(data);
      return { success: true };
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengosongkan keranjang.'));
      return { success: false };
    }
  }

  async function checkout() {
    try {
      const order = await cartApi.checkout();
      setItems([]);
      setTotalHargaJuta(0);
      return { success: true, order };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Checkout gagal. Coba lagi.');
      toast.error(message);
      return { success: false, message };
    }
  }

  const value = {
    items,
    itemCount: items.length,
    totalHargaJuta,
    status,
    isInCart,
    addItem,
    removeItem,
    clear,
    checkout,
    refetch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
