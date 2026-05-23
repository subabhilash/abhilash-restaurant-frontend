import { apiClient } from "@/lib/axios";
import type { LoginResponse, RegisterResponse } from "@/types/auth.types";

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (payload: {
    email: string;
    full_name: string;
    phone?: string;
    password: string;
    confirm_password: string;
    restaurant_name: string;
  }) => apiClient.post<RegisterResponse>("/auth/register", payload).then((r) => r.data),

  logout: (refresh: string) =>
    apiClient.post("/auth/logout", { refresh }).then((r) => r.data),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string; refresh: string }>("/auth/refresh", { refresh }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string, confirm_new_password: string) =>
    apiClient.post("/auth/reset-password", { token, new_password, confirm_new_password }).then((r) => r.data),
};
