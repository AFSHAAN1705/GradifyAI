"use client";

import { create } from "zustand";
import { fetchCurrentUser, clearAuthToken, setAuthToken, type User } from "@/lib/auth";

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user
    }),
  setLoading: (isLoading) => set({ isLoading }),
  login: (token, user) => {
    setAuthToken(token);
    set({
      user,
      isAuthenticated: true
    });
  },
  logout: () => {
    clearAuthToken();
    set({
      user: null,
      isAuthenticated: false
    });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await fetchCurrentUser();
      set({
        user,
        isAuthenticated: !!user
      });
    } catch {
      clearAuthToken();
      set({
        user: null,
        isAuthenticated: false
      });
    } finally {
      set({ isLoading: false });
    }
  }
}));
