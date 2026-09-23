import { apiClient } from "@/lib/axios";

export const waiterService = {
  listCalls: (params?: Record<string, string>) =>
    apiClient.get("/waiter/calls", { params }).then((r) => r.data),
  updateCall: (id: number, data: object) =>
    apiClient.patch(`/waiter/calls/${id}`, data).then((r) => r.data),
  publicCall: (slug: string, qrToken: string, data: { reason?: string; notes?: string } = {}) =>
    apiClient.post(`/waiter/public/${slug}/calls`, { qr_token: qrToken, ...data }).then((r) => r.data),
};
