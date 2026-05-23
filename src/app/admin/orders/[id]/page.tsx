"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CreditCard } from "lucide-react";
import { useOrder, useUpdateOrderStatus, useUpdatePaymentStatus } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/utils/helpers";
import type { OrderStatus } from "@/types/order.types";

const TRANSITIONS: Record<string, { next?: OrderStatus; label?: string; canCancel?: boolean }> = {
  pending:   { next: "confirmed",  label: "Confirm Order", canCancel: true },
  confirmed: { next: "preparing",  label: "Start Preparing", canCancel: true },
  preparing: { next: "ready",      label: "Mark Ready",    canCancel: true },
  ready:     { next: "served",     label: "Mark Served" },
  served:    { next: "completed",  label: "Complete" },
  completed: {},
  cancelled: {},
};

const PAYMENT_OPTIONS = [
  { value: "unpaid",         label: "Unpaid" },
  { value: "paid",           label: "✅ Paid" },
  { value: "partially_paid", label: "Partial" },
  { value: "refunded",       label: "Refunded" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(parseInt(id));
  const updateStatus = useUpdateOrderStatus();
  const updatePayment = useUpdatePaymentStatus();

  async function advance(status: OrderStatus) {
    try { await updateStatus.mutateAsync({ id: parseInt(id), status }); toast.success(`Order marked as ${status}`); }
    catch { toast.error("Failed to update status"); }
  }

  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    try { await updateStatus.mutateAsync({ id: parseInt(id), status: "cancelled" }); toast.success("Order cancelled"); }
    catch { toast.error("Cannot cancel at this stage"); }
  }

  async function changePayment(payment_status: string) {
    try { await updatePayment.mutateAsync({ id: parseInt(id), payment_status }); toast.success(`Payment: ${payment_status.replace("_", " ")}`); }
    catch { toast.error("Failed to update payment"); }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-9 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!order) return <div className="text-center py-16 text-muted-foreground">Order not found</div>;

  const flow = TRANSITIONS[order.status];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-2xl font-bold">Order #{order.order_number}</h2>
          <div className="flex items-center gap-2 mt-1">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
          <CardContent>
            <Row label="Type">{order.order_type.replace("_", " ")}</Row>
            {order.table_number && <Row label="Table">Table {order.table_number}</Row>}
            {order.customer_name && <Row label="Customer">{order.customer_name}</Row>}
            {order.customer_phone && <Row label="Phone">{order.customer_phone}</Row>}
            {order.special_instructions && (
              <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
                <strong>Note:</strong> {order.special_instructions}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Timeline</CardTitle></CardHeader>
          <CardContent>
            <Row label="Placed">{formatDateTime(order.created_at)}</Row>
            {order.confirmed_at && <Row label="Confirmed">{formatDateTime(order.confirmed_at)}</Row>}
            {order.preparing_at && <Row label="Started">{formatDateTime(order.preparing_at)}</Row>}
            {order.ready_at && <Row label="Ready">{formatDateTime(order.ready_at)}</Row>}
            {order.served_at && <Row label="Served">{formatDateTime(order.served_at)}</Row>}
            {order.completed_at && <Row label="Completed">{formatDateTime(order.completed_at)}</Row>}
            {order.cancelled_at && <Row label="Cancelled">{formatDateTime(order.cancelled_at)}</Row>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-600" />Payment Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1"><p className="text-xs text-muted-foreground mb-1">Current status</p><PaymentStatusBadge status={order.payment_status} /></div>
            <Select value={order.payment_status} onValueChange={changePayment} disabled={updatePayment.isPending}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Items ({order.items.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-3">
                <div>
                  <p className="font-medium">{item.quantity}× {item.menu_item_name}</p>
                  {item.special_instructions && <p className="text-xs text-orange-600 mt-0.5">Note: {item.special_instructions}</p>}
                </div>
                <p className="font-medium">{formatCurrency(item.total_price)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.tax_amount > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>}
            {order.service_charge > 0 && <div className="flex justify-between text-muted-foreground"><span>Service</span><span>{formatCurrency(order.service_charge)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></div>
          </div>
        </CardContent>
      </Card>

      {(flow?.next || flow?.canCancel) && (
        <div className="flex gap-3">
          {flow.next && <Button onClick={() => advance(flow.next!)} disabled={updateStatus.isPending}>{flow.label}</Button>}
          {flow.canCancel && <Button variant="destructive" onClick={cancel} disabled={updateStatus.isPending}>Cancel Order</Button>}
        </div>
      )}
    </div>
  );
}
