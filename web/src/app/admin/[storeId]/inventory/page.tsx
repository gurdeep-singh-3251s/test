"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Field, Metric, Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { adminApi, type StockBoard, type StockItem } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";

export default function InventoryPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [board, setBoard] = useState<StockBoard | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const next = await adminApi.stock(storeId);
      setBoard(next);
      setPicked((current) => current || next.items[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load stock");
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const rows = board?.items ?? [];
    if (filter === "low") return rows.filter((row) => row.status === "low" || row.status === "out");
    if (filter === "showroom" || filter === "godown") return rows.filter((row) => row.bin === filter);
    return rows;
  }, [board, filter]);

  const item = board?.items.find((row) => row.id === picked);
  const moves = (board?.moves ?? []).filter((row) => !item || row.itemId === item.id).slice(0, 12);

  async function receive(form: FormData, existing?: StockItem) {
    setBusy(true);
    try {
      await adminApi.receiveStock(storeId, {
        itemId: existing?.id,
        name: form.get("name") || existing?.name,
        sku: form.get("sku") || existing?.sku,
        category: form.get("category") || existing?.category,
        quantity: Number(form.get("quantity")),
        unitCost: Number(form.get("unitCost") || existing?.costPrice || 0),
        sellPrice: Number(form.get("sellPrice") || existing?.sellPrice || 0),
        supplier: form.get("supplier") || undefined,
        size: form.get("size") || existing?.size,
        color: form.get("color") || existing?.color,
        bin: form.get("bin") || existing?.bin,
        gstRate: Number(form.get("gstRate") || existing?.gstRate || 5),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not receive stock");
    } finally {
      setBusy(false);
    }
  }

  async function move(type: "out" | "damage" | "return" | "adjust", quantity: number, note: string) {
    if (!item) return;
    setBusy(true);
    try {
      await adminApi.moveStock(storeId, { itemId: item.id, type, quantity, note });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      setBusy(false);
    }
  }

  if (!board) return error ? <p className="text-rose-600">{error}</p> : <p className="text-slate-500">Loading stock room…</p>;

  return (
    <div className="grid gap-6">
      <PageHead
        title="Stock room"
        note="Every piece in the showroom and godown, GST, low stock, and in/out history."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Pieces on hand" value={board.kpis.pieces} hint={`${board.kpis.available} free to sell`} />
        <Metric label="Stock value" value={formatPrice(board.kpis.stockValue)} hint="At cost" />
        <Metric label="Low / over" value={board.kpis.low} tone="amber" hint={`${board.kpis.out} finished`} />
        <Metric label="Held + damaged" value={`${board.kpis.reserved} / ${board.kpis.damaged}`} tone="rose" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["low", "Need refill"],
          ["showroom", "Showroom"],
          ["godown", "Godown"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === id ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <Panel title="Receive stock">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void receive(form).then(() => event.currentTarget.reset());
          }}
        >
          <Field label="Item name"><input name="name" required className={inputClass} /></Field>
          <Field label="SKU"><input name="sku" className={inputClass} /></Field>
          <Field label="Category"><input name="category" placeholder="shirts / suits / kids" className={inputClass} /></Field>
          <Field label="Supplier"><input name="supplier" placeholder="Who sent the box" className={inputClass} /></Field>
          <Field label="Qty"><input name="quantity" type="number" required min={1} className={inputClass} /></Field>
          <Field label="Cost / piece"><input name="unitCost" type="number" className={inputClass} /></Field>
          <Field label="Sell price"><input name="sellPrice" type="number" className={inputClass} /></Field>
          <Field label="GST %">
            <select name="gstRate" defaultValue="5" className={inputClass}>
              <option value="5">5% clothes</option>
              <option value="12">12% higher price</option>
              <option value="18">18% perfume</option>
            </select>
          </Field>
          <Field label="Size"><input name="size" placeholder="M / 32 / 8" className={inputClass} /></Field>
          <Field label="Colour"><input name="color" className={inputClass} /></Field>
          <Field label="Where">
            <select name="bin" className={inputClass}>
              <option value="showroom">Showroom</option>
              <option value="godown">Godown</option>
            </select>
          </Field>
          <button disabled={busy} className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">
            Add to stock + open supplier bill
          </button>
        </form>
      </Panel>

      <Panel title="Items">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 font-medium">Where</th>
                <th className="pb-3 font-medium">Free / on hand</th>
                <th className="pb-3 font-medium">Cost → sell</th>
                <th className="pb-3 font-medium">GST</th>
                <th className="pb-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-t border-slate-100 ${picked === row.id ? "bg-teal-50/60" : ""}`}
                  onClick={() => setPicked(row.id)}
                >
                  <td className="py-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.sku} · {row.size} · {row.color} · {row.category}
                    </p>
                  </td>
                  <td className="py-3">
                    <Status value={row.bin} />
                    <div className="mt-1"><Status value={row.status} /></div>
                  </td>
                  <td className="py-3">
                    {row.available} / {row.quantity}
                    {row.reserved ? <p className="text-xs text-slate-500">{row.reserved} held</p> : null}
                    {row.damaged ? <p className="text-xs text-rose-600">{row.damaged} damaged</p> : null}
                  </td>
                  <td className="py-3">
                    <Money value={row.costPrice} /> → <Money value={row.sellPrice} />
                  </td>
                  <td className="py-3">
                    {row.gstRate}%
                    <p className="text-xs text-slate-500">HSN {row.hsn}</p>
                  </td>
                  <td className="py-3"><Money value={row.stockValue} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {item ? (
        <section className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <Panel title={`${item.name} actions`}>
            <p className="mb-3 text-sm text-slate-500">
              {item.bin} · {item.size} {item.color} · GST {item.gstRate}% · reorder at {item.reorderLevel}
            </p>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onClick={() => void move("out", 1, "Sold from counter")}>−1 sold</button>
              <button disabled={busy} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onClick={() => void adminApi.receiveStock(storeId, { itemId: item.id, quantity: 1 }).then(load)}>+1 received</button>
              <button disabled={busy} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700" onClick={() => void move("damage", 1, "Damaged")}>Mark damaged</button>
              <button disabled={busy} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onClick={() => void move("return", 1, "Customer return")}>Return +1</button>
            </div>
            <form
              className="mt-4 grid gap-3 md:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void receive(form, item).then(() => event.currentTarget.reset());
              }}
            >
              <Field label="Receive qty"><input name="quantity" type="number" min={1} defaultValue={6} className={inputClass} /></Field>
              <Field label="Supplier"><input name="supplier" defaultValue="Northweave" className={inputClass} /></Field>
              <Field label="Cost / piece"><input name="unitCost" type="number" defaultValue={item.costPrice} className={inputClass} /></Field>
              <button disabled={busy} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white md:col-span-3">
                Receive box + create stock bill with GST
              </button>
            </form>
          </Panel>
          <Panel title="In / out log">
            {moves.length === 0 ? <p className="text-sm text-slate-500">No moves yet.</p> : null}
            {moves.map((row) => (
              <div key={row.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                <div>
                  <p className="capitalize">{row.type} · {row.itemName}</p>
                  <p className="text-xs text-slate-500">{row.note} · {row.at.slice(0, 10)}</p>
                </div>
                <span className={row.type === "out" || row.type === "damage" ? "text-rose-700" : "text-teal-700"}>
                  {row.type === "out" || row.type === "damage" ? "−" : "+"}{row.quantity}
                </span>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}

      <Panel title="Need refill">
        {board.reorder.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing is low right now.</p>
        ) : (
          board.reorder.map((row) => (
            <div key={row.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
              <button className="text-left" onClick={() => setPicked(row.id)}>
                <p>{row.name}</p>
                <p className="text-xs text-slate-500">{row.available} left · refill at {row.reorderLevel}</p>
              </button>
              <Status value={row.status} />
            </div>
          ))
        )}
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
    </div>
  );
}
