export type SubscriptionPlan = "free" | "starter" | "professional" | "enterprise";
export type SubscriptionStatus = "trial" | "active" | "inactive" | "expired" | "cancelled";

export interface RestaurantSettings {
  allow_online_ordering: boolean;
  auto_accept_orders: boolean;
  kitchen_display_enabled: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  allow_online_ordering: boolean;
  auto_accept_orders: boolean;
  kitchen_display_enabled: boolean;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
  owner_id: number | null;
  owner_email: string | null;
  staff_count: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantStats {
  restaurant_id: number;
  restaurant_name: string;
  staff_count: number;
  total_orders: number;
  open_orders: number;
  total_revenue: number;
  subscription_plan: string;
  subscription_status: string;
  is_active: boolean;
}

export interface Subscription {
  id: number;
  restaurant_id: number;
  plan: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  notes: string;
  created_at: string;
}

export interface PlatformAnalytics {
  total_restaurants: number;
  active_restaurants: number;
  inactive_restaurants: number;
  total_users: number;
  total_orders: number;
  today_orders: number;
  total_revenue: number;
  today_revenue: number;
  subscription_plans: Record<string, number>;
  order_statuses: Record<string, number>;
  weekly_data: { date: string; day: string; orders: number; revenue: number }[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}
