"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Users, ShoppingCart, TrendingUp,
  CreditCard, UserPlus, UserX, KeyRound, Crown,
} from "lucide-react";
import {
  useRestaurant, useRestaurantStats, useUpdateSubscription,
  useSubscriptionHistory, useUpdateRestaurant,
  useRestaurantUsers, useUpdateRestaurantUser, useDeactivateRestaurantUser,
  useDeactivateRestaurant, useActivateRestaurant,
} from "@/hooks/use-restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/utils/helpers";
import { SUBSCRIPTION_COLORS, SUBSCRIPTION_STATUS_COLORS, ROLE_LABELS } from "@/utils/constants";
import { apiClient } from "@/lib/axios";
import type { User } from "@/types/restaurant.types";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const rid = parseInt(id);
  const router = useRouter();

  const { data: restaurant, isLoading } = useRestaurant(rid);
  const { data: stats } = useRestaurantStats(rid);
  const { data: history } = useSubscriptionHistory(rid);
  const updateSub = useUpdateSubscription(rid);
  const updateR = useUpdateRestaurant(rid);
  const deactivate = useDeactivateRestaurant();
  const activate = useActivateRestaurant();

  const [editPlan, setEditPlan] = useState("none");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpiry, setEditExpiry] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);

  async function handleSubscriptionSave() {
    if (editPlan === "none") { toast.error("Select a plan"); return; }
    try {
      await updateSub.mutateAsync({ plan: editPlan, status: editStatus, expires_at: editExpiry || undefined, notes: editNotes });
      toast.success("Subscription updated");
      setEditPlan("none"); setEditExpiry(""); setEditNotes("");
    } catch { toast.error("Failed"); }
  }

  async function toggleActive() {
    if (!restaurant) return;
    if (restaurant.is_active) {
      if (!confirm(`Deactivate "${restaurant.name}"?`)) return;
      try { await deactivate.mutateAsync(rid); toast.success("Deactivated"); }
      catch { toast.error("Failed"); }
    } else {
      try { await activate.mutateAsync(rid); toast.success("Activated"); }
      catch { toast.error("Failed"); }
    }
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
    </div>
  );
  if (!restaurant) return <div className="text-center py-16 text-muted-foreground">Restaurant not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/restaurants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
              {restaurant.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold truncate">{restaurant.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_COLORS[restaurant.subscription_plan]}`}>{restaurant.subscription_plan}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_STATUS_COLORS[restaurant.subscription_status] ?? ""}`}>{restaurant.subscription_status}</span>
                <Badge variant={restaurant.is_active ? "success" : "secondary"}>{restaurant.is_active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant={restaurant.is_active ? "destructive" : "outline"} size="sm" onClick={toggleActive}>
            {restaurant.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-blue-400" /><div><p className="text-2xl font-bold">{stats?.total_orders ?? "—"}</p><p className="text-xs text-muted-foreground">Total Orders</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-amber-400" /><div><p className="text-lg font-bold">{formatCurrency(stats?.total_revenue ?? 0)}</p><p className="text-xs text-muted-foreground">Revenue (paid)</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-purple-400" /><div><p className="text-2xl font-bold">{stats?.staff_count ?? restaurant.staff_count}</p><p className="text-xs text-muted-foreground">Staff Members</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Building2 className="h-8 w-8 text-green-400" /><div><p className="text-sm font-bold">{stats?.open_orders ?? "—"} open</p><p className="text-xs text-muted-foreground">Active Orders</p></div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff"><Users className="h-3.5 w-3.5 mr-1.5" />Staff</TabsTrigger>
          <TabsTrigger value="subscription"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Subscription</TabsTrigger>
          <TabsTrigger value="info"><Building2 className="h-3.5 w-3.5 mr-1.5" />Info</TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-4">
          <StaffTab restaurantId={rid} onAddUser={() => setShowCreateUser(true)} />
          {showCreateUser && (
            <CreateUserForRestaurantDialog
              restaurantId={rid}
              restaurantName={restaurant.name}
              onClose={() => setShowCreateUser(false)}
            />
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Update Subscription</CardTitle>
              <CardDescription>Current: <strong className="capitalize">{restaurant.subscription_plan}</strong> ({restaurant.subscription_status})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select value={editPlan} onValueChange={setEditPlan}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select plan…</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date (optional)</Label>
                  <Input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. Annual plan" />
                </div>
              </div>
              <Button onClick={handleSubscriptionSave} disabled={editPlan === "none" || updateSub.isPending}>
                {updateSub.isPending ? "Updating…" : "Update Subscription"}
              </Button>
            </CardContent>
          </Card>

          {history && history.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Subscription History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize mr-2 ${SUBSCRIPTION_COLORS[h.plan]}`}>{h.plan}</span>
                        <span className="text-muted-foreground">{h.notes || "—"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Restaurant Profile</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Name", restaurant.name],
                  ["Owner Email", restaurant.owner_email ?? "—"],
                  ["Email", restaurant.email || "—"],
                  ["Phone", restaurant.phone || "—"],
                  ["Address", restaurant.address || "—"],
                  ["City", restaurant.city || "—"],
                  ["Country", restaurant.country || "—"],
                  ["Timezone", restaurant.timezone],
                  ["Currency", restaurant.currency],
                  ["Tax Rate", `${restaurant.tax_rate}%`],
                  ["Registered", formatDate(restaurant.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StaffTab({ restaurantId, onAddUser }: { restaurantId: number; onAddUser: () => void }) {
  const { data: users, isLoading } = useRestaurantUsers(restaurantId);
  const updateUser = useUpdateRestaurantUser(restaurantId);
  const deactivateUser = useDeactivateRestaurantUser(restaurantId);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  async function changeRole(id: number, role: string, name: string) {
    try { await updateUser.mutateAsync({ id, data: { role } }); toast.success(`${name}'s role updated`); }
    catch { toast.error("Failed to update role"); }
  }

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`Deactivate ${name}?`)) return;
    try { await deactivateUser.mutateAsync(id); toast.success(`${name} deactivated`); }
    catch { toast.error("Failed"); }
  }

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{(users ?? []).length} staff members</p>
        <Button size="sm" onClick={onAddUser} className="gap-1.5"><UserPlus className="h-3.5 w-3.5" />Add Staff</Button>
      </div>
      {(users ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">No staff yet</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id} className={!u.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </TableCell>
                  <TableCell><Badge variant={u.is_active ? "success" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select value={u.role} onValueChange={(v) => changeRole(u.id, v, u.full_name)} disabled={!u.is_active}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="waiter">Waiter</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setResetTarget(u)}>
                        <KeyRound className="h-3 w-3" />
                      </Button>
                      {u.is_active && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeactivate(u.id, u.full_name)}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {resetTarget && (
        <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}

function CreateUserForRestaurantDialog({ restaurantId, restaurantName, onClose }: { restaurantId: number; restaurantName: string; onClose: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", role: "admin", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.full_name || !form.email || !form.password) { toast.error("Fill required fields"); return; }
    if (form.password.length < 8) { toast.error("Password min 8 chars"); return; }
    setLoading(true);
    try {
      await apiClient.post("/users", { ...form, restaurant_id: restaurantId });
      toast.success(`${form.full_name} created! 📧 ${form.email} 🔑 ${form.password}`, { duration: 8000 });
      onClose();
    } catch { toast.error("Failed. Email may already exist."); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Add Staff to {restaurantName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={set("full_name")} autoFocus /></div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
          <div className="space-y-1.5"><Label>Temp Password *</Label><Input type="password" value={form.password} onChange={set("password")} placeholder="Min 8 chars" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!newPass || newPass.length < 8) { toast.error("Password min 8 chars"); return; }
    setLoading(true);
    try {
      await apiClient.post(`/users/${user.id}/reset-password`, { new_password: newPass, confirm_password: newPass });
      toast.success(`Password reset for ${user.full_name}`, { duration: 6000 });
      onClose();
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>For <strong>{user.full_name}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>New Password (min 8 chars)</Label>
          <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? "Resetting…" : "Reset"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
