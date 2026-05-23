"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, LoginResponse } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { syncAuthCookie } from "@/lib/axios";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setSession: (data: LoginResponse) => void;
  clearSession: () => void;
}

function clearCookie(name: string) {
  if (typeof document !== "undefined")
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setSession(data) {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          syncAuthCookie(data.access);
          connectSocket(data.access);
        }
        set({
          user: data.user,
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
        });
      },

      clearSession() {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        clearCookie("access_token");
        disconnectSocket();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      async login(email, password) {
        const data = await authService.login(email, password);
        get().setSession(data);
        return data;
      },

      async logout() {
        const refresh = get().refreshToken;
        if (refresh) {
          try {
            await authService.logout(refresh);
          } catch { /* expired token — ignore */ }
        }
        get().clearSession();
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) syncAuthCookie(state.accessToken);
      },
    },
  ),
);
