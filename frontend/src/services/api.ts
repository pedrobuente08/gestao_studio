import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros 401 (sessão inválida ou expirada)
// Não redireciona se já estiver em página de auth para evitar loop infinito
const authPaths = ['/login', '/register', '/verify-email', '/reset-password', '/oauth-callback', '/complete-registration'];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthPage = authPaths.some(path => window.location.pathname.startsWith(path));
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
