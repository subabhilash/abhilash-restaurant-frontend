"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";

export const orderKeys = {
  list: (p?: Record<string, string>) => ["orders", "list", p] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
  tables: (p?: Record<string, string>) => ["tables", p] as const,
  track: (id: number) => ["track", id] as const,
};

export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.list(params),
    // 60s fallback poll — Socket.IO invalidations handle live updates.
    // Reduces API load significantly vs previous 15s.
    refetchInterval: 60000,
    staleTime: 10000,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: !!id,
    staleTime: 5000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => orderService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      orderService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_status }: { id: number; payment_status: string }) =>
      orderService.updatePayment(id, payment_status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}

export function useTables(params?: Record<string, string>) {
  return useQuery({
    queryKey: orderKeys.tables(params),
    queryFn: () => orderService.listTables(params),
    staleTime: 30000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => orderService.createTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useRotateQR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orderService.rotateQR,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useDeactivateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orderService.deactivateTable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useTrackOrder(orderId: number) {
  return useQuery({
    queryKey: orderKeys.track(orderId),
    queryFn: () => orderService.publicTrack(orderId),
    enabled: !!orderId,
    // Socket.IO handles live; poll every 30s as fallback (was 10s)
    refetchInterval: 30000,
    staleTime: 5000,
  });
}
