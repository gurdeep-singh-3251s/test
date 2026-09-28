"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Metric, PageHead } from "@/components/admin/ui";
import { adminApi, type Overview } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";

export default function StoreOverviewPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void adminApi
      .overview(storeId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load"));
  }, [storeId]);

  if (error) return <p className="text-rose-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading shop…</p>;

  const maxDay = Math.max(...data.patterns.bestDays.map((row) => row.amount), 1);

  return (
    <div className="grid gap-6">
      <PageHead
        title={data.store.name.replace("BMS Fashionz ", "Shop · ")}
        note={`${data.store.address} · Manager ${data.store.manager}`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="In shop now" value={data.floor?.inNow ?? 0} hint={data.floor?.now ? `As of ${data.floor.now}` : "Team"} />
        <Metric label="Money in" value={formatPrice(data.totals.earned)} hint="Shop + website sales" tone="teal" />
        <Metric label="Money out" value={formatPrice(data.totals.spent)} hint="Stock, staff, power" tone="amber" />
        <Metric
          label="Left over"
          value={formatPrice(data.totals.profit)}
          hint="In minus out"
          tone={data.totals.profit >= 0 ? "blue" : "rose"}
        />
      </div>

      {data.floor && data.floor.people.length > 0 ? (
        <section className="dash-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">In the shop now</h2>
            <Link href={`/admin/${storeId}/staff`} className="text-sm text-teal-700">
              Manage team
            </Link>
          </div>
          <ul className="mt-4 grid gap-2">
            {data.floor.people.map((person) => (
              <li key={person.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>
                  <Link href={`/admin/${storeId}/staff/${encodeURIComponent(person.id)}`} className="font-medium hover:text-teal-700">
                    {person.name}
                  </Link>
                  <span className="text-slate-500"> · {person.role}</span>
                </span>
                <span className="text-teal-800">
                  Came {person.cameAt}
                  {person.late ? ` · late ${person.lateMinutes} min` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Power bill" value={formatPrice(data.totals.electricity)} />
        <Metric label="Staff pay" value={formatPrice(data.totals.staffBill)} />
        <Metric label="Stock bought" value={formatPrice(data.totals.purchaseSpend)} />
        <Metric label="Extra costs" value={formatPrice(data.totals.extraSpend)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="New customers" value={data.totals.newCustomers} />
        <Metric label="Regular customers" value={data.totals.regularCustomers} />
        <Metric label="Come back again" value={`${data.patterns.repeatRate}%`} />
        <Metric label="Sold online" value={`${data.patterns.onlineShare}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="dash-card p-5">
          <h2 className="text-base font-semibold text-slate-900">What sells most</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {data.patterns.topItems.map((item) => (
              <li key={item.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{item.name}</span>
                <span className="font-medium text-teal-700">{item.units} sold</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="dash-card p-5">
          <h2 className="text-base font-semibold text-slate-900">Best days</h2>
          <div className="mt-4 grid gap-3">
            {data.patterns.bestDays.map((row) => (
              <div key={row.day}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.day}</span>
                  <span className="font-medium">{formatPrice(row.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.round((row.amount / maxDay) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Low stock" value={data.alerts.lowStock} hint="Need to order more" tone="rose" />
        <Metric label="Bills to pay" value={data.alerts.billsDue} tone="amber" />
        <Metric label="Boxes coming" value={data.alerts.inbound} />
        <Metric label="Reminders due" value={data.alerts.tasksDue} />
      </div>
    </div>
  );
}
