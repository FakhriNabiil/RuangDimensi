import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('vertex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 Unauthorized and 403 Forbidden globally.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('vertex:unauthorized'));
    } else if (status === 403) {
      const message =
        error?.response?.data?.error?.message || 'Kamu bukan pemilik aset ini.';
      window.dispatchEvent(new CustomEvent('vertex:forbidden', { detail: { message } }));
    }
    return Promise.reject(error);
  },
);

// Utility to extract a user-friendly error message from an Axios error object.
export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
}

export default axiosInstance;
