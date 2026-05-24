"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import api from "@/lib/api";
import type { AuthResponse, User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (email: string, username: string, password: string, full_name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      register: async (email, username, password, full_name) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>("/auth/register", {
            email, username, password, full_name,
          });
          localStorage.setItem("access_token", data.access_token);
          document.cookie = `access_token=${data.access_token}; path=/; SameSite=Strict`;
          set({ user: data.user, token: data.access_token });
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams({ username: email, password });
          const { data } = await api.post<AuthResponse>("/auth/login", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
          localStorage.setItem("access_token", data.access_token);
          document.cookie = `access_token=${data.access_token}; path=/; SameSite=Strict`;
          set({ user: data.user, token: data.access_token });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        document.cookie = "access_token=; path=/; max-age=0";
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        const { data } = await api.get<User>("/auth/me");
        set({ user: data });
      },
    }),
    { name: "auth", partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
