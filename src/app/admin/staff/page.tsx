"use client";
import { useState } from "react";
import { Plus, UserX, KeyRound } from "lucide-react";
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser, useResetUserPassword } from "@/hooks/use-restaurant";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import type { User } from "@/types/restaurant.types";

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const resetPassword = useResetUserPassword();
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  async function save() {
    if (!newPass) { toast.error("Enter a new password"); return; }
    if (newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords do not match"); return; }
    try {
      await resetPassword.mutateAsync({ id: user.id, new_password: newPass, confirm_password: confirmPass });
      toast.success(`Password reset for ${user.full_name}`, { duration: 6000 });
      onClose();
    } catch { toast.error("Failed to reset password"); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Reset Password</DialogTitle>
          <DialogDescription>Setting new password for <strong>{user.full_name}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>New Password (min 8 chars)</Label><Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoFocus /></div>
          <div className="space-y-1.5"><Label>Confirm Password</Label><Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={resetPassword.isPending}>{resetPassword.isPending ? "Resetting…" : "Reset Password"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddStaffDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const [form, setForm] = useState({ email: "", full_name: "", phone: "", role: "waiter", password: "", confirm_password: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.email || !form.full_name || !form.password) { toast.error("Fill required fields"); return; }
    if (form.password.length < 8) { toast.error("Password min 8 chars"); return; }
    if (form.password !== form.confirm_password) { toast.error("Passwords don't match"); return; }
    try {
      await create.mutateAsync({ email: form.email, full_name: form.full_name, phone: form.phone, role: form.role, password: form.password });
      toast.success(`${form.full_name} added!`);
      onClose();
    } catch { toast.error("Failed. Email may already exist."); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={set("full_name")} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
          </div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={form.password} onChange={set("password")} /></div>
            <div className="space-y-1.5"><Label>Confirm *</Label><Input type="password" value={form.confirm_password} onChange={set("confirm_password")} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending}>{create.isPending ? "Adding…" : "Add Staff"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const { data, isLoading } = useUsers();
  const updateUser = useUpdateUser();
  const deactivate = useDeactivateUser();

  const staff = data?.results ?? [];

  async function changeRole(id: number, role: string) {
    try { await updateUser.mutateAsync({ id, data: { role } }); toast.success("Role updated"); }
    catch { toast.error("Failed to update role"); }
  }

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`Deactivate ${name}?`)) return;
    try { await deactivate.mutateAsync(id); toast.success(`${name} deactivated`); }
    catch { toast.error("Failed"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description={`${staff.length} team member${staff.length !== 1 ? "s" : ""}`} action={<Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Staff</Button>} />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : staff.length === 0 ? (
            <EmptyState title="No staff members" description="Add your first team member" action={<Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Add Staff</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                  <TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{ROLE_LABELS[m.role] ?? m.role}</Badge></TableCell>
                    <TableCell><Badge variant={m.is_active ? "success" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(m.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select value={m.role} onValueChange={(v) => changeRole(m.id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="waiter">Waiter</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setResetTarget(m)}>
                          <KeyRound className="h-3 w-3" /> Password
                        </Button>
                        {m.is_active && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeactivate(m.id, m.full_name)}>
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {showAdd && <AddStaffDialog onClose={() => setShowAdd(false)} />}
      {resetTarget && <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}
