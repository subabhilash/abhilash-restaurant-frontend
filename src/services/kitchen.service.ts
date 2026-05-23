import { apiClient } from "@/lib/axios";
import type { KitchenOrder, KitchenTicket, KitchenStation } from "@/types/kitchen.types";
import type { PaginatedResponse } from "@/types/api.types";

export const kitchenService = {
  // ── Orders ──────────────────────────────────────────────────────────────────
  listOrders: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<KitchenOrder>>("/kitchen/orders", { params }).then((r) => r.data),
  getOrder: (id: number) =>
    apiClient.get<KitchenOrder>(`/kitchen/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id: number, status: string) =>
    apiClient.patch<KitchenOrder>(`/kitchen/orders/${id}/status`, { status }).then((r) => r.data),
  orderHistory: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<KitchenOrder>>("/kitchen/orders/history", { params }).then((r) => r.data),

  // ── Tickets ──────────────────────────────────────────────────────────────────
  listTickets: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<KitchenTicket>>("/kitchen/tickets", { params }).then((r) => r.data),
  updateTicket: (id: number, data: object) =>
    apiClient.patch<KitchenTicket>(`/kitchen/tickets/${id}`, data).then((r) => r.data),

  // ── Stations (real CRUD) ──────────────────────────────────────────────────────
  listStations: () =>
    apiClient.get<PaginatedResponse<KitchenStation>>("/kitchen/stations").then((r) => r.data),
  createStation: (data: object) =>
    apiClient.post<KitchenStation>("/kitchen/stations", data).then((r) => r.data),
  updateStation: (id: number, data: object) =>
    apiClient.patch<KitchenStation>(`/kitchen/stations/${id}`, data).then((r) => r.data),
  deleteStation: (id: number) =>
    apiClient.delete(`/kitchen/stations/${id}`).then((r) => r.data),
};
