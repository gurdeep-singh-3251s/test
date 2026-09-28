"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "./types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, size?: string) => void;
  setQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  remove: (productId: string, size?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bms-fashionz-cart";

function sameLine(item: CartItem, productId: string, size?: string) {
  return item.productId === productId && item.size === size;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      count,
      total,
      add: (product, size) => {
        setItems((current) => {
          const existing = current.find((item) => sameLine(item, product.id, size));
          if (existing) {
            return current.map((item) =>
              sameLine(item, product.id, size)
                ? { ...item, quantity: Math.min(10, item.quantity + 1) }
                : item,
            );
          }
          return [
            ...current,
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.image,
              size,
              quantity: 1,
            },
          ];
        });
      },
      setQuantity: (productId, size, quantity) => {
        setItems((current) =>
          quantity <= 0
            ? current.filter((item) => !sameLine(item, productId, size))
            : current.map((item) =>
                sameLine(item, productId, size) ? { ...item, quantity } : item,
              ),
        );
      },
      remove: (productId, size) => {
        setItems((current) => current.filter((item) => !sameLine(item, productId, size)));
      },
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
