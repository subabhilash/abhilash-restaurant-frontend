import { cn, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/utils";
import type { OrderStatus } from "@/types/order.types";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", ORDER_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600")}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-yellow-100 text-yellow-800",
  refunded: "bg-purple-100 text-purple-800",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", PAYMENT_COLORS[status] ?? "bg-gray-100 text-gray-600")}>{label}</span>;
}
