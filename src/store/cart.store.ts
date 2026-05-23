"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartEntry {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

interface CartStore {
  items: CartEntry[];
  restaurantSlug: string | null;
  qrToken: string | null;
  setContext: (slug: string, qrToken: string) => void;
  addItem: (itemId: number, name: string, price: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantSlug: null,
      qrToken: null,

      setContext: (slug, qrToken) => set({ restaurantSlug: slug, qrToken }),

      addItem(itemId, name, price) {
        set((s) => {
          const existing = s.items.find((e) => e.itemId === itemId);
          if (existing) return { items: s.items.map((e) => e.itemId === itemId ? { ...e, quantity: e.quantity + 1 } : e) };
          return { items: [...s.items, { itemId, name, price, quantity: 1, specialInstructions: "" }] };
        });
      },

      removeItem(itemId) {
        set((s) => {
          const existing = s.items.find((e) => e.itemId === itemId);
          if (!existing) return s;
          if (existing.quantity <= 1) return { items: s.items.filter((e) => e.itemId !== itemId) };
          return { items: s.items.map((e) => e.itemId === itemId ? { ...e, quantity: e.quantity - 1 } : e) };
        });
      },

      updateQuantity(itemId, qty) {
        if (qty <= 0) { get().removeItem(itemId); return; }
        set((s) => ({ items: s.items.map((e) => e.itemId === itemId ? { ...e, quantity: qty } : e) }));
      },

      clearCart: () => set({ items: [] }),

      subtotal() { return get().items.reduce((s, e) => s + e.price * e.quantity, 0); },
      itemCount() { return get().items.reduce((s, e) => s + e.quantity, 0); },
    }),
    { name: "cart-storage" },
  ),
);
