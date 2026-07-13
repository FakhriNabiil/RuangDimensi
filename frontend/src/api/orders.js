import axiosInstance from './axiosInstance';

export async function listMyOrders() {
  const res = await axiosInstance.get('/api/orders');
  return res.data.data;
}

export async function getOrder(orderId) {
  const res = await axiosInstance.get(`/api/orders/${orderId}`);
  return res.data.data;
}
