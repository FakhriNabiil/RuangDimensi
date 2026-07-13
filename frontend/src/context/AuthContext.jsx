import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, registerRequest } from '../api/auth';
import { getApiErrorMessage } from '../api/axiosInstance';
import { isTokenExpired } from '../utils/jwt';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const TOKEN_KEY = 'vertex_token';
const USERNAME_KEY = 'vertex_username';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [isReady, setIsReady] = useState(false); // becomes true once we've checked localStorage
  const navigate = useNavigate();
  const toast = useToast();

  // Restore session on mount, but only trust a token that hasn't expired.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUsername = localStorage.getItem(USERNAME_KEY);

    if (storedToken && storedUsername && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUsername(storedUsername);
    } else if (storedToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
    setIsReady(true);
  }, []);

  const logout = useMemo(
    () => (message) => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
      setToken(null);
      setUsername(null);
      if (message) toast.info(message);
      navigate('/login');
    },
    [navigate, toast],
  );

  // Global reaction to axios interceptor events (see api/axiosInstance.js).
  useEffect(() => {
    const onUnauthorized = () => logout('Sesi kamu berakhir. Silakan login kembali.');
    const onForbidden = (e) => toast.error(e.detail?.message || 'Akses ditolak.');

    window.addEventListener('vertex:unauthorized', onUnauthorized);
    window.addEventListener('vertex:forbidden', onForbidden);
    return () => {
      window.removeEventListener('vertex:unauthorized', onUnauthorized);
      window.removeEventListener('vertex:forbidden', onForbidden);
    };
  }, [logout, toast]);

  async function login(username, password) {
    try {
      const data = await loginRequest({ username, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USERNAME_KEY, data.username ?? username);
      setToken(data.token);
      setUsername(data.username ?? username);
      return { success: true };
    } catch (error) {
      return { success: false, message: getApiErrorMessage(error, 'Login gagal. Periksa kembali kredensial kamu.') };
    }
  }

  async function register(fields) {
    try {
      await registerRequest(fields);
      return { success: true };
    } catch (error) {
      return { success: false, message: getApiErrorMessage(error, 'Registrasi gagal. Coba lagi.') };
    }
  }

  const value = {
    token,
    username,
    isLoggedIn: Boolean(token),
    isReady,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
