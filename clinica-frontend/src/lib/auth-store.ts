'use client';
import { create } from 'zustand';
type AuthState = { token: string | null; setToken: (t: string | null) => void; logout: () => void; };
export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setToken: (t) => {
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
      document.cookie = t ? 'auth=1; path=/' : 'auth=; Max-Age=0; path=/';
    }
    set({ token: t });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'auth=; Max-Age=0; path=/';
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => { window.history.go(1); };
    }
    set({ token: null });
  },
}));
