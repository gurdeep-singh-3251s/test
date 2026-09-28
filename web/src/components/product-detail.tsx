"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(product.image);
  const gallery = product.gallery.length ? product.gallery : [product.image];

  return (
    <div className="mx-auto grid w-[min(1200px,calc(100%-2rem))] gap-10 py-14 md:grid-cols-2">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone">
          <Image src={active} alt={product.name} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {gallery.map((src) => (
            <button
              key={src}
              onClick={() => setActive(src)}
              className={`relative aspect-square overflow-hidden rounded-xl ${active === src ? "ring-2 ring-ink" : ""}`}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
      <div className="md:py-8">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">{product.category.name}</p>
        <h1 className="mt-3 text-6xl leading-[0.92]">{product.name}</h1>
        <p className="mt-5 text-xl">
          {formatPrice(product.price)}
          {product.compareAt ? (
            <span className="ml-3 text-base text-muted line-through">
              {formatPrice(product.compareAt)}
            </span>
          ) : null}
        </p>
        <p className="mt-6 max-w-md text-muted">{product.description}</p>
        <p className="mt-3 text-sm text-gold">India shipping free over ₹1,999 · worldwide from ₹2,499</p>
        <label className="mt-8 block text-sm">
          Size
          <select
            value={size}
            onChange={(event) => setSize(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3"
          >
            {product.sizes.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <button
          className="mt-6 rounded-full bg-ink px-8 py-4 text-ivory"
          onClick={() => {
            add(product, size);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1400);
          }}
        >
          {added ? "Added to bag" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
