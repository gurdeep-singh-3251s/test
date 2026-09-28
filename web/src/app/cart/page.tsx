"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, total, setQuantity, remove } = useCart();

  return (
    <div className="mx-auto w-[min(900px,calc(100%-2rem))] py-14">
      <h1 className="text-6xl">Your bag</h1>
      {items.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted">Nothing in here yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-gold">
            Continue shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          {items.map((item) => (
            <article
              key={`${item.productId}-${item.size}`}
              className="grid grid-cols-[88px_1fr_auto] gap-4 border-b border-line pb-5"
            >
              <div className="relative h-24 overflow-hidden rounded-xl">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="88px" />
              </div>
              <div>
                <h2 className="text-2xl">{item.name}</h2>
                <p className="text-sm text-muted">{item.size}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    className="h-8 w-8 rounded-full border border-line"
                    onClick={() => setQuantity(item.productId, item.size, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="h-8 w-8 rounded-full border border-line"
                    onClick={() => setQuantity(item.productId, item.size, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button className="text-sm text-muted" onClick={() => remove(item.productId, item.size)}>
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
            </article>
          ))}
          <div className="flex items-center justify-between">
            <p className="text-xl">Total {formatPrice(total)}</p>
            <Link href="/checkout" className="rounded-full bg-gold px-6 py-3 text-ink">
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
