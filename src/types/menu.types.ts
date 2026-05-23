export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  item_count: number;
  created_at: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  display_order: number;
  is_available: boolean;
  preparation_time_minutes: number;
  calories: number | null;
  allergens: string[];
  dietary_tags: string[];
  created_at: string;
}

export interface PublicMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  preparation_time_minutes: number;
  calories: number | null;
  allergens: string[];
  dietary_tags: string[];
}

export interface PublicCategory {
  id: number;
  name: string;
  description: string;
  display_order: number;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  restaurant: { id: number; name: string; currency: string; tax_rate: number };
  menu: PublicCategory[];
}
