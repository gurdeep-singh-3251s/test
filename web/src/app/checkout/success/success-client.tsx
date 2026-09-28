"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QrBill } from "@/components/qr-bill";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export function SuccessClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    void getOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [id]);

  return (
    <div className="mx-auto grid w-[min(720px,calc(100%-2rem))] justify-items-center gap-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Order placed</p>
      <h1 className="text-6xl">You look expensive already.</h1>
      <p className="max-w-md text-muted">
        {order
          ? `${order.name} · ${formatPrice(order.total)}${order.shipping === "international" ? ` · ${order.country}` : ""}`
          : id
            ? `Order ${id}`
            : "Your bag is through."}
      </p>
      {id ? <QrBill orderId={id} /> : null}
      <p className="text-sm text-muted">Anyone who scans this QR sees the live bill.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {id ? (
          <Link href={`/bill/${id}`} className="rounded-full bg-ink px-6 py-3 text-ivory">
            Open bill
          </Link>
        ) : null}
        <Link href="/shop" className="rounded-full border border-ink px-6 py-3">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
