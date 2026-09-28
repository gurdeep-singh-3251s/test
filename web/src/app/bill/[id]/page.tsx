"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QrBill } from "@/components/qr-bill";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function BillPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Bill not found"));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto w-[min(560px,calc(100%-2rem))] py-24 text-center">
        <h1 className="text-5xl">This bill walked out.</h1>
        <p className="mt-3 text-muted">{error}</p>
      </div>
    );
  }

  if (!order) {
    return <p className="py-24 text-center text-muted">Opening bill…</p>;
  }

  return (
    <article className="mx-auto my-12 w-[min(560px,calc(100%-2rem))] rounded-[28px] border border-line bg-white p-8 shadow-[0_20px_60px_rgba(18,17,15,0.08)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
        BMS Fashionz · {order.channel === "store" ? "Walk-in bill" : "Jalandhar"}
      </p>
      <h1 className="mt-2 font-serif text-5xl">Bill</h1>
      <p className="mt-2 text-sm text-muted">
        {order.id} · {order.status.replaceAll("_", " ")}
        {order.tracking ? ` · ${order.tracking}` : ""}
        {order.cashierName ? ` · billed by ${order.cashierName}` : ""}
      </p>
      <div className="mt-6 border-y border-line py-4 text-sm">
        <p>{order.name}</p>
        <p className="text-muted">
          {order.address}, {order.city} {order.pincode}
          {order.country ? `, ${order.country}` : ""}
        </p>
        <p className="text-muted">{order.phone}</p>
      </div>
      <ul className="mt-5 grid gap-3 text-sm">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
            <span>
              {item.name}
              {item.size ? ` · ${item.size}` : ""} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {order.shippingFee ? (
        <p className="mt-4 flex justify-between text-sm text-muted">
          <span>{order.shipping === "international" ? "Worldwide shipping" : "Shipping"}</span>
          <span>{formatPrice(order.shippingFee)}</span>
        </p>
      ) : null}
      <p className="mt-5 flex justify-between font-serif text-3xl">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </p>
      <div className="mt-8">
        <QrBill orderId={order.id} size={180} />
      </div>
    </article>
  );
}
