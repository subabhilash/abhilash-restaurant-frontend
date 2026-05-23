"use client";

import Link from "next/link";
import {
  Building2, Users, ShoppingCart, TrendingUp,
  CheckCircle2, Clock, ArrowRight, Plus, UtensilsCrossed,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useMyRestaurant, usePlatformAnalytics, useRestaurantAnalytics, useAllRestaurants } from "@/hooks/use-restaurant";
import { useOrders } from "@/hooks/use-orders";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { OrderStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, timeAgo } from "@/utils/helpers";
import { SUBSCRIPTION_COLORS, SUBSCRIPTION_STATUS_COLORS } from "@/utils/constants";

// ── Super Admin Dashboard ──────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const { data: analytics, isLoading } = usePlatformAnalytics();
  const { data: restaurantsData } = useAllRestaurants({ page_size: "100" });
  const restaurants = restaurantsData?.results ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Admizo Restaurant OS — all tenants at a glance"
        action={
          <Link href="/admin/restaurants">
            <Button><Building2 className="h-4 w-4" />Manage Restaurants</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Restaurants"  value={analytics?.total_restaurants ?? 0}    icon={Building2}    loading={isLoading} iconColor="text-blue-500" description={`${analytics?.inactive_restaurants ?? 0} inactive`} />
        <StatCard title="Active Restaurants" value={analytics?.active_restaurants ?? 0}   icon={CheckCircle2} loading={isLoading} iconColor="text-green-500" />
        <StatCard title="Today's Orders"     value={analytics?.today_orders ?? 0}         icon={Users}        loading={isLoading} iconColor="text-purple-500" description={`${analytics?.total_orders ?? 0} all time`} />
        <StatCard title="Today's Revenue"    value={formatCurrency(analytics?.today_revenue ?? 0)} icon={TrendingUp} loading={isLoading} iconColor="text-amber-500" description={`${formatCurrency(analytics?.total_revenue ?? 0)} total`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Subscription Plans</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-3">
                {(["free", "starter", "professional", "enterprise"] as const).map((plan) => {
                  const count = analytics?.subscription_plans?.[plan] ?? 0;
                  const total = analytics?.total_restaurants ?? 1;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SUBSCRIPTION_COLORS[plan]}`}>{plan}</span>
                        <span className="text-sm font-bold">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent restaurants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent Restaurants</CardTitle>
            <Link href="/admin/restaurants"><Button variant="ghost" size="sm" className="text-primary text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            {restaurants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No restaurants registered yet</p>
            ) : (
              <div className="space-y-1">
                {[...restaurants].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6).map((r) => (
                  <Link key={r.id} href={`/admin/restaurants/${r.id}`}>
                    <div className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                          {r.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.city || "—"} · {r.staff_count} staff</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${SUBSCRIPTION_COLORS[r.subscription_plan]}`}>{r.subscription_plan}</span>
                        <Badge variant={r.is_active ? "success" : "secondary"} className="text-xs">{r.is_active ? "Active" : "Off"}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Restaurant Admin Dashboard ────────────────────────────────────────────────
function RestaurantAdminDashboard() {
  const { user } = useAuthStore();
  const { data: restaurant } = useMyRestaurant();
  const { data: analytics } = useRestaurantAnalytics();
  const { data: recentData, isLoading } = useOrders({ page_size: "8" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] ?? ""}!`}
        description={restaurant?.name ?? "Loading…"}
        action={
          <div className="flex gap-2">
            <Link href="/admin/menu"><Button variant="outline"><UtensilsCrossed className="h-4 w-4" />Menu</Button></Link>
            <Link href="/admin/orders"><Button><Plus className="h-4 w-4" />New Order</Button></Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={analytics?.today_orders ?? 0}
          icon={ShoppingCart}
          loading={!analytics}
          iconColor="text-blue-500"
          description={`${analytics?.total_orders ?? 0} all time`}
        />
        <StatCard
          title="Open Orders"
          value={analytics?.open_orders ?? 0}
          icon={Clock}
          loading={!analytics}
          iconColor="text-orange-500"
          description="needs attention"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(analytics?.today_revenue ?? 0, restaurant?.currency || "INR")}
          icon={TrendingUp}
          loading={!analytics}
          iconColor="text-green-500"
          description={`${formatCurrency(analytics?.total_revenue ?? 0, restaurant?.currency || "INR")} total`}
        />
        <StatCard
          title="Active Staff"
          value={analytics?.staff_count ?? 0}
          icon={Users}
          loading={!analytics}
          iconColor="text-purple-500"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Link href="/admin/orders"><Button variant="ghost" size="sm" className="text-primary text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button></Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : (recentData?.results ?? []).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {(recentData?.results ?? []).map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold">#{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.table_number ? `Table ${o.table_number}` : o.order_type.replace("_", " ")}
                        {" · "}{o.item_count} item{o.item_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(o.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  return user?.role === "super_admin" ? <SuperAdminDashboard /> : <RestaurantAdminDashboard />;
}
