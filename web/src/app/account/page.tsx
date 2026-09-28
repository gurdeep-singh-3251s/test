"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API } from "@/lib/api-base";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function AccountPage() {
  const { user, token, ready, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user || user.role !== "customer" || !token) return;
    void fetch(`${API}/auth/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load orders");
        setOrders(body as Order[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [ready, user, token]);

  if (!ready) {
    return <p className="px-6 py-24 text-center text-muted">Loading account…</p>;
  }

  if (user?.role === "staff") {
    return (
      <div className="mx-auto w-[min(640px,calc(100%-2rem))] py-20">
        <h1 className="text-5xl">Staff make bills in the store.</h1>
        <Link href="/staff" className="mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-ivory">
          Open billing
        </Link>
      </div>
    );
  }

  if (user?.role === "owner") {
    return (
      <div className="mx-auto w-[min(640px,calc(100%-2rem))] py-20">
        <h1 className="text-5xl">Owners use admin.</h1>
        <Link href="/admin" className="mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-ivory">
          Open admin
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Account</p>
        <h1 className="mt-2 text-5xl">Sign in to see your orders.</h1>
        <p className="mt-3 text-muted">Your bills and QR codes stay here.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/login?next=/account" className="rounded-lg bg-ink px-5 py-2.5 text-ivory">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-lg border border-line px-5 py-2.5">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[min(980px,calc(100%-2rem))] py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">My account</p>
          <h1 className="mt-2 text-5xl">{user.name}</h1>
          <p className="text-muted">{user.email}</p>
        </div>
        <button
          className="rounded-lg border border-line px-4 py-2 text-sm"
          onClick={() => {
            void logout().then(() => router.replace("/login"));
          }}
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-line bg-white p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Orders</p>
          <p className="mt-2 font-serif text-4xl">{orders.length}</p>
        </article>
        <Link href="/shop" className="rounded-xl border border-line bg-white p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Shop</p>
          <p className="mt-2 font-serif text-2xl">Continue shopping</p>
        </Link>
      </div>

      {error ? <p className="mt-6 text-red-700">{error}</p> : null}

      <section className="mt-8 overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-serif text-2xl">Orders</h2>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Tap a bill to open the QR</span>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-8 text-muted">No orders yet. Shop and check out to see them here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone text-left text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Ship to</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-line">
                    <td className="px-5 py-3">
                      <Link href={`/bill/${order.id}`} className="text-gold">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3 capitalize">{order.status.replaceAll("_", " ")}</td>
                    <td className="px-5 py-3 text-muted">
                      {order.city}
                      {order.country ? `, ${order.country}` : ""}
                    </td>
                    <td className="px-5 py-3 text-right">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
