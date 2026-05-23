"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-menu";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Category } from "@/types/menu.types";

export default function CategoriesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { data, isLoading } = useCategories();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const categories = data?.results ?? [];

  async function toggle(cat: Category) {
    await updateCat.mutateAsync({ id: cat.id, data: { is_active: !cat.is_active } });
    toast.success("Updated");
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? Items in this category will be affected.`)) return;
    try { await deleteCat.mutateAsync(cat.id); toast.success("Deleted"); }
    catch { toast.error("Cannot delete category with items"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description={`${categories.length} categories`} action={<Button onClick={() => { setEditing(null); setShowDialog(true); }}><Plus className="h-4 w-4" />Add Category</Button>} />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories" description="Create your first menu category" action={<Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4" />Add Category</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.item_count} items</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{cat.description}</p>}
                    <Badge variant={cat.is_active ? "success" : "secondary"} className="text-xs mt-2">{cat.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => toggle(cat)} className="p-1 text-muted-foreground hover:text-foreground">{cat.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}</button>
                    <button onClick={() => { setEditing(cat); setShowDialog(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(cat)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showDialog && <CategoryDialog key={editing?.id ?? "new"} open onClose={() => setShowDialog(false)} editing={editing} />}
    </div>
  );
}

function CategoryDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Category | null }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  useEffect(() => { setName(editing?.name ?? ""); setDescription(editing?.description ?? ""); }, [editing]);

  async function save() {
    if (!name.trim()) { toast.error("Name required"); return; }
    try {
      if (editing) { await update.mutateAsync({ id: editing.id, data: { name, description } }); toast.success("Updated"); }
      else { await create.mutateAsync({ name, description }); toast.success("Created"); }
      onClose();
    } catch { toast.error("Failed"); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Burgers, Drinks" autoFocus /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
