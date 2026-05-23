"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useKitchenStations, useCreateStation, useUpdateStation, useDeleteStation } from "@/hooks/use-kitchen";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { KitchenStation } from "@/types/kitchen.types";

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

function StationDialog({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: KitchenStation | null;
}) {
  const create = useCreateStation();
  const update = useUpdateStation();
  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.display_color ?? "#3B82F6");
  const [order, setOrder] = useState(editing?.display_order ?? 0);

  async function save() {
    if (!name.trim()) { toast.error("Station name required"); return; }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: { name, display_color: color, display_order: order } });
        toast.success("Station updated");
      } else {
        await create.mutateAsync({ name, display_color: color, display_order: order });
        toast.success("Station created");
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save";
      toast.error(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Station" : "New Kitchen Station"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Station Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grill, Salad, Desserts…"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Display Color</Label>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border"
                title="Custom color"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Display Order</Label>
            <Input
              type="number"
              min={0}
              max={999}
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">Lower number = shown first</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>
            {(create.isPending || update.isPending) ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StationsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<KitchenStation | null>(null);
  const { data, isLoading } = useKitchenStations();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  const stations = data?.results ?? [];

  async function toggleActive(station: KitchenStation) {
    try {
      await updateStation.mutateAsync({ id: station.id, data: { is_active: !station.is_active } });
      toast.success(`${station.name} ${station.is_active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update station");
    }
  }

  async function handleDelete(station: KitchenStation) {
    if (!confirm(`Delete station "${station.name}"? Tickets linked to it will be unassigned.`)) return;
    try {
      await deleteStation.mutateAsync(station.id);
      toast.success(`${station.name} deleted`);
    } catch {
      toast.error("Failed to delete station");
    }
  }

  function openEdit(station: KitchenStation) {
    setEditing(station);
    setShowDialog(true);
  }

  function openCreate() {
    setEditing(null);
    setShowDialog(true);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Kitchen Stations"
          description={`${stations.length} station${stations.length !== 1 ? "s" : ""} configured`}
          action={
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />Add Station
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg bg-gray-800" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <EmptyState
            title="No stations configured"
            description="Add kitchen workstations to route tickets and organize your kitchen flow."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add First Station</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[...stations].sort((a, b) => a.display_order - b.display_order).map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border p-4 transition-opacity ${s.is_active ? "bg-gray-800 border-gray-700" : "bg-gray-900 border-gray-800 opacity-50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full flex-shrink-0 ring-2 ring-white/20"
                      style={{ backgroundColor: s.display_color }}
                    />
                    <div>
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-gray-400">Order: {s.display_order}</p>
                    </div>
                  </div>
                  <Badge
                    variant={s.is_active ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {s.is_active ? "Active" : "Off"}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 flex-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 flex-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={() => toggleActive(s)}
                  >
                    {s.is_active ? (
                      <><PowerOff className="h-3 w-3 mr-1" />Disable</>
                    ) : (
                      <><Power className="h-3 w-3 mr-1" />Enable</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                    onClick={() => handleDelete(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-300">How stations work</p>
          <p>• Assign a station to a kitchen ticket from the Tickets page</p>
          <p>• Kitchen staff see only their station&apos;s tickets in a filtered view</p>
          <p>• Stations help route orders (e.g. cold items → Salad, hot items → Grill)</p>
        </div>
      </div>

      {showDialog && (
        <StationDialog
          key={editing?.id ?? "new"}
          open
          onClose={() => { setShowDialog(false); setEditing(null); }}
          editing={editing}
        />
      )}
    </div>
  );
}
