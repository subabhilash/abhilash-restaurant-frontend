"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, X, Loader2 } from "lucide-react";
import { usePublicMenu } from "@/hooks/use-menu";
import { orderService } from "@/services/order.service";
import { waiterService } from "@/services/waiter.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helpers";
import { cn } from "@/utils/helpers";
import type { PublicMenuItem } from "@/types/menu.types";

interface CartEntry { item: PublicMenuItem; quantity: number; special_instructions: string; }

export default function PublicOrderPage() {
  const { slug, qrToken } = useParams<{ slug: string; qrToken: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = usePublicMenu(slug);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [activeCat, setActiveCat] = useState<number>(0);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (isError || !data) return <div className="flex h-screen items-center justify-center text-center p-6"><div><p className="text-xl font-bold">Invalid QR Code</p><p className="text-muted-foreground mt-1">This QR code may be expired.</p></div></div>;

  const categories = data.menu.filter((c) => c.items.length > 0);
  const displayCatId = activeCat || categories[0]?.id;
  const displayItems = categories.find((c) => c.id === displayCatId)?.items ?? [];
  const taxRate = data.restaurant.tax_rate / 100;
  const subtotal = cart.reduce((s, e) => s + e.item.price * e.quantity, 0);
  const total = subtotal * (1 + taxRate);
  const itemCount = cart.reduce((s, e) => s + e.quantity, 0);

  function getQty(itemId: number) { return cart.find((e) => e.item.id === itemId)?.quantity ?? 0; }

  function addToCart(item: PublicMenuItem) {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id);
      if (existing) return prev.map((e) => e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e);
      return [...prev, { item, quantity: 1, special_instructions: "" }];
    });
  }

  function removeFromCart(itemId: number) {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((e) => e.item.id !== itemId);
      return prev.map((e) => e.item.id === itemId ? { ...e, quantity: e.quantity - 1 } : e);
    });
  }

  async function placeOrder() {
    if (!cart.length) { toast.error("Add items to your order"); return; }
    setPlacing(true);
    try {
      const result = await orderService.publicCreate(slug, qrToken, {
        customer_name: customerName,
        special_instructions: specialInstructions,
        items: cart.map((e) => ({ menu_item_id: e.item.id, quantity: e.quantity, special_instructions: e.special_instructions })),
      }) as { id: number };
      setCart([]);
      toast.success("Order placed!");
      router.push(`/order/track/${result.id}`);
    } catch { toast.error("Failed to place order. QR code may be invalid."); }
    finally { setPlacing(false); }
  }

  async function callWaiter() {
    setCallingWaiter(true);
    try {
      await waiterService.publicCall(slug, qrToken);
      toast.success("Waiter called");
    } catch {
      toast.error("Failed to call waiter");
    } finally {
      setCallingWaiter(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div><h1 className="font-bold text-lg">{data.restaurant.name}</h1><p className="text-xs text-muted-foreground">Tap items to order</p></div>
          <div className="flex items-center gap-2">
            <button onClick={callWaiter} disabled={callingWaiter} className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50">
              {callingWaiter ? "Calling…" : "Call Waiter"}
            </button>
            <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white font-medium text-sm">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">{itemCount}</span>}
              {formatCurrency(total, data.restaurant.currency)}
            </button>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors", displayCatId === cat.id ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {displayItems.map((item) => {
          const qty = getQty(item.id);
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{item.name}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                {item.dietary_tags.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{item.dietary_tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>}
                <p className="font-bold text-primary mt-1">{formatCurrency(item.price, data.restaurant.currency)}</p>
              </div>
              <div className="flex-shrink-0">
                {qty > 0 ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.id)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-5 text-center font-bold">{qty}</span>
                    <button onClick={() => addToCart(item)} className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} className="rounded-xl bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90">Add</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowCart(false)}>
          <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Your Order</h2><button onClick={() => setShowCart(false)}><X className="h-5 w-5" /></button></div>
            {cart.length === 0 ? <p className="text-center py-8 text-muted-foreground">Cart is empty</p> : (
              <div className="space-y-3">
                {cart.map((entry) => (
                  <div key={entry.item.id} className="flex items-start justify-between gap-3 pb-3 border-b">
                    <div className="flex-1"><p className="font-medium">{entry.item.name}</p><p className="text-sm text-muted-foreground">{formatCurrency(entry.item.price)} each</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(entry.item.id)} className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                      <span className="w-5 text-center font-bold text-sm">{entry.quantity}</span>
                      <button onClick={() => addToCart(entry.item)} className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                      <span className="w-16 text-right font-medium text-sm">{formatCurrency(entry.item.price * entry.quantity)}</span>
                    </div>
                  </div>
                ))}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax ({data.restaurant.tax_rate}%)</span><span>{formatCurrency(subtotal * taxRate)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                <div className="space-y-1.5"><Label>Your Name</Label><Input placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
                <Button className="w-full h-12 text-base font-bold" onClick={placeOrder} disabled={placing}>
                  {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place Order · ${formatCurrency(total)}`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
