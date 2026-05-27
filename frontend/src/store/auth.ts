"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import api from "@/lib/api";
import type { AuthResponse, User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  requestOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      requestOTP: async (email) => {
        set({ isLoading: true });
        try {
          await api.post("/auth/request-otp", { email });
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, code) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>("/auth/verify-otp", { email, code });
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
