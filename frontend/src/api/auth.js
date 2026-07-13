import axiosInstance from './axiosInstance';

export async function loginRequest({ username, password }) {
  const res = await axiosInstance.post('/api/login', { username, password });
  return res.data.data; // { token, username }
}

export async function registerRequest({ username, email, password }) {
  const res = await axiosInstance.post('/api/register', { username, email, password });
  return res.data.data;
}
