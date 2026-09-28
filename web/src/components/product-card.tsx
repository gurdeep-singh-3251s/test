import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card-rise group overflow-hidden rounded-2xl border border-line bg-white">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-stone">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
        <span className="absolute inset-x-4 bottom-4 translate-y-3 rounded-full bg-ivory/90 py-2 text-center text-xs uppercase tracking-[0.18em] opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100">
          View piece
        </span>
      </Link>
      <div className="grid gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{product.category.name}</p>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="font-serif text-2xl leading-tight">{product.name}</h3>
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {formatPrice(product.price)}
            {product.compareAt ? (
              <span className="ml-2 text-muted line-through">{formatPrice(product.compareAt)}</span>
            ) : null}
          </p>
          <AddToCartButton product={product} size={product.sizes[0]} compact />
        </div>
      </div>
    </article>
  );
}
