"use client";
import { useKitchenTickets, useUpdateKitchenTicket } from "@/hooks/use-kitchen";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/utils/helpers";

const PRIORITY_COLORS: Record<string, string> = { low: "bg-gray-100 text-gray-700", normal: "bg-blue-100 text-blue-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-800" };
const STATUS_COLORS: Record<string, string> = { pending: "bg-amber-100 text-amber-800", in_progress: "bg-blue-100 text-blue-800", ready: "bg-green-100 text-green-800", delivered: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-800" };

export default function TicketsPage() {
  const { data, isLoading } = useKitchenTickets();
  const updateTicket = useUpdateKitchenTicket();
  const tickets = data?.results ?? [];

  async function updatePriority(id: number, priority: string) {
    try { await updateTicket.mutateAsync({ id, data: { priority } }); toast.success("Priority updated"); }
    catch { toast.error("Failed"); }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Kitchen Tickets" description={`${tickets.length} active tickets`} />
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg bg-gray-800" />)}</div>
        ) : tickets.length === 0 ? (
          <EmptyState title="No active tickets" description="Tickets appear here when orders are placed" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="font-bold">#{t.order_number}</p>{t.table_number && <p className="text-xs text-gray-400">Table {t.table_number}</p>}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[t.status] ?? "")}>{t.status.replace("_", " ")}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", PRIORITY_COLORS[t.priority] ?? "")}>{t.priority}</span>
                  </div>
                </div>
                <ul className="space-y-1">
                  {t.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">{item.quantity}</span>
                      <span>{item.menu_item_name}</span>
                      {item.special_instructions && <span className="text-xs text-orange-400">⚠ {item.special_instructions}</span>}
                    </li>
                  ))}
                </ul>
                <div className="pt-1">
                  <Select value={t.priority} onValueChange={(v) => updatePriority(t.id, v)}>
                    <SelectTrigger className="h-8 bg-gray-700 border-gray-600 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
