"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table2, ShoppingCart, CheckCircle2, Clock, LogOut,
  Plus, RefreshCw, AlertCircle,
} from "lucide-react";
import { useOrders, useUpdateOrderStatus, useTables } from "@/hooks/use-orders";
import { waiterService } from "@/services/waiter.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, timeAgo } from "@/utils/helpers";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/utils/constants";
import { onSocketEvent, type OrderCreatedPayload, type OrderStatusChangedPayload } from "@/lib/socket";
import type { OrderListItem } from "@/types/order.types";
import type { Table } from "@/types/order.types";

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

function TableCard({ table, orders }: { table: Table; orders: OrderListItem[] }) {
  const updateStatus = useUpdateOrderStatus();
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const readyOrders = orders.filter((o) => o.status === "ready");
  const isOccupied = activeOrders.length > 0;

  async function markServed(orderId: number) {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: "served" });
      toast.success(`Order marked as served`);
    } catch {
      toast.error("Cannot update order");
    }
  }

  return (
    <Card className={`border-2 transition-colors ${
      readyOrders.length > 0
        ? "border-green-400 bg-green-50"
        : isOccupied
        ? "border-orange-300 bg-orange-50"
        : "border-gray-200"
    }`}>
      <CardContent className="p-4 space-y-3">
        {/* Table header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-black text-gray-900">T{table.table_number}</p>
            <p className="text-xs text-muted-foreground">{table.capacity} seats</p>
          </div>
          <Badge variant={isOccupied ? "default" : "secondary"} className="text-xs">
            {readyOrders.length > 0 ? "🍽 Ready!" : isOccupied ? "Occupied" : "Free"}
          </Badge>
        </div>

        {/* Active orders on this table */}
        {activeOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No active orders</p>
        ) : (
          <div className="space-y-2">
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-lg bg-white border p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">#{order.order_number}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{order.item_count} item{order.item_count !== 1 ? "s" : ""} · {formatCurrency(order.total_amount)}</span>
                  <span>{timeAgo(order.created_at)}</span>
                </div>
                {order.status === "ready" && (
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => markServed(order.id)}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Served
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New order for this table */}
        {table.is_active && (
          <Link href={`/admin/orders?table=${table.id}`}>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />New Order
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function WaiterPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: ordersData, isLoading: ordersLoading, refetch } = useOrders({ page_size: "100" });
  const { data: tablesData, isLoading: tablesLoading } = useTables();
  const { data: callsData } = useQuery({
    queryKey: ["waiter-calls", "open"],
    queryFn: () => waiterService.listCalls({ call_status: "open", page_size: "20" }),
    refetchInterval: 30000,
  });
  const resolveCall = useMutation({
    mutationFn: (id: number) => waiterService.updateCall(id, { status: "resolved" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waiter-calls"] });
      toast.success("Call resolved");
    },
  });

  const allOrders = ordersData?.results ?? [];
  const tables = (tablesData?.results ?? []).filter((t) => t.is_active);

  // Orders that need attention right now
  const readyCount = allOrders.filter((o) => o.status === "ready").length;
  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const activeCount = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const calls = callsData?.results ?? [];

  // Real-time updates
  useEffect(() => {
    const offCreated = onSocketEvent<OrderCreatedPayload>("order.created", () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    });
    const offChanged = onSocketEvent<OrderStatusChangedPayload>("order.status_changed", () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    });
    return () => { offCreated(); offChanged(); };
  }, [qc]);

  const isLoading = ordersLoading || tablesLoading;

  // Group active orders by table_id
  const ordersByTable: Record<number, OrderListItem[]> = {};
  for (const order of allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status))) {
    if (order.table_number) {
      // Find the table id from tables list
      const table = tables.find((t) => t.table_number === order.table_number);
      if (table) {
        ordersByTable[table.id] = [...(ordersByTable[table.id] ?? []), order];
      }
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">W</div>
            <div>
              <p className="font-bold text-sm">Waiter Station</p>
              <p className="text-xs text-muted-foreground">{user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className={readyCount > 0 ? "border-green-400 bg-green-50" : ""}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-black text-green-600">{readyCount}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />Ready to serve
              </p>
            </CardContent>
          </Card>
          <Card className={pendingCount > 0 ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />Pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ShoppingCart className="h-3 w-3" />Active orders
              </p>
            </CardContent>
          </Card>
        </div>

        {calls.length > 0 && (
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Waiter Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calls.map((call: { id: number; table_id: number; reason: string; created_at: string }) => {
                const table = tables.find((t) => t.id === call.table_id);
                return (
                  <div key={call.id} className="flex items-center justify-between rounded-lg bg-white border p-2">
                    <div>
                      <p className="text-sm font-semibold">Table {table?.table_number ?? call.table_id}</p>
                      <p className="text-xs text-muted-foreground">{call.reason} · {timeAgo(call.created_at)}</p>
                    </div>
                    <Button size="sm" onClick={() => resolveCall.mutate(call.id)} disabled={resolveCall.isPending}>Resolve</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Alerts for ready orders */}
        {readyCount > 0 && (
          <div className="rounded-xl bg-green-100 border-2 border-green-400 p-3 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold text-green-800 text-sm">
                {readyCount} order{readyCount !== 1 ? "s" : ""} ready to serve!
              </p>
              <p className="text-xs text-green-700">Check the tables below and mark as served.</p>
            </div>
          </div>
        )}

        {/* Tables grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Tables ({tables.length})
            </h2>
            <Link href="/admin/orders">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <ShoppingCart className="h-3 w-3" />All Orders
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
            </div>
          ) : tables.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
              No tables configured. Ask an admin to add tables.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {tables.map((t) => (
                <TableCard
                  key={t.id}
                  table={t}
                  orders={ordersByTable[t.id] ?? []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Takeout / delivery orders (not table-bound) */}
        {(() => {
          const nonTableOrders = allOrders.filter(
            (o) => ACTIVE_STATUSES.includes(o.status) && !o.table_number
          );
          if (nonTableOrders.length === 0) return null;
          return (
            <div>
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Takeout / Delivery ({nonTableOrders.length})
              </h2>
              <div className="space-y-2">
                {nonTableOrders.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`}>
                    <div className="rounded-lg bg-white border p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold text-sm">#{o.order_number}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {o.order_type.replace("_", " ")} · {o.item_count} items · {formatCurrency(o.total_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[o.status]}`}>
                          {ORDER_STATUS_LABELS[o.status]}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(o.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
