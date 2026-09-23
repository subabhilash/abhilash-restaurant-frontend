import { apiClient } from "@/lib/axios";

export const billingService = {
  createBill: (order_id: number) =>
    apiClient.post("/billing", { order_id }).then((r) => r.data),
  addPayment: (billId: number, data: { amount: number; payment_method_id?: number; reference?: string; notes?: string }) =>
    apiClient.post(`/billing/${billId}/payments`, data).then((r) => r.data),
};
