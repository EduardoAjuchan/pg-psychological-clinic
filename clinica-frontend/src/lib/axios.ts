import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth:token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth:token');
      localStorage.removeItem('auth:permissions');
      localStorage.removeItem('auth:user');
      document.cookie = 'auth=; Max-Age=0; path=/';
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);
export default api;
