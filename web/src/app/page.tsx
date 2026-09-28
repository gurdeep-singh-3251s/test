import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

export default async function HomePage() {
  let categories: Category[] = [];
  let featured: Product[] = [];

  try {
    [categories, featured] = await Promise.all([
      getCategories(),
      getProducts({ featured: true }),
    ]);
  } catch {
    categories = [];
    featured = [];
  }

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden text-white">
        <Image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80"
          alt="BMS Fashionz editorial"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] w-[min(1200px,calc(100%-2rem))] items-center">
          <div className="max-w-xl">
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-gold">Kishanpura Road · Jalandhar</p>
            <h1 className="text-6xl leading-[0.9] md:text-8xl">Dress like you mean it.</h1>
            <p className="mt-6 max-w-md text-white/75">
              Women, kids and everyone — four shops on one road. Same pieces online. We also ship
              worldwide if you order from outside India.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-gold px-6 py-3 text-ink transition hover:brightness-105">
                Shop the collection
              </Link>
              <Link href="/outfit" className="rounded-full border border-white/40 px-6 py-3 transition hover:bg-white/10">
                Not sure what to buy?
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-ivory">
        <div className="mx-auto grid w-[min(1200px,calc(100%-2rem))] gap-6 py-10 md:grid-cols-4">
          {[
            ["Best prices", "Honest tags. No fake discounts."],
            ["Worldwide shipping", "Order from anywhere. We pack from Jalandhar."],
            ["QR bills", "Anyone scans. Anyone sees the bill."],
            ["Four shops", "Women, kids, and two for all."],
          ].map(([title, copy]) => (
            <article key={title}>
              <h2 className="text-2xl">{title}</h2>
              <p className="text-sm text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden border-b border-line bg-ink py-4 text-ivory">
        <div className="marquee-track flex w-max gap-12 text-sm uppercase tracking-[0.22em]">
          {Array.from({ length: 2 }).flatMap((_, copy) =>
            ["Toronto", "Southall", "Brampton", "Dubai", "Melbourne", "Jalandhar", "New Jersey", "Birmingham"].map(
              (city) => (
                <span key={`${city}-${copy}`} className="text-gold">
                  Ships to {city}
                </span>
              ),
            ),
          )}
        </div>
      </section>

      <section className="mx-auto w-[min(1200px,calc(100%-2rem))] py-20">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Shop by mood</p>
        <h2 className="mt-2 max-w-xl text-5xl">Everything you need to look expensive.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {categories.length === 0 ? (
            <p className="text-muted md:col-span-3">
              Start the Node API and push the Neon schema to load the collection.
            </p>
          ) : null}
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative min-h-72 overflow-hidden rounded-2xl text-white"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <h3 className="text-3xl">{category.name}</h3>
                <p className="text-sm text-white/70">{category.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1200px,calc(100%-2rem))] pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Staff picks</p>
            <h2 className="text-5xl">This week’s best outfits</h2>
          </div>
          <Link href="/shop" className="text-gold">
            See all pieces →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
