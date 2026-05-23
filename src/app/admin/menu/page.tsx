"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useCategories } from "@/hooks/use-menu";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helpers";
import type { MenuItem } from "@/types/menu.types";

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const params: Record<string, string> = {};
  if (catFilter && catFilter !== "all") params.category_id = catFilter;

  const { data, isLoading } = useMenuItems(params);
  const { data: catsData } = useCategories();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const items = (data?.results ?? []).filter((i) => search ? i.name.toLowerCase().includes(search.toLowerCase()) : true);
  const categories = catsData?.results ?? [];

  async function toggleItem(item: MenuItem) {
    await updateItem.mutateAsync({ id: item.id, data: { is_available: !item.is_available } });
    toast.success("Updated");
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await deleteItem.mutateAsync(item.id); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Items" description={`${data?.count ?? 0} items`} action={<Button onClick={() => { setEditing(null); setShowDialog(true); }}><Plus className="h-4 w-4" />Add Item</Button>} />
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState title="No items" description="Add menu items to get started" action={<Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4" />Add Item</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
                      <span className="text-xs text-muted-foreground">· {item.preparation_time_minutes}min</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge variant={item.is_available ? "success" : "secondary"} className="text-xs">{item.is_available ? "Available" : "Unavailable"}</Badge>
                      <Badge variant="outline" className="text-xs">{item.category_name}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => toggleItem(item)} className="p-1 text-muted-foreground hover:text-foreground">{item.is_available ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}</button>
                    <button onClick={() => { setEditing(item); setShowDialog(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(item)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {showDialog && <MenuItemDialog key={editing?.id ?? "new"} open onClose={() => setShowDialog(false)} editing={editing} categories={categories} />}
    </div>
  );
}

function MenuItemDialog({ open, onClose, editing, categories }: { open: boolean; onClose: () => void; editing: MenuItem | null; categories: { id: number; name: string }[] }) {
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", preparation_time_minutes: "15", is_available: true });

  useEffect(() => {
    if (editing) setForm({
      name: editing.name, description: editing.description,
      price: String(editing.price), category_id: String(editing.category_id),
      preparation_time_minutes: String(editing.preparation_time_minutes),
      is_available: editing.is_available,
    });
  }, [editing]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.name || !form.price || !form.category_id) { toast.error("Name, price, and category required"); return; }
    if (parseFloat(form.price) <= 0) { toast.error("Price must be positive"); return; }
    const payload = { ...form, category_id: parseInt(form.category_id), price: parseFloat(form.price), preparation_time_minutes: parseInt(form.preparation_time_minutes) || 15 };
    try {
      if (editing) { await updateItem.mutateAsync({ id: editing.id, data: payload }); toast.success("Updated"); }
      else { await createItem.mutateAsync(payload); toast.success("Created"); }
      onClose();
    } catch { toast.error("Failed to save"); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Item" : "New Menu Item"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Category *</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={set("name")} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={set("description")} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Price *</Label><Input type="number" step="0.01" min="0.01" value={form.price} onChange={set("price")} /></div>
            <div className="space-y-1.5"><Label>Prep (min)</Label><Input type="number" min="1" value={form.preparation_time_minutes} onChange={set("preparation_time_minutes")} /></div>
          </div>
          <div className="space-y-1.5"><Label>Availability</Label>
            <Select value={form.is_available ? "true" : "false"} onValueChange={(v) => setForm((p) => ({ ...p, is_available: v === "true" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Available</SelectItem><SelectItem value="false">Unavailable</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={createItem.isPending || updateItem.isPending}>{createItem.isPending || updateItem.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
