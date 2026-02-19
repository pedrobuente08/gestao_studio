'use client';

import { create } from 'zustand';
import { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const { isAuthenticated } = useAuthStore.getState();
      
      if (token && !isAuthenticated) {
        set({ token, isLoading: true });
      } else if (!token) {
        set({ isLoading: false });
      } else {
        // Já possui token e está autenticado (ex: navegação pós-login)
        set({ isLoading: false });
      }
    }
  },
}));
