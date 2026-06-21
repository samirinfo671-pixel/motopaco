import axios from 'axios';
import { useAuthStore } from '../store/auth.ts';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Inject Access Token to request headers
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept expired responses to perform refresh token routine
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = useAuthStore.getState().refreshToken;
        if (!refresh) throw new Error('Pas de refresh token.');

        const res = await axios.post('/api/auth/refresh', { refreshToken: refresh });
        const { accessToken, refreshToken } = res.data;

        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setAuth(accessToken, refreshToken, user);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
