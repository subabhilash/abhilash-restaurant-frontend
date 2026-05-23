"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantService, userService, analyticsService } from "@/services/restaurant.service";
import type { Restaurant, User } from "@/types/restaurant.types";
import { useAuthStore } from "@/store/auth.store";

export const restaurantKeys = {
  me: () => ["restaurant", "me"] as const,
  all: (p?: Record<string, string>) => ["restaurants", "all", p] as const,
  detail: (id: number) => ["restaurants", "detail", id] as const,
  settings: (id: number) => ["restaurant", "settings", id] as const,
  stats: (id: number) => ["restaurant", "stats", id] as const,
  staff: (id: number) => ["restaurants", "staff", id] as const,
  subscription: (id: number) => ["restaurants", "subscription", id] as const,
  users: (p?: Record<string, string>) => ["users", p] as const,
  analytics: {
    platform: () => ["analytics", "platform"] as const,
    restaurant: () => ["analytics", "restaurant"] as const,
  },
};

// ── My Restaurant ─────────────────────────────────────────────────────────────

export function useMyRestaurant() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: restaurantKeys.me(),
    queryFn: restaurantService.getMe,
    enabled: !!user && user.role !== "super_admin",
    retry: false,
  });
}
export function useUpdateMyRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => restaurantService.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: restaurantKeys.me() }),
  });
}

// ── Super admin — all restaurants ─────────────────────────────────────────────

export function useAllRestaurants(params?: Record<string, string>) {
  return useQuery({
    queryKey: restaurantKeys.all(params),
    queryFn: () => restaurantService.listAll(params),
  });
}
export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => restaurantService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurants"] }),
  });
}
export function useDeactivateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => restaurantService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurants"] }),
  });
}
export function useActivateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => restaurantService.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurants"] }),
  });
}

// ── Single restaurant ─────────────────────────────────────────────────────────

export function useRestaurant(id: number) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => restaurantService.getById(id),
    enabled: !!id,
  });
}
export function useUpdateRestaurant(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => restaurantService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: restaurantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}
export function useRestaurantStats(id: number) {
  return useQuery({
    queryKey: restaurantKeys.stats(id),
    queryFn: () => restaurantService.getStats(id),
    enabled: !!id,
    refetchInterval: 30000,
  });
}
export function useRestaurantSettings(id: number) {
  return useQuery({
    queryKey: restaurantKeys.settings(id),
    queryFn: () => restaurantService.getSettings(id),
    enabled: !!id,
  });
}
export function useUpdateRestaurantSettings(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) => restaurantService.updateSettings(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: restaurantKeys.settings(id) }),
  });
}

// ── Subscription ──────────────────────────────────────────────────────────────

export function useUpdateSubscription(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { plan: string; status: string; expires_at?: string; notes?: string }) =>
      restaurantService.updateSubscription(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: restaurantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}
export function useSubscriptionHistory(id: number) {
  return useQuery({
    queryKey: restaurantKeys.subscription(id),
    queryFn: () => restaurantService.getSubscriptionHistory(id),
    enabled: !!id,
  });
}

// ── Restaurant staff (super admin view) ───────────────────────────────────────

export const restaurantUserKeys = {
  list: (restaurantId: number) => ["users", "restaurant", restaurantId] as const,
};
export function useRestaurantUsers(restaurantId: number) {
  return useQuery({
    queryKey: restaurantUserKeys.list(restaurantId),
    queryFn: () => restaurantService.getStaff(restaurantId),
    enabled: !!restaurantId,
  });
}
export function useUpdateRestaurantUser(restaurantId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => userService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: restaurantUserKeys.list(restaurantId) }),
  });
}
export function useDeactivateRestaurantUser(restaurantId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: restaurantUserKeys.list(restaurantId) }),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: restaurantKeys.analytics.platform(),
    queryFn: analyticsService.platform,
    refetchInterval: 60000,
  });
}
export function useRestaurantAnalytics() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: restaurantKeys.analytics.restaurant(),
    queryFn: analyticsService.restaurant,
    enabled: !!user && user.role !== "super_admin",
    refetchInterval: 30000,
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({ queryKey: ["users", "me"], queryFn: userService.getMe });
}
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => userService.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
  });
}
export function useUsers(params?: Record<string, string>) {
  return useQuery({ queryKey: restaurantKeys.users(params), queryFn: () => userService.list(params) });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => userService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => userService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ old_password, new_password, confirm_new_password }: Record<string, string>) =>
      userService.changePassword(old_password, new_password, confirm_new_password),
  });
}
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, new_password, confirm_password }: { id: number; new_password: string; confirm_password: string }) =>
      userService.resetPassword(id, new_password, confirm_password),
  });
}
