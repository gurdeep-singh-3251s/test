import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/api";

type ShopPageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category = "all", q } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ category: category === "all" ? undefined : category, q }),
  ]).catch(() => [[], []] as const);

  const filters = [{ slug: "all", name: "All" }, ...categories];

  return (
    <div className="mx-auto w-[min(1200px,calc(100%-2rem))] py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Shop</p>
      <h1 className="mt-2 text-6xl">The collection</h1>
      <p className="mt-3 max-w-xl text-muted">
        The same pieces as the four shops on Kishanpura Road. Ships in India, and worldwide if you need it.
      </p>

      <form
        action="/shop"
        className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        {category && category !== "all" ? (
          <input type="hidden" name="category" value={category} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.slug}
              href={filter.slug === "all" ? "/shop" : `/shop?category=${filter.slug}`}
              className={`rounded-full px-4 py-2 text-sm ${
                (category || "all") === filter.slug
                  ? "bg-ink text-ivory"
                  : "border border-line bg-white"
              }`}
            >
              {filter.name}
            </Link>
          ))}
        </div>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search the rack..."
          className="rounded-full border border-line bg-white px-4 py-2 md:w-72"
        />
      </form>

      <p className="mt-6 text-sm text-muted">{products.length} pieces</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
