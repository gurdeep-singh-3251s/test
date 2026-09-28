"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Metric, Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { adminApi, type StaffPayQueue, type StaffPayRow } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";

export default function PayStaffPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [month, setMonth] = useState("2026-09");
  const [data, setData] = useState<StaffPayQueue | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [method, setMethod] = useState("upi");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await adminApi.payQueue(storeId, month));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pay list");
    }
  }, [storeId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay(row: StaffPayRow) {
    setBusy(row.staffId);
    try {
      await adminApi.payStaff(storeId, {
        staffId: row.staffId,
        period: row.period,
        method,
        note: `Paid from Pay staff · ${row.dueDate}`,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setBusy("");
    }
  }

  if (!data) return error ? <p className="text-rose-600">{error}</p> : <p className="text-slate-500">Loading who to pay…</p>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          title="Pay staff"
          note="Who to pay first, by due date, and the exact amount still left."
        />
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Month
            <select className={inputClass} value={month} onChange={(event) => setMonth(event.target.value)}>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </label>
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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="People to pay" value={data.kpis.people} />
        <Metric label="Total still due" value={formatPrice(data.kpis.toPay)} tone="rose" />
        <Metric label="Overdue" value={data.kpis.overdue} tone="rose" />
        <Metric label="Due in 7 days" value={data.kpis.dueSoon} tone="amber" />
      </div>

      <p className="text-sm text-slate-500">
        Ranked by due date — overdue first, then the nearest date, then the biggest amount.{" "}
        <Link href={`/admin/${storeId}/staff`} className="text-teal-700">
          Open daily register
        </Link>
      </p>

      <Panel title="Who to pay">
        {data.queue.length === 0 ? (
          <p className="text-sm text-slate-500">No salary left to pay for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Person</th>
                  <th className="pb-3 font-medium">Due date</th>
                  <th className="pb-3 font-medium">Salary due</th>
                  <th className="pb-3 font-medium">Already given</th>
                  <th className="pb-3 font-medium">Pay this</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.queue.map((row, index) => (
                  <tr key={row.staffId} className="border-t border-slate-100">
                    <td className="py-3 text-slate-400">{index + 1}</td>
                    <td className="py-3">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.role} · {row.phone}</p>
                    </td>
                    <td className="py-3">
                      <p>{row.dueDate}</p>
                      <p className="text-xs text-slate-500">{dueLabel(row.days)}</p>
                      <Status value={row.status} />
                    </td>
                    <td className="py-3"><Money value={row.due} /></td>
                    <td className="py-3"><Money value={row.paid} /></td>
                    <td className="py-3 font-semibold text-teal-800"><Money value={row.remaining} /></td>
                    <td className="py-3">
                      <button
                        disabled={Boolean(busy)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        onClick={() => void pay(row)}
                      >
                        {busy === row.staffId ? "Paying…" : `Pay ${formatPrice(row.remaining)}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
    </div>
  );
}

function dueLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} days late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}
