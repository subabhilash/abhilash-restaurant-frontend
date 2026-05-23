"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingCart, Table2,
  Users, Settings, LogOut, Monitor, Tag, Building2, Globe,
  Crown, ClipboardList,
} from "lucide-react";
import { cn } from "@/utils/helpers";
import { ROLE_LABELS } from "@/utils/constants";
import { useAuthStore } from "@/store/auth.store";

// ── Super admin navigation ────────────────────────────────────────────────────
const SUPER_ADMIN_NAV = [
  { href: "/admin/dashboard",   label: "Platform Overview", icon: Globe },
  { href: "/admin/restaurants", label: "All Restaurants",   icon: Building2 },
];

// ── Restaurant admin + staff navigation ──────────────────────────────────────
const RESTAURANT_NAV = [
  { href: "/admin/dashboard",   label: "Dashboard",        icon: LayoutDashboard, roles: ["admin"] },
  { href: "/waiter",            label: "Waiter Station",   icon: ClipboardList,   roles: ["waiter"] },
  { href: "/admin/orders",      label: "Orders",           icon: ShoppingCart,    roles: ["admin", "waiter"] },
  { href: "/admin/menu",        label: "Menu Items",       icon: UtensilsCrossed, roles: ["admin"] },
  { href: "/admin/categories",  label: "Categories",       icon: Tag,             roles: ["admin"] },
  { href: "/admin/tables",      label: "Tables & QR",      icon: Table2,          roles: ["admin"] },
  { href: "/kitchen/dashboard", label: "Kitchen Display",  icon: Monitor,         roles: ["admin", "kitchen"] },
  { href: "/kitchen/stations",  label: "Stations",         icon: Tag,             roles: ["admin"] },
  { href: "/admin/staff",       label: "Staff",            icon: Users,           roles: ["admin"] },
  { href: "/admin/settings",    label: "Settings",         icon: Settings,        roles: ["admin"] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isSuperAdmin = user?.role === "super_admin";
  const navItems = isSuperAdmin
    ? SUPER_ADMIN_NAV
    : RESTAURANT_NAV.filter((n) => user && n.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-base">A</div>
        <div>
          <span className="font-bold text-gray-900 text-base">Admizo</span>
          <p className="text-xs text-gray-400 leading-none mt-0.5">Restaurant OS</p>
        </div>
      </div>

      {/* Super admin badge */}
      {isSuperAdmin && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <Crown className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-700">Platform Owner</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t p-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span className={cn(
            "inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium",
            isSuperAdmin ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary",
          )}>
            {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
