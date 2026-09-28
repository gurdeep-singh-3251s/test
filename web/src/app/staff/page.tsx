"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { QrBill } from "@/components/qr-bill";
import { staffApi, type StaffCatalogItem, type StaffDesk } from "@/lib/staff-api";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

type Line = { productId: string; name: string; price: number; quantity: number; size: string };

export default function StaffBillingPage() {
  const [desk, setDesk] = useState<StaffDesk | null>(null);
  const [bills, setBills] = useState<Order[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [lastBill, setLastBill] = useState<Order | null>(null);

  useEffect(() => {
    void staffApi
      .desk()
      .then(setDesk)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not open billing"));
    void staffApi
      .bills()
      .then(setBills)
      .catch(() => setBills([]));
  }, []);

  const catalog = desk?.catalog ?? [];
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 8);
    return catalog
      .filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [catalog, query]);

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function addProduct(item: StaffCatalogItem, qty = 1, size?: string) {
    const chosen = size ?? item.sizes[0] ?? "";
    setLines((current) => {
      const existing = current.find((line) => line.productId === item.id && line.size === chosen);
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + qty } : line,
        );
      }
      return [...current, { productId: item.id, name: item.name, price: item.price, quantity: qty, size: chosen }];
    });
    setProductId("");
    setQuantity(1);
    setQuery("");
  }

  function addById() {
    const item = catalog.find((row) => row.id.toLowerCase() === productId.trim().toLowerCase());
    if (!item) {
      setError(`No product with id ${productId || "(empty)"}`);
      return;
    }
    setError("");
    addProduct(item, quantity);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lines.length === 0) {
      setError("Add product id + quantity first");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const bill = await staffApi.createBill({
        name: String(form.get("name")),
        phone: String(form.get("phone")),
        email: String(form.get("email") || ""),
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity, size: line.size })),
      });
      setLastBill(bill);
      setBills((current) => [bill, ...current]);
      setLines([]);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create bill");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-6 py-8 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#c4a574]">Store billing</p>
          <h1 className="mt-2 font-serif text-5xl">Create a bill.</h1>
          <p className="mt-2 text-white/50">
            {desk?.store?.name ?? "Your shop"} · add a product id and quantity. A QR code is made with the bill.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#181614] p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_90px_auto]">
            <label className="grid gap-1 text-xs text-white/50">
              Product id
              <input
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setQuery(event.target.value);
                }}
                placeholder="prod_ivory-oxford-shirt"
                className="rounded-lg border border-white/10 bg-[#0f0e0c] px-3 py-2 text-sm text-[#f6f1e8]"
              />
            </label>
            <label className="grid gap-1 text-xs text-white/50">
              Qty
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                className="rounded-lg border border-white/10 bg-[#0f0e0c] px-3 py-2 text-sm text-[#f6f1e8]"
              />
            </label>
            <button type="button" onClick={addById} className="self-end rounded-lg bg-[#c4a574] px-4 py-2 text-sm text-ink">
              Add line
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {matches.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addProduct(item)}
                className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span>
                  <span className="text-white/40">{item.id}</span>
                  <span className="mt-0.5 block">{item.name}</span>
                </span>
                <span className="text-[#c4a574]">{formatPrice(item.price)}</span>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-[#181614] p-5">
          <h2 className="font-serif text-2xl">Customer</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-white/50">
              Name
              <input name="name" required className="rounded-lg border border-white/10 bg-[#0f0e0c] px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1 text-xs text-white/50">
              Phone
              <input name="phone" required className="rounded-lg border border-white/10 bg-[#0f0e0c] px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1 text-xs text-white/50">
              Email optional
              <input name="email" type="email" className="rounded-lg border border-white/10 bg-[#0f0e0c] px-3 py-2 text-sm" />
            </label>
          </div>
          <ul className="mt-5 grid gap-2 text-sm">
            {lines.length === 0 ? <li className="text-white/40">No lines yet.</li> : null}
            {lines.map((line, index) => (
              <li key={`${line.productId}-${line.size}-${index}`} className="flex items-center justify-between gap-3">
                <span>
                  {line.name} · {line.size} × {line.quantity}
                  <span className="ml-2 text-white/35">{line.productId}</span>
                </span>
                <span className="flex items-center gap-3">
                  {formatPrice(line.price * line.quantity)}
                  <button
                    type="button"
                    className="text-white/40"
                    onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between">
            <p className="font-serif text-3xl">{formatPrice(total)}</p>
            <button disabled={pending} className="rounded-lg bg-[#c4a574] px-5 py-2 text-ink disabled:opacity-60">
              {pending ? "Saving…" : "Generate bill + QR"}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </form>
      </div>

      <aside className="grid gap-4">
        {lastBill ? (
          <section className="rounded-2xl border border-[#c4a574]/40 bg-[#181614] p-5 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">Bill ready</p>
            <p className="mt-2 font-serif text-2xl">{lastBill.id}</p>
            <p className="text-sm text-white/50">{formatPrice(lastBill.total)}</p>
            <div className="mt-4">
              <QrBill orderId={lastBill.id} size={160} />
            </div>
            <Link href={`/bill/${lastBill.id}`} className="mt-3 inline-block text-sm text-[#c4a574]">
              Open public bill
            </Link>
          </section>
        ) : null}
        <section className="rounded-2xl border border-white/10 bg-[#181614] p-5">
          <h2 className="font-serif text-2xl">Today’s bills</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {bills.length === 0 ? <p className="text-white/40">No walk-in bills yet.</p> : null}
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bill/${bill.id}`} className="border-b border-white/10 pb-3">
                <p>{bill.name}</p>
                <p className="text-white/40">
                  {bill.id} · {formatPrice(bill.total)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
