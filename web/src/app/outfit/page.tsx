"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { buildingLines, occasions, type OccasionId } from "@/lib/outfit";
import type { Product } from "@/lib/types";

type Pick = { product: Product; size: string };

export default function OutfitPage() {
  const { add } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [occasion, setOccasion] = useState<OccasionId | null>(null);
  const [phase, setPhase] = useState<"pick" | "build" | "steps" | "done">("pick");
  const [line, setLine] = useState(0);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, Pick | null>>({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    void getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const plan = occasions.find((row) => row.id === occasion);

  useEffect(() => {
    if (phase !== "build") return;
    const tick = window.setInterval(() => setLine((value) => (value + 1) % buildingLines.length), 420);
    const done = window.setTimeout(() => {
      setPhase("steps");
      setStep(0);
    }, 2600);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [phase]);

  const current = plan?.steps[step];
  const options = useMemo(() => {
    if (!current) return [];
    return current.productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, [current, products]);

  const chosen = Object.values(picks).filter((row): row is Pick => Boolean(row));
  const total = chosen.reduce((sum, row) => sum + row.product.price, 0);

  function start(id: OccasionId) {
    setOccasion(id);
    setPicks({});
    setAdded(false);
    setLine(0);
    setPhase("build");
  }

  function choose(product: Product, size: string) {
    if (!current || !plan) return;
    const nextPicks = { ...picks, [current.key]: { product, size } };
    setPicks(nextPicks);
    if (step + 1 >= plan.steps.length) setPhase("done");
    else setStep(step + 1);
  }

  function skip() {
    if (!current || !plan) return;
    setPicks((value) => ({ ...value, [current.key]: null }));
    if (step + 1 >= plan.steps.length) setPhase("done");
    else setStep(step + 1);
  }

  function addPackage() {
    chosen.forEach((row) => add(row.product, row.size));
    setAdded(true);
  }

  return (
    <div className="mx-auto w-[min(1040px,calc(100%-2rem))] py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Not sure what to buy?</p>
      <h1 className="mt-2 text-5xl md:text-6xl">Tell us the plan. We build the look.</h1>
      <p className="mt-3 max-w-xl text-muted">
        Pick the occasion. We shortlist pieces, you choose one by one, and we make a full outfit you can add to the bag.
      </p>

      {phase === "pick" ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {occasions.map((row) => (
            <button
              key={row.id}
              onClick={() => start(row.id)}
              className="rounded-2xl border border-line bg-white p-6 text-left transition hover:border-gold"
            >
              <h2 className="font-serif text-3xl">{row.name}</h2>
              <p className="mt-2 text-sm text-muted">{row.line}</p>
            </button>
          ))}
        </div>
      ) : null}

      {phase === "build" ? (
        <div className="outfit-build mt-16 grid place-items-center rounded-3xl border border-line bg-ink px-6 py-20 text-center text-ivory">
          <div className="outfit-ring" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Making your choices</p>
          <h2 className="mt-3 font-serif text-4xl">{plan?.name} look</h2>
          <p className="mt-4 text-lg text-ivory/70">{buildingLines[line]}…</p>
        </div>
      ) : null}

      {phase === "steps" && plan && current ? (
        <div className="mt-10">
          <div className="mb-6 flex flex-wrap gap-2">
            {plan.steps.map((row, index) => (
              <span
                key={row.key}
                className={`rounded-full px-3 py-1 text-xs ${
                  index === step ? "bg-ink text-ivory" : index < step ? "bg-gold text-ink" : "border border-line bg-white text-muted"
                }`}
              >
                {index + 1}. {row.title}
              </span>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Step {step + 1} of {plan.steps.length}
          </p>
          <h2 className="mt-2 text-4xl">{current.title}</h2>
          <p className="mt-2 text-muted">{current.hint}</p>
          {options.length === 0 ? <p className="mt-6 text-muted">Loading pieces…</p> : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="relative aspect-[4/5]">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="grid gap-3 p-4">
                  <div>
                    <h3 className="font-serif text-2xl">{product.name}</h3>
                    <p className="text-sm text-muted">{formatPrice(product.price)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.slice(0, 5).map((size) => (
                      <button
                        key={size}
                        className="rounded-full border border-line px-3 py-1 text-sm hover:bg-ink hover:text-ivory"
                        onClick={() => choose(product, size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {step > 0 ? (
              <button className="text-sm text-muted underline" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : (
              <button className="text-sm text-muted underline" onClick={() => setPhase("pick")}>
                Change occasion
              </button>
            )}
            {current.optional ? (
              <button className="text-sm text-muted underline" onClick={skip}>
                Skip this step
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "done" && plan ? (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Your {plan.name.toLowerCase()} outfit</p>
          <h2 className="mt-2 text-5xl">Full look. Ready to wear.</h2>
          <p className="mt-2 text-muted">{chosen.length} pieces · {formatPrice(total)}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chosen.map((row) => (
              <article key={row.product.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="relative aspect-[4/5]">
                  <Image src={row.product.image} alt={row.product.name} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">{row.size}</p>
                  <h3 className="font-serif text-2xl">{row.product.name}</h3>
                  <p className="text-sm">{formatPrice(row.product.price)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-ink px-6 py-3 text-ivory" onClick={addPackage}>
              {added ? "Added to bag" : "Add full outfit to bag"}
            </button>
            {added ? (
              <Link href="/checkout" className="rounded-full bg-gold px-6 py-3 text-ink">
                Checkout
              </Link>
            ) : null}
            <button
              className="rounded-full border border-line px-6 py-3"
              onClick={() => {
                setPhase("pick");
                setOccasion(null);
                setPicks({});
                setAdded(false);
              }}
            >
              Start again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
