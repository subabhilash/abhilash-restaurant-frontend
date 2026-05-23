"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, ChefHat, CheckCircle2, UtensilsCrossed, XCircle, Loader2 } from "lucide-react";
import { useTrackOrder } from "@/hooks/use-orders";
import { formatCurrency } from "@/utils/helpers";
import { cn } from "@/utils/helpers";
import { joinOrderRoom, onSocketEvent, type OrderStatusChangedPayload } from "@/lib/socket";
import type { PublicOrderTrackResponse } from "@/types/order.types";

const STEPS = [
  { status: "pending",   label: "Order Placed", icon: Clock,          desc: "Your order has been received" },
  { status: "confirmed", label: "Confirmed",    icon: CheckCircle2,   desc: "Restaurant accepted your order" },
  { status: "preparing", label: "Preparing",    icon: ChefHat,        desc: "Kitchen is working on it" },
  { status: "ready",     label: "Ready!",       icon: CheckCircle2,   desc: "Your order is ready" },
  { status: "served",    label: "Served",       icon: UtensilsCrossed,desc: "Enjoy your meal!" },
];

const STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "served", "cancelled"];

export type { PublicOrderTrackResponse };

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const parsedId = parseInt(orderId);
  const qc = useQueryClient();
  const { data, isLoading } = useTrackOrder(parsedId);

  // ── Subscribe to real-time updates for this specific order ────────────────
  useEffect(() => {
    if (!parsedId) return;

    // Join the order-specific room so the server sends us targeted events
    joinOrderRoom(parsedId);

    const off = onSocketEvent<OrderStatusChangedPayload>("order.status_changed", (payload) => {
      if (payload.order_id === parsedId) {
        qc.invalidateQueries({ queryKey: ["track", parsedId] });
      }
    });

    return off;
  }, [parsedId, qc]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!data) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Order not found</p>
    </div>
  );

  const order = data as PublicOrderTrackResponse;
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isTerminal = ["completed", "served", "cancelled"].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-bold text-xl mb-3">R</div>
          <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
          <p className="text-muted-foreground">Total: {formatCurrency(order.total_amount)}</p>
        </div>

        {isCancelled ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="font-bold text-red-800">Order Cancelled</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm border p-6">
            <div className="space-y-6">
              {STEPS.map(({ status, label, icon: Icon, desc }, idx) => {
                const done = STATUS_ORDER.indexOf(status) <= currentIdx;
                const active = status === order.status;
                return (
                  <div key={status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        done ? "border-primary bg-primary text-white" : "border-gray-200 bg-gray-50 text-gray-300",
                        active && "ring-4 ring-primary/20",
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={cn("mt-1 w-0.5 h-8", done && !active ? "bg-primary" : "bg-gray-200")} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={cn("font-semibold", done ? "text-gray-900" : "text-gray-400")}>{label}</p>
                      <p className={cn("text-sm", done ? "text-muted-foreground" : "text-gray-300")}>{desc}</p>
                      {active && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs text-primary font-medium">In progress</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {isTerminal ? "Order complete" : "Live updates via WebSocket · Status: "}
          {!isTerminal && <span className="font-medium capitalize">{order.status}</span>}
        </p>
      </div>
    </div>
  );
}
