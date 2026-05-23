"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Building2, Eye, PowerOff, Power } from "lucide-react";
import {
  useAllRestaurants, useCreateRestaurant,
  useDeactivateRestaurant, useActivateRestaurant,
} from "@/hooks/use-restaurant";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate } from "@/utils/helpers";
import { SUBSCRIPTION_COLORS, SUBSCRIPTION_STATUS_COLORS } from "@/utils/constants";
import type { Restaurant } from "@/types/restaurant.types";

export default function AllRestaurantsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const params: Record<string, string> = { page_size: "100" };
  if (planFilter !== "all") params.subscription_plan = planFilter;
  if (statusFilter !== "all") params.is_active = statusFilter;
  if (search) params.search = search;

  const { data, isLoading } = useAllRestaurants(params);
  const deactivate = useDeactivateRestaurant();
  const activate = useActivateRestaurant();
  const restaurants = data?.results ?? [];

  async function handleToggle(r: Restaurant) {
    const action = r.is_active ? "Deactivate" : "Activate";
    if (r.is_active && !confirm(`Deactivate "${r.name}"? All staff will lose access.`)) return;
    try {
      if (r.is_active) { await deactivate.mutateAsync(r.id); toast.success(`${r.name} deactivated`); }
      else { await activate.mutateAsync(r.id); toast.success(`${r.name} activated`); }
    } catch { toast.error(`Failed to ${action.toLowerCase()} restaurant`); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Restaurants"
        description={`${data?.count ?? 0} restaurants on the platform`}
        action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Onboard Restaurant</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["free", "starter", "professional", "enterprise"] as const).map((plan) => {
          const count = restaurants.filter((r) => r.subscription_plan === plan).length;
          return (
            <Card key={plan}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_COLORS[plan]}`}>{plan}</span>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : restaurants.length === 0 ? (
            <EmptyState title="No restaurants" description="Onboard the first restaurant" action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Onboard</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-center">Staff</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Sub Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                          {r.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.email || r.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.owner_email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.city || "—"}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{r.staff_count}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_COLORS[r.subscription_plan]}`}>{r.subscription_plan}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_STATUS_COLORS[r.subscription_status] ?? ""}`}>{r.subscription_status}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "success" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/restaurants/${r.id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5"><Eye className="h-3.5 w-3.5" />Manage</Button>
                        </Link>
                        <Button
                          size="sm" variant="ghost"
                          className={`h-8 gap-1 ${r.is_active ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                          onClick={() => handleToggle(r)}
                        >
                          {r.is_active ? <><PowerOff className="h-3.5 w-3.5" />Off</> : <><Power className="h-3.5 w-3.5" />On</>}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreate && <OnboardRestaurantDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function OnboardRestaurantDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateRestaurant();
  const [form, setForm] = useState({
    restaurant_name: "", restaurant_email: "", restaurant_phone: "",
    restaurant_city: "", restaurant_country: "IN",
    admin_name: "", admin_email: "", admin_password: "",
    subscription_plan: "free",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.restaurant_name.trim() || !form.admin_email || !form.admin_name || !form.admin_password) {
      toast.error("Restaurant name, admin name, email, and password are required"); return;
    }
    if (form.admin_password.length < 8) { toast.error("Password must be at least 8 chars"); return; }
    try {
      const r = await create.mutateAsync(form) as Restaurant;
      toast.success(`${r.name} onboarded! Admin: ${form.admin_email}`, { duration: 8000 });
      onClose();
    } catch { toast.error("Failed. Admin email may already exist."); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Onboard New Restaurant</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
            Creates the restaurant and its first admin user in one step.
          </p>
          <div className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Restaurant</div>
          <div className="space-y-1.5"><Label>Restaurant Name *</Label><Input value={form.restaurant_name} onChange={set("restaurant_name")} placeholder="The Spice Garden" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.restaurant_email} onChange={set("restaurant_email")} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.restaurant_phone} onChange={set("restaurant_phone")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>City</Label><Input value={form.restaurant_city} onChange={set("restaurant_city")} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.restaurant_country} onChange={set("restaurant_country")} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Subscription Plan</Label>
            <Select value={form.subscription_plan} onValueChange={(v) => setForm((p) => ({ ...p, subscription_plan: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="font-medium text-sm text-muted-foreground uppercase tracking-wide mt-2">Admin User</div>
          <div className="space-y-1.5"><Label>Admin Name *</Label><Input value={form.admin_name} onChange={set("admin_name")} /></div>
          <div className="space-y-1.5"><Label>Admin Email *</Label><Input type="email" value={form.admin_email} onChange={set("admin_email")} /></div>
          <div className="space-y-1.5"><Label>Temporary Password *</Label><Input type="password" value={form.admin_password} onChange={set("admin_password")} placeholder="Min 8 characters" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending}>{create.isPending ? "Creating…" : "Onboard Restaurant"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
