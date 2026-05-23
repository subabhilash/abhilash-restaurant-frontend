"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kitchenService } from "@/services/kitchen.service";

export const kitchenKeys = {
  orders: (p?: Record<string, string>) => ["kitchen", "orders", p] as const,
  history: () => ["kitchen", "history"] as const,
  tickets: (p?: Record<string, string>) => ["kitchen", "tickets", p] as const,
  stations: () => ["kitchen", "stations"] as const,
};

export function useKitchenOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: kitchenKeys.orders(params),
    queryFn: () => kitchenService.listOrders(params),
    // 60s fallback — Socket.IO handles live updates, polling is backup only
    refetchInterval: 60000,
    staleTime: 10000,
  });
}
export function useKitchenHistory() {
  return useQuery({
    queryKey: kitchenKeys.history(),
    queryFn: () => kitchenService.orderHistory(),
    staleTime: 30000,
  });
}
export function useUpdateKitchenOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      kitchenService.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen"] }),
  });
}
export function useKitchenTickets(params?: Record<string, string>) {
  return useQuery({
    queryKey: kitchenKeys.tickets(params),
    queryFn: () => kitchenService.listTickets(params),
    refetchInterval: 60000,
    staleTime: 10000,
  });
}
export function useUpdateKitchenTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      kitchenService.updateTicket(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen"] }),
  });
}
export function useKitchenStations() {
  return useQuery({
    queryKey: kitchenKeys.stations(),
    queryFn: kitchenService.listStations,
    staleTime: 60000, // stations rarely change
  });
}
export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => kitchenService.createStation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: kitchenKeys.stations() }),
  });
}
export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      kitchenService.updateStation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: kitchenKeys.stations() }),
  });
}
export function useDeleteStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => kitchenService.deleteStation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: kitchenKeys.stations() }),
  });
}
