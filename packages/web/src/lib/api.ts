import type { AuthResponse } from '@agent-x/shared';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<AuthResponse> | null = null;

function clearTokensAndRedirect(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearTokensAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post<AuthResponse>('/api/auth/refresh', { refreshToken })
          .then(res => res.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const data = await refreshPromise;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch {
      clearTokensAndRedirect();
      return Promise.reject(error);
    }
  }
);
