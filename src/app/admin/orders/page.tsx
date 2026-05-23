"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw } from "lucide-react";
import { useOrders, useCreateOrder, useTables } from "@/hooks/use-orders";
import { useMenuItems } from "@/hooks/use-menu";
import { useMyRestaurant } from "@/hooks/use-restaurant";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { onSocketEvent, type OrderCreatedPayload, type OrderStatusChangedPayload } from "@/lib/socket";
import { formatCurrency, timeAgo } from "@/utils/helpers";
import type { OrderType } from "@/types/order.types";

const STATUS_TABS = ["all", "pending", "confirmed", "preparing", "ready", "served", "cancelled"] as const;

export default function OrdersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  // Debounce search to avoid firing on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, string> = { page: String(page), page_size: "20" };
  if (tab !== "all") params.status = tab;
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading, refetch } = useOrders(params);
  const orders = data?.results ?? [];

  // Real-time updates via Socket.IO
  useEffect(() => {
    const offCreated = onSocketEvent<OrderCreatedPayload>("order.created", (payload) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.info(`New order #${payload.order_number}`, { duration: 3000 });
    });
    const offChanged = onSocketEvent<OrderStatusChangedPayload>("order.status_changed", () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    });
    return () => { offCreated(); offChanged(); };
  }, [qc]);

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description={`${data?.count ?? 0} order${data?.count !== 1 ? "s" : ""}`} action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />New Order</Button>} />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order #, name, phone…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="flex flex-wrap h-auto gap-0.5">
          {STATUS_TABS.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : orders.length === 0 ? (
            <EmptyState title="No orders" description={tab !== "all" ? `No ${tab} orders` : "Orders will appear here"} action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />New Order</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead><TableHead>Table/Type</TableHead><TableHead>Customer</TableHead>
                  <TableHead className="text-center">Items</TableHead><TableHead>Total</TableHead>
                  <TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell><Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:underline">#{o.order_number}</Link></TableCell>
                    <TableCell className="text-sm">{o.table_number ? `Table ${o.table_number}` : o.order_type.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm">{o.customer_name || "—"}</TableCell>
                    <TableCell className="text-center text-sm">{o.item_count}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(o.total_amount)}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                    <TableCell><PaymentStatusBadge status={o.payment_status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(o.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data && data.total_pages > 1 && (
            <div className="px-4 py-3">
              <Pagination
                page={page}
                totalPages={data.total_pages}
                count={data.count}
                pageSize={20}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const { data: tablesData } = useTables();
  const { data: itemsData } = useMenuItems({ is_available: "true" });
  const { data: restaurant } = useMyRestaurant();
  const createOrder = useCreateOrder();

  const [tableId, setTableId] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [qty, setQty] = useState<Record<number, number>>({});

  const tables = tablesData?.results ?? [];
  const items = itemsData?.results ?? [];
  const taxRate = (restaurant?.tax_rate ?? 0) / 100;
  const subtotal = items.filter((i) => qty[i.id]).reduce((s, i) => s + i.price * (qty[i.id] ?? 0), 0);

  function updateQty(id: number, delta: number) {
    setQty((p) => { const n = (p[id] ?? 0) + delta; if (n <= 0) { const q = { ...p }; delete q[id]; return q; } return { ...p, [id]: n }; });
  }

  async function submit() {
    const orderItems = Object.entries(qty).map(([menu_item_id, quantity]) => ({ menu_item_id: parseInt(menu_item_id), quantity }));
    if (!orderItems.length) { toast.error("Add at least one item"); return; }
    try {
      await createOrder.mutateAsync({ table_id: tableId, customer_name: customerName, order_type: orderType, items: orderItems });
      toast.success("Order created!"); onClose();
    } catch { toast.error("Failed to create order"); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="dine_in">Dine In</SelectItem><SelectItem value="takeout">Takeout</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Table (optional)</Label>
              <Select value={tableId ? String(tableId) : "none"} onValueChange={(v) => setTableId(v === "none" ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No table</SelectItem>
                  {tables.map((t) => <SelectItem key={t.id} value={String(t.id)}>Table {t.table_number} ({t.capacity} cap)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Customer Name</Label><Input placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Menu Items</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {items.map((item) => {
                const q = qty[item.id] ?? 0;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3">
                    <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p></div>
                    <div className="flex items-center gap-2">
                      {q > 0 ? (
                        <><Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>−</Button>
                        <span className="w-6 text-center text-sm font-bold">{q}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>+</Button></>
                      ) : <Button size="sm" variant="outline" onClick={() => updateQty(item.id, 1)}>Add</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {subtotal > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax ({restaurant?.tax_rate ?? 0}%)</span><span>{formatCurrency(subtotal * taxRate)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{formatCurrency(subtotal * (1 + taxRate))}</span></div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={createOrder.isPending || !Object.keys(qty).length}>{createOrder.isPending ? "Creating…" : "Place Order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
