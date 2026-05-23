export type TicketStatus = "pending" | "in_progress" | "ready" | "delivered" | "cancelled";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface KitchenOrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  special_instructions: string;
}

export interface KitchenOrder {
  id: number;
  order_number: string;
  table_number: string | null;
  order_type: string;
  status: string;
  special_instructions: string;
  items: KitchenOrderItem[];
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  created_at: string;
  elapsed_seconds: number;
}

export interface KitchenTicket {
  id: number;
  order_id: number;
  order_number: string;
  table_number: string | null;
  station_id: number | null;
  station_name: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  notes: string;
  items: KitchenOrderItem[];
  started_at: string | null;
  completed_at: string | null;
  prep_time_seconds: number | null;
  created_at: string;
}

export interface KitchenStation {
  id: number;
  restaurant_id: number;
  name: string;
  display_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}
