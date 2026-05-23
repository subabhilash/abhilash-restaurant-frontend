"use client";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKitchenOrders, useKitchenHistory, useUpdateKitchenOrderStatus } from "@/hooks/use-kitchen";
import { KitchenHeader } from "@/components/layouts/kitchen-header";
import { formatElapsed } from "@/utils/helpers";
import { cn } from "@/utils/helpers";
import { onSocketEvent, type OrderCreatedPayload, type OrderStatusChangedPayload } from "@/lib/socket";
import type { KitchenOrder } from "@/types/kitchen.types";

const COLUMNS = [
  { status: "confirmed", label: "CONFIRMED",  header: "bg-sky-500",   accent: "border-sky-300",   badge: "bg-sky-500",   nextStatus: "preparing", action: "Start Prep",  confirm: false },
  { status: "preparing", label: "PREPARING",  header: "bg-blue-500",  accent: "border-blue-300",  badge: "bg-blue-500",  nextStatus: "ready",     action: "Mark Ready",  confirm: false },
  { status: "ready",     label: "READY ✓",   header: "bg-green-500", accent: "border-green-300", badge: "bg-green-500", nextStatus: "served",    action: "Served",      confirm: true  },
];

function elapsedColor(seconds: number) {
  if (seconds < 600) return "text-green-400";
  if (seconds < 1200) return "text-yellow-400";
  return "text-red-400 animate-pulse";
}

function OrderCard({
  order, nextStatus, actionLabel, accentColor, badgeColor, requireConfirm, onAdvance,
}: {
  order: KitchenOrder; nextStatus: string; actionLabel: string;
  accentColor: string; badgeColor: string; requireConfirm: boolean;
  onAdvance: (id: number, status: string, orderNumber: string) => void;
}) {
  const [secs, setSecs] = useState(order.elapsed_seconds);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (confirming) { confirmTimer.current = setTimeout(() => setConfirming(false), 4000); }
    return () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); };
  }, [confirming]);

  function handleClick() {
    if (!requireConfirm) { onAdvance(order.id, nextStatus, order.order_number); return; }
    if (!confirming) { setConfirming(true); return; }
    setConfirming(false);
    onAdvance(order.id, nextStatus, order.order_number);
  }

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 animate-slide-in shadow-sm bg-white text-gray-900", accentColor)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-black text-gray-900">#{order.order_number}</p>
          {order.table_number && <p className="text-sm font-semibold text-gray-500">Table {order.table_number}</p>}
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-bold tabular-nums", elapsedColor(secs))}>{formatElapsed(secs)}</p>
          <p className="text-xs text-gray-400 capitalize">{order.order_type.replace("_", " ")}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {order.items.length === 0 ? (
          <li className="text-xs text-gray-400 italic">No items</li>
        ) : order.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold mt-0.5", badgeColor)}>{item.quantity}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 leading-snug">{item.menu_item_name}</p>
              {item.special_instructions && (
                <p className="mt-0.5 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">⚠ {item.special_instructions}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {order.special_instructions && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800 font-medium">
          Order note: {order.special_instructions}
        </div>
      )}
      <button
        onClick={handleClick}
        className={cn(
          "w-full rounded-lg py-2.5 font-bold text-sm transition-all active:scale-95",
          confirming ? "bg-red-600 text-white animate-pulse ring-2 ring-red-400 ring-offset-1" : cn("text-white hover:opacity-90", badgeColor),
        )}
      >
        {confirming ? "⚠ Tap again to confirm Served" : `${actionLabel} →`}
      </button>
    </div>
  );
}

export default function KitchenDashboardPage() {
  const [showHistory, setShowHistory] = useState(false);
  const qc = useQueryClient();
  const { data: ordersData, dataUpdatedAt } = useKitchenOrders();
  const { data: historyData } = useKitchenHistory();
  const updateStatus = useUpdateKitchenOrderStatus();

  // ── Real-time: invalidate queries on any order event ─────────────────────
  useEffect(() => {
    const offCreated = onSocketEvent<OrderCreatedPayload>("order.created", (data) => {
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      toast.info(`New order #${data.order_number} received`, { duration: 4000 });
    });
    const offChanged = onSocketEvent<OrderStatusChangedPayload>("order.status_changed", () => {
      qc.invalidateQueries({ queryKey: ["kitchen"] });
    });
    return () => { offCreated(); offChanged(); };
  }, [qc]);

  const orders = ordersData?.results ?? [];
  const history = historyData?.results ?? [];
  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  function advance(id: number, status: string, orderNumber: string) {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        if (status === "ready") {
          toast.success(`Order #${orderNumber} marked as Ready`, {
            duration: 5000,
            action: { label: "↩ Undo", onClick: () => updateStatus.mutate({ id, status: "preparing" }, { onSuccess: () => toast.info(`Order #${orderNumber} back to Preparing`) }) },
          });
        }
        if (status === "served") {
          toast.success(`Order #${orderNumber} served ✓`, {
            duration: 6000,
            action: { label: "↩ Undo", onClick: () => updateStatus.mutate({ id, status: "ready" }, { onSuccess: () => toast.info(`Order #${orderNumber} moved back to Ready`) }) },
          });
        }
      },
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden select-none">
      <KitchenHeader lastUpdate={lastUpdate} onHistoryToggle={() => setShowHistory((v) => !v)} showingHistory={showHistory} historyCount={history.length} />
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          <h2 className="text-lg font-bold mb-4 text-gray-200">Today&apos;s History</h2>
          {history.length === 0 ? <p className="text-gray-500 text-sm">No completed orders yet</p> : history.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3 border border-gray-700">
              <div><span className="font-bold">#{o.order_number}</span>{o.table_number && <span className="ml-2 text-sm text-gray-400">Table {o.table_number}</span>}</div>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", o.status === "served" || o.status === "completed" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300")}>{o.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 overflow-hidden">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex flex-col border-r border-gray-700 last:border-0 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold", col.header)}>{colOrders.length}</span>
                  <span className="font-bold tracking-widest text-xs text-gray-200">{col.label}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.length === 0 ? <p className="text-center text-gray-500 text-sm mt-12">No orders</p>
                    : colOrders.map((o) => (
                      <OrderCard key={o.id} order={o} nextStatus={col.nextStatus} actionLabel={col.action} accentColor={col.accent} badgeColor={col.badge} requireConfirm={col.confirm} onAdvance={advance} />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
