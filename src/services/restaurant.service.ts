import { apiClient } from "@/lib/axios";
import type { PlatformAnalytics, Restaurant, RestaurantStats, Subscription, User } from "@/types/restaurant.types";
import type { PaginatedResponse } from "@/types/api.types";

export const restaurantService = {
  // ── Restaurant admin — own restaurant ──────────────────────────────────────
  getMe: () => apiClient.get<Restaurant>("/restaurants/me").then((r) => r.data),
  updateMe: (data: Partial<Restaurant>) =>
    apiClient.patch<Restaurant>("/restaurants/me", data).then((r) => r.data),

  // ── Any authenticated user — own restaurant ────────────────────────────────
  getById: (id: number) =>
    apiClient.get<Restaurant>(`/restaurants/${id}`).then((r) => r.data),
  update: (id: number, data: Partial<Restaurant>) =>
    apiClient.patch<Restaurant>(`/restaurants/${id}`, data).then((r) => r.data),
  getSettings: (id: number) =>
    apiClient.get<Restaurant>(`/restaurants/${id}/settings`).then((r) => r.data),
  updateSettings: (id: number, data: Partial<Restaurant>) =>
    apiClient.patch<Restaurant>(`/restaurants/${id}/settings`, data).then((r) => r.data),
  getStats: (id: number) =>
    apiClient.get<RestaurantStats>(`/restaurants/${id}/stats`).then((r) => r.data),

  // ── Super admin — all restaurants ──────────────────────────────────────────
  listAll: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<Restaurant>>("/restaurants", { params }).then((r) => r.data),
  create: (data: object) =>
    apiClient.post<Restaurant>("/restaurants", data).then((r) => r.data),
  deactivate: (id: number) =>
    apiClient.delete(`/restaurants/${id}`).then((r) => r.data),
  activate: (id: number) =>
    apiClient.patch<Restaurant>(`/restaurants/${id}/activate`).then((r) => r.data),

  // ── Subscription management (super admin) ──────────────────────────────────
  updateSubscription: (
    id: number,
    data: { plan: string; status: string; expires_at?: string; notes?: string },
  ) => apiClient.post<Subscription>(`/restaurants/${id}/subscription`, data).then((r) => r.data),
  getSubscriptionHistory: (id: number) =>
    apiClient.get<Subscription[]>(`/restaurants/${id}/subscription/history`).then((r) => r.data),

  // ── Staff management via restaurant ────────────────────────────────────────
  getStaff: (id: number) =>
    apiClient.get<User[]>(`/restaurants/${id}/staff`).then((r) => r.data),
};

export const userService = {
  getMe: () => apiClient.get<User>("/users/me").then((r) => r.data),
  updateMe: (data: Partial<User>) =>
    apiClient.patch<User>("/users/me", data).then((r) => r.data),
  changePassword: (old_password: string, new_password: string, confirm_new_password: string) =>
    apiClient
      .post("/users/me/change-password", { old_password, new_password, confirm_new_password })
      .then((r) => r.data),
  list: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<User>>("/users", { params }).then((r) => r.data),
  create: (data: object) => apiClient.post<User>("/users", data).then((r) => r.data),
  update: (id: number, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id: number) => apiClient.delete(`/users/${id}`).then((r) => r.data),
  resetPassword: (id: number, new_password: string, confirm_password: string) =>
    apiClient
      .post(`/users/${id}/reset-password`, { new_password, confirm_password })
      .then((r) => r.data),
};

export interface DailyDataPoint {
  date: string;
  day: string;
  orders: number;
  revenue: number;
}

export interface RestaurantAnalytics {
  total_orders: number;
  today_orders: number;
  open_orders: number;
  total_revenue: number;
  today_revenue: number;
  staff_count: number;
  order_statuses: Record<string, number>;
  weekly_data: DailyDataPoint[];
}

export const analyticsService = {
  platform: () =>
    apiClient.get<PlatformAnalytics>("/analytics/platform").then((r) => r.data),
  restaurant: () =>
    apiClient.get<RestaurantAnalytics>("/analytics/restaurant").then((r) => r.data),
};
