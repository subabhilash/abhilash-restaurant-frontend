import { apiClient } from "@/lib/axios";
import type { Order, OrderListItem, Table, TableQRCode } from "@/types/order.types";
import type { PaginatedResponse } from "@/types/api.types";

export const orderService = {
  list: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<OrderListItem>>("/orders", { params }).then((r) => r.data),
  getById: (id: number) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (data: object) => apiClient.post<Order>("/orders", data).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
  updatePayment: (id: number, payment_status: string) =>
    apiClient.patch<Order>(`/orders/${id}/payment`, { payment_status }).then((r) => r.data),

  listTables: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<Table>>("/orders/tables", { params }).then((r) => r.data),
  createTable: (data: object) =>
    apiClient.post<Table>("/orders/tables", data).then((r) => r.data),
  updateTable: (id: number, data: object) =>
    apiClient.patch<Table>(`/orders/tables/${id}`, data).then((r) => r.data),
  deactivateTable: (id: number) =>
    apiClient.delete(`/orders/tables/${id}`).then((r) => r.data),
  rotateQR: (id: number) =>
    apiClient.post<Table>(`/orders/tables/${id}/rotate-qr`).then((r) => r.data),
  listQRCodes: (tableId: number) =>
    apiClient.get<TableQRCode[]>(`/orders/tables/${tableId}/qr-codes`).then((r) => r.data),
  createQRCode: (tableId: number) =>
    apiClient.post<TableQRCode>(`/orders/tables/${tableId}/qr-codes`).then((r) => r.data),
  rotateQRCode: (qrId: string) =>
    apiClient.patch<TableQRCode>(`/orders/qr-codes/${qrId}/rotate`).then((r) => r.data),
  disableQRCode: (qrId: string) =>
    apiClient.patch<TableQRCode>(`/orders/qr-codes/${qrId}/disable`).then((r) => r.data),

  publicCreate: (slug: string, qrToken: string, data: object) =>
    apiClient.post(`/orders/public/${slug}/${qrToken}`, data).then((r) => r.data),
  publicTrack: (orderId: number) =>
    apiClient.get(`/orders/public/track/${orderId}`).then((r) => r.data),
};
