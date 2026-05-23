export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-gray-100 text-gray-600",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-800",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  kitchen: "Kitchen Staff",
  waiter: "Waiter",
};

export const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
  kitchen: "/kitchen/dashboard",
  waiter: "/waiter",
};

export const SUBSCRIPTION_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

export const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  trial: "bg-sky-100 text-sky-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-orange-100 text-orange-700",
};
