"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  image?: string;
  qty: number;
};

interface CartCtx {
  items: CartItem[];
  count: number;
  totalQty: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  justAdded: string | null;
}

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart لازم يشتغل جوه CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bishoy-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("bishoy-cart", JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((x) => x.id === item.id);
      if (found) return prev.map((x) => x.id === item.id ? { ...x, qty: x.qty + qty } : x);
      return [...prev, { ...item, qty }];
    });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded((cur) => cur === item.id ? null : cur), 1500);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev
      .map((x) => x.id === id ? { ...x, qty: Math.max(1, Math.min(999, qty)) } : x)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <Ctx.Provider value={{
      items,
      count: items.length,
      totalQty: items.reduce((s, x) => s + x.qty, 0),
      total: items.reduce((s, x) => s + x.qty * x.price, 0),
      add, remove, setQty, clear, justAdded,
    }}>
      {children}
    </Ctx.Provider>
  );
}