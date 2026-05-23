"use client";
import { useState, useEffect } from "react";
import {
  useMyRestaurant, useUpdateMyRestaurant,
  useMe, useUpdateMe, useChangePassword,
} from "@/hooks/use-restaurant";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/common/loading-screen";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/utils/constants";
import type { Restaurant } from "@/types/restaurant.types";

export default function SettingsPage() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const { data: me } = useMe();
  const updateRestaurant = useUpdateMyRestaurant();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const [profile, setProfile] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ allow_online_ordering: true, auto_accept_orders: false, kitchen_display_enabled: true });
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [myName, setMyName] = useState("");
  const [myPhone, setMyPhone] = useState("");

  useEffect(() => {
    if (!restaurant) return;
    setProfile({
      logo: restaurant.logo ?? "",
      name: restaurant.name ?? "",
      description: restaurant.description ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      address: restaurant.address ?? "",
      city: restaurant.city ?? "",
      state: restaurant.state ?? "",
      country: restaurant.country ?? "",
      timezone: restaurant.timezone ?? "",
      currency: restaurant.currency ?? "",
      tax_rate: String(restaurant.tax_rate ?? 0),
      service_charge_rate: String(restaurant.service_charge_rate ?? 0),
    });
    setFlags({
      allow_online_ordering: restaurant.allow_online_ordering,
      auto_accept_orders: restaurant.auto_accept_orders,
      kitchen_display_enabled: restaurant.kitchen_display_enabled,
    });
  }, [restaurant]);

  useEffect(() => {
    if (me) { setMyName(me.full_name ?? ""); setMyPhone(me.phone ?? ""); }
  }, [me]);

  if (isLoading) return <LoadingScreen />;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile((p) => ({ ...p, [k]: e.target.value }));

  async function saveProfile() {
    if (!profile.name?.trim()) { toast.error("Restaurant name is required"); return; }
    try { await updateRestaurant.mutateAsync(profile as Partial<Restaurant>); toast.success("Restaurant profile updated"); }
    catch { toast.error("Failed to save profile"); }
  }

  async function saveFlags() {
    try { await updateRestaurant.mutateAsync(flags); toast.success("Feature settings saved"); }
    catch { toast.error("Failed to save settings"); }
  }

  async function saveCharges() {
    try {
      await updateRestaurant.mutateAsync({
        tax_rate: parseFloat(profile.tax_rate) || 0,
        service_charge_rate: parseFloat(profile.service_charge_rate) || 0,
        currency: profile.currency,
        timezone: profile.timezone,
      });
      toast.success("Billing settings saved");
    } catch { toast.error("Failed to save billing settings"); }
  }

  async function saveMyProfile() {
    if (!myName.trim()) { toast.error("Name is required"); return; }
    try { await updateMe.mutateAsync({ full_name: myName.trim(), phone: myPhone.trim() }); toast.success("Profile updated"); }
    catch { toast.error("Failed to update profile"); }
  }

  async function savePassword() {
    if (!passwords.old) { toast.error("Enter your current password"); return; }
    if (passwords.new.length < 8) { toast.error("New password must be at least 8 chars"); return; }
    if (passwords.new !== passwords.confirm) { toast.error("Passwords do not match"); return; }
    try {
      await changePassword.mutateAsync({ old_password: passwords.old, new_password: passwords.new, confirm_new_password: passwords.confirm });
      toast.success("Password changed successfully");
      setPasswords({ old: "", new: "", confirm: "" });
    } catch { toast.error("Incorrect current password"); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Configure your restaurant and account" />
      <Tabs defaultValue="profile">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile">Restaurant</TabsTrigger>
          <TabsTrigger value="flags">Features</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="account">My Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Restaurant Profile</CardTitle><CardDescription>Basic information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {/* Logo URL */}
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <div className="flex items-center gap-3">
                  {profile.logo && (
                    <img
                      src={profile.logo}
                      alt="Logo"
                      className="h-10 w-10 rounded-lg object-cover border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <Input
                    value={profile.logo ?? ""}
                    onChange={set("logo")}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Paste a public image URL. Square images work best (64×64 px+).</p>
              </div>
              <Separator />
              <div className="space-y-1.5"><Label>Restaurant Name *</Label><Input value={profile.name ?? ""} onChange={set("name")} placeholder="The Spice Garden" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={profile.description ?? ""} onChange={set("description")} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={set("phone")} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={profile.email ?? ""} onChange={set("email")} /></div>
              </div>
              <Separator />
              <div className="space-y-1.5"><Label>Street Address</Label><Input value={profile.address ?? ""} onChange={set("address")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>City</Label><Input value={profile.city ?? ""} onChange={set("city")} /></div>
                <div className="space-y-1.5"><Label>State</Label><Input value={profile.state ?? ""} onChange={set("state")} /></div>
              </div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={profile.country ?? ""} onChange={set("country")} /></div>
              <Button onClick={saveProfile} disabled={updateRestaurant.isPending} className="w-full sm:w-auto">
                {updateRestaurant.isPending ? "Saving…" : "Save Restaurant Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Feature Flags</CardTitle><CardDescription>Toggle restaurant features</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {([
                ["allow_online_ordering", "Online QR Ordering", "Allow customers to scan QR and order"],
                ["auto_accept_orders",    "Auto-Accept Orders",  "Automatically confirm incoming orders"],
                ["kitchen_display_enabled","Kitchen Display",    "Show live orders on kitchen display"],
              ] as [keyof typeof flags, string, string][]).map(([key, label, desc], i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-2.5">
                    <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <Switch checked={!!flags[key]} onCheckedChange={(v) => setFlags((p) => ({ ...p, [key]: v }))} />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              <Separator />
              <Button onClick={saveFlags} disabled={updateRestaurant.isPending} className="w-full sm:w-auto">
                {updateRestaurant.isPending ? "Saving…" : "Save Feature Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Currency & Timezone</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Currency Code</Label><Input value={profile.currency ?? ""} onChange={set("currency")} placeholder="INR" /></div>
                <div className="space-y-1.5"><Label>Timezone</Label><Input value={profile.timezone ?? ""} onChange={set("timezone")} placeholder="Asia/Kolkata" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tax & Service Charge</CardTitle><CardDescription>Applied automatically to every order</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>GST / Tax Rate (%)</Label><Input type="number" step="0.01" min="0" value={profile.tax_rate ?? ""} onChange={set("tax_rate")} /></div>
                <div className="space-y-1.5"><Label>Service Charge (%)</Label><Input type="number" step="0.01" min="0" value={profile.service_charge_rate ?? ""} onChange={set("service_charge_rate")} /></div>
              </div>
              <Button onClick={saveCharges} disabled={updateRestaurant.isPending} className="w-full sm:w-auto">
                {updateRestaurant.isPending ? "Saving…" : "Save Billing Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>My Profile</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {(me?.full_name ?? "?")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{me?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{me?.email}</p>
                  <Badge variant="outline" className="text-xs mt-0.5">{ROLE_LABELS[me?.role ?? ""] ?? me?.role}</Badge>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={myName} onChange={(e) => setMyName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone Number</Label><Input value={myPhone} onChange={(e) => setMyPhone(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={me?.email ?? ""} disabled className="bg-muted text-muted-foreground" /></div>
              <Button onClick={saveMyProfile} disabled={updateMe.isPending} className="w-full sm:w-auto">
                {updateMe.isPending ? "Saving…" : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Current Password</Label><Input type="password" value={passwords.old} onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>New Password</Label><Input type="password" value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} placeholder="Min 8 characters" /></div>
                <div className="space-y-1.5"><Label>Confirm New</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} /></div>
              </div>
              <Button variant="outline" onClick={savePassword} disabled={changePassword.isPending} className="w-full sm:w-auto">
                {changePassword.isPending ? "Updating…" : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
