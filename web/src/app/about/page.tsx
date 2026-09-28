import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="mx-auto grid w-[min(1100px,calc(100%-2rem))] gap-12 py-16 md:grid-cols-2 md:items-center">
      <div className="relative min-h-[32rem] overflow-hidden rounded-3xl">
        <Image
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1400&q=80"
          alt="Inside BMS Fashionz"
          fill
          className="object-cover"
        />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Our story</p>
        <h1 className="mt-3 text-6xl leading-[0.95]">Taste first. Price honest.</h1>
        <p className="mt-6 text-muted">
          BMS Fashionz is the clothing store you walk into when you want a full look — not just one
          item. Pair a crisp shirt with tailored pants, lock it with a belt, finish with shoes and a
          signature perfume.
        </p>
        <p className="mt-4 text-muted">
          Four shops sit on the same stretch — Kishanpura Chowk to Lamba Pind Chowk Road. Shop 8
          women, Shop 9 kids, Shop 10 and 11 for everyone. The catalog online is the same rack.
        </p>
        <p className="mt-4 text-muted">
          You can shop online, staff can make bills in the store, and the owner can see stock, staff
          and money for all four shops. We also ship worldwide.
        </p>
      </div>
    </div>
  );
}
