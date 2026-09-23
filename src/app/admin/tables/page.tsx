"use client";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, QrCode, RotateCcw, PowerOff, Copy, ExternalLink, Download } from "lucide-react";
import { useTables, useCreateTable, useDeactivateTable, useRotateQR } from "@/hooks/use-orders";
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
import type { Table } from "@/types/order.types";

export default function TablesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [rotating, setRotating] = useState<number | null>(null);

  const { data, isLoading } = useTables();
  const deactivate = useDeactivateTable();
  const rotateQR = useRotateQR();

  const tables = data?.results ?? [];

  async function handleRotate(table: Table) {
    setRotating(table.id);
    try { const updated = await rotateQR.mutateAsync(table.id); setQrTable(updated); toast.success("QR rotated"); }
    catch { toast.error("Failed"); }
    finally { setRotating(null); }
  }

  async function handleDeactivate(table: Table) {
    if (!confirm(`Deactivate Table ${table.table_number}?`)) return;
    try { await deactivate.mutateAsync(table.id); toast.success("Deactivated"); }
    catch { toast.error("Failed"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tables & QR Codes" description={`${tables.length} tables`} action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Add Table</Button>} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}</div>
      ) : tables.length === 0 ? (
        <EmptyState title="No tables" description="Add tables to enable QR ordering" action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Add Table</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => (
            <Card key={t.id} className={!t.is_active ? "opacity-50" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div><p className="text-3xl font-black">T{t.table_number}</p><p className="text-xs text-muted-foreground">Capacity: {t.capacity}</p></div>
                  <Badge variant={t.is_active ? "success" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                {t.location_description && <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">{t.location_description}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setQrTable(t)} className="gap-1"><QrCode className="h-3.5 w-3.5" />QR</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRotate(t)} disabled={rotating === t.id || !t.is_active} className="gap-1"><RotateCcw className={`h-3.5 w-3.5 ${rotating === t.id ? "animate-spin" : ""}`} />Rotate</Button>
                  {t.is_active && <Button size="sm" variant="ghost" onClick={() => handleDeactivate(t)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><PowerOff className="h-3.5 w-3.5" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateTableDialog onClose={() => setShowCreate(false)} />}

      {qrTable && (
        <QRCodeDialog table={qrTable} onClose={() => setQrTable(null)} />
      )}
    </div>
  );
}

function QRCodeDialog({ table, onClose }: { table: Table; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${table.table_number}-qr.png`;
    link.click();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>QR Code — Table {table.table_number}</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <QRCodeCanvas ref={canvasRef} value={table.qr_url} size={192} level="M" includeMargin />
          </div>
          <div className="w-full rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground mb-1">Customer URL</p>
            <p className="text-xs font-mono break-all">{table.qr_url}</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(table.qr_url); toast.success("Copied!"); }}><Copy className="h-4 w-4" />Copy</Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open(table.qr_url, "_blank")}><ExternalLink className="h-4 w-4" />Open</Button>
            <Button variant="outline" className="gap-2" onClick={downloadQR}><Download className="h-4 w-4" />PNG</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTableDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateTable();
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [location, setLocation] = useState("");

  async function save() {
    if (!number.trim()) { toast.error("Table number required"); return; }
    try {
      await create.mutateAsync({ table_number: number.trim(), capacity: parseInt(capacity) || 4, location_description: location.trim() });
      toast.success(`Table ${number} created`); onClose();
    } catch { toast.error("Failed. Number may already exist."); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Table</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Table Number *</Label><Input placeholder="1, A1, T01" value={number} onChange={(e) => setNumber(e.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input placeholder="Near window, Patio…" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">A QR code will be generated automatically.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending}>Create Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
