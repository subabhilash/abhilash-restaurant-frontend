export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type OrderType = "dine_in" | "takeout" | "delivery";
export type PaymentStatus = "unpaid" | "paid" | "partially_paid" | "refunded";

export interface Table {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  is_active: boolean;
  qr_token: string;
  qr_url: string;
  location_description: string;
  occupied_since: string | null;
  last_freed_at: string | null;
  created_at: string;
}

export interface TableQRCode {
  id: number;
  restaurant_id: number;
  table_id: number;
  qr_id: string;
  qr_token: string;
  qr_url: string;
  status: "active" | "disabled" | "rotated" | "expired";
  created_by: number | null;
  created_by_role: string;
  rotated_at: string | null;
  last_scanned_at: string | null;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string;
}

export interface Order {
  id: number;
  restaurant_id: number;
  order_number: string;
  table_id: number | null;
  table_number: string | null;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  special_instructions: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderListItem {
  id: number;
  restaurant_id: number;
  order_number: string;
  table_number: string | null;
  customer_name: string;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  item_count: number;
  created_at: string;
}

export interface CartItem {
  menuItem: PublicMenuItemCart;
  quantity: number;
  specialInstructions: string;
}

export interface PublicMenuItemCart {
  id: number;
  name: string;
  price: number;
  is_available: boolean;
}

export interface PublicOrderTrackResponse {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  created_at: string;
}
