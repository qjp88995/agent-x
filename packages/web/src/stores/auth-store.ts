import type { AuthResponse } from '@agent-x/shared';
import { AxiosError } from 'axios';
import { create } from 'zustand';

import { api } from '@/lib/api';

type AuthUser = AuthResponse['user'];

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

function storeTokens(response: AuthResponse): void {
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
  }
  return 'An unexpected error occurred';
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      storeTokens(data);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  register: async (email: string, password: string, name?: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      });
      storeTokens(data);
      set({ user: data.user, isAuthenticated: true });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
