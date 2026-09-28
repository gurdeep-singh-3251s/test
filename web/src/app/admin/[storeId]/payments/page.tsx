"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Metric, Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { adminApi, type MoneyBoard, type MoneyRow } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";

const FILTERS = [
  ["all", "All"],
  ["staff", "Staff"],
  ["supplier", "Stock bills"],
  ["shop", "Shop bills"],
  ["tax", "Tax"],
] as const;

export default function PaymentsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [data, setData] = useState<MoneyBoard | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await adminApi.money(storeId, "2026-09"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bills");
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const queue = data?.queue ?? [];
    if (filter === "all") return queue;
    if (filter === "shop") return queue.filter((row) => row.kind === "rent" || row.kind === "power" || row.kind === "other");
    return queue.filter((row) => row.kind === filter);
  }, [data, filter]);

  async function pay(row: MoneyRow) {
    setBusy(row.id);
    try {
      await adminApi.settle(storeId, {
        source: row.source,
        refId: row.refId,
        method,
        period: row.period,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setBusy("");
    }
  }

  if (!data) return error ? <p className="text-rose-600">{error}</p> : <p className="text-slate-500">Loading bills to pay…</p>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          title="Pay bills"
          note="One list for staff, stock, rent, power and GST — oldest due date first."
        />
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Pay by
          <select className={inputClass} value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Still to pay" value={formatPrice(data.kpis.toPay)} tone="rose" />
        <Metric label="Overdue" value={data.kpis.overdue} tone="rose" hint="Pay these first" />
        <Metric label="Staff still due" value={formatPrice(data.kpis.staffPay)} />
        <Metric label="Stock bills" value={formatPrice(data.kpis.stockBills)} tone="amber" />
      </div>

      <section className="dash-card p-5">
        <h2 className="text-base font-semibold text-slate-900">GST this month</h2>
        <p className="mt-1 text-sm text-slate-500">Tax you collected on sales, minus tax already paid on stock you bought.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Collected on sales</p>
            <p className="mt-1 font-semibold"><Money value={data.tax.collected} /></p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Already paid on stock</p>
            <p className="mt-1 font-semibold"><Money value={data.tax.inputCredit} /></p>
          </div>
          <div className="rounded-lg bg-teal-50 p-3">
            <p className="text-xs uppercase tracking-wide text-teal-800">Pay to government</p>
            <p className="mt-1 font-semibold text-teal-900"><Money value={data.tax.net} /></p>
            <p className="mt-1 text-xs text-slate-500">GST bill due 20 Oct · {formatPrice(data.kpis.taxDue)} in queue</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === id ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <Panel title={`Pay list · ${rows.length}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 font-medium">Due</th>
                <th className="pb-3 font-medium">Who / what</th>
                <th className="pb-3 font-medium">Bill</th>
                <th className="pb-3 font-medium">Tax</th>
                <th className="pb-3 font-medium">Pay this</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-3">
                    <p>{row.dueDate}</p>
                    <p className="text-xs text-slate-500">{dueLabel(row.days)}</p>
                    <Status value={row.status} />
                  </td>
                  <td className="py-3">
                    <p className="font-medium">{row.party}</p>
                    <p className="text-xs text-slate-500">{kindLabel(row.kind)} · {row.title}</p>
                    {row.invoiceNo ? <p className="text-xs text-slate-400">{row.invoiceNo}{row.gstin ? ` · GSTIN ${row.gstin}` : ""}</p> : null}
                  </td>
                  <td className="py-3"><Money value={row.amount} /></td>
                  <td className="py-3">{row.tax ? <Money value={row.tax} /> : "—"}</td>
                  <td className="py-3 font-semibold"><Money value={row.remaining} /></td>
                  <td className="py-3">
                    <button
                      disabled={Boolean(busy)}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      onClick={() => void pay(row)}
                    >
                      {busy === row.id ? "Paying…" : "Pay"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
    </div>
  );
}

function kindLabel(kind: string) {
  const map: Record<string, string> = {
    staff: "Staff pay",
    supplier: "Stock bill",
    rent: "Rent",
    power: "Power",
    tax: "GST",
    other: "Other bill",
  };
  return map[kind] ?? kind;
}

function dueLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} days late`;
  if (days === 0) return "Due today";
  return `In ${days} days`;
}
