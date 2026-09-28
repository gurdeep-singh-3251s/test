"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, type StoreCard } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";

type Desk = { id: string; name: string; email: string; storeName?: string; storeId?: string };

export default function AdminHomePage() {
  const [stores, setStores] = useState<StoreCard[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [error, setError] = useState("");

  function refresh() {
    void adminApi
      .stores()
      .then(setStores)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load shops"));
    void adminApi.desks().then(setDesks).catch(() => setDesks([]));
  }

  useEffect(() => {
    refresh();
  }, []);

  const earned = stores.reduce((sum, store) => sum + store.earned, 0);
  const spent = stores.reduce((sum, store) => sum + store.spent, 0);
  const profit = earned - spent;

  return (
    <div className="mx-auto w-full max-w-6xl p-5 md:p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">All shops</p>
      <h1 className="mt-1 text-3xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">See money, orders and staff for all four shops on Kishanpura Road.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="dash-card dash-kpi p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Money in</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPrice(earned)}</p>
          <p className="mt-1 text-sm text-slate-500">Sales this month</p>
        </article>
        <article className="dash-card dash-kpi kpi-amber p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Money out</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPrice(spent)}</p>
          <p className="mt-1 text-sm text-slate-500">Stock, staff and bills</p>
        </article>
        <article className={`dash-card dash-kpi p-5 ${profit >= 0 ? "kpi-blue" : "kpi-rose"}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Left over</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPrice(profit)}</p>
          <p className="mt-1 text-sm text-slate-500">In minus out</p>
        </article>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Open a shop</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {stores.map((store) => (
          <Link key={store.id} href={`/admin/${store.slug}`} className="dash-card p-5 transition hover:border-teal-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-teal-700">
                  Shop {store.address.match(/\d+/)?.[0] ?? ""} · {store.focus === "All" ? "Everyone" : store.focus}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{store.name.replace("BMS Fashionz ", "")}</h3>
                <p className="mt-1 text-sm text-slate-500">{store.address}</p>
                <p className="text-sm text-slate-500">Manager: {store.manager}</p>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">Open</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">Money in</dt>
                <dd className="font-semibold text-slate-900">{formatPrice(store.earned)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">Money out</dt>
                <dd className="font-semibold text-slate-900">{formatPrice(store.spent)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">New / regular</dt>
                <dd className="font-semibold text-slate-900">
                  {store.newCustomers} / {store.regularCustomers}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">Open orders</dt>
                <dd className="font-semibold text-slate-900">{store.openOrders}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <section className="dash-card mt-8 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Staff logins</h2>
        <p className="mt-1 text-sm text-slate-500">Give a staff person a login so they can make bills in one shop only.</p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-5"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void adminApi
              .createDesk({
                name: String(form.get("name")),
                email: String(form.get("email")),
                password: String(form.get("password")),
                storeId: String(form.get("storeId")),
              })
              .then(() => {
                event.currentTarget.reset();
                refresh();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "Could not add staff login"));
          }}
        >
          <input name="name" required placeholder="Name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="password" minLength={6} required placeholder="Password" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <select name="storeId" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name.replace("BMS Fashionz ", "")}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Add staff</button>
        </form>
        <div className="mt-4 divide-y divide-slate-100 text-sm">
          {desks.map((desk) => (
            <p key={desk.id} className="flex flex-wrap justify-between gap-2 py-2 text-slate-600">
              <span className="font-medium text-slate-900">{desk.name}</span>
              <span>{desk.email}</span>
              <span>{desk.storeName?.replace("BMS Fashionz ", "") ?? desk.storeId}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
