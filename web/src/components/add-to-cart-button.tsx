"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  size,
  compact = false,
}: {
  product: Product;
  size?: string;
  compact?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      className={
        compact
          ? "rounded-full border border-ink px-3 py-1.5 text-xs uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory"
          : "rounded-full bg-ink px-6 py-3 text-sm text-ivory hover:bg-gold hover:text-ink"
      }
      onClick={() => {
        add(product, size);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? "Added" : compact ? "Add" : "Add to bag"}
    </button>
  );
}
