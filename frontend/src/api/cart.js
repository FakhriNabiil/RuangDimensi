import axiosInstance from './axiosInstance';

export async function getCart() {
  const res = await axiosInstance.get('/api/cart');
  return res.data.data;
}

export async function addToCart(assetId) {
  const res = await axiosInstance.post(`/api/cart/${assetId}`);
  return res.data.data;
}

export async function removeFromCart(assetId) {
  const res = await axiosInstance.delete(`/api/cart/${assetId}`);
  return res.data.data;
}

export async function clearCart() {
  const res = await axiosInstance.delete('/api/cart');
  return res.data.data;
}

export async function checkout() {
  const res = await axiosInstance.post('/api/cart/checkout');
  return res.data.data;
}
