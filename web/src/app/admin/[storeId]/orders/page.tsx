"use client";

import { useParams } from "next/navigation";
import { Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";

type Order = {
  id: string;
  name: string;
  city: string;
  total: number;
  status: string;
  tracking: string;
  channel?: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

const flow = ["placed", "packed", "shipped", "in_transit", "delivered"];

export default function OrdersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, patch } = useAdminList<Order[]>(storeId, "orders");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Website orders" note="Orders from the website. Pack, send, and track them." />
      </div>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Orders">
        {(data ?? [])
          .filter((order) => order.channel !== "store")
          .map((order) => (
          <article key={order.id} className="grid gap-3 border-b border-slate-100 py-4 md:grid-cols-[1.3fr_1fr_auto]">
            <div>
              <p>{order.name}</p>
              <p className="text-xs text-slate-500">
                {order.id} · {order.city} · {order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}
              </p>
            </div>
            <div className="text-sm">
              <Money value={order.total} />
              <p className="text-slate-500">{order.createdAt.slice(0, 10)}</p>
              <input
                className={`${inputClass} mt-2 w-full`}
                defaultValue={order.tracking}
                placeholder="Tracking ID"
                onBlur={(event) => {
                  if (event.target.value !== order.tracking) {
                    void patch(order.id, { tracking: event.target.value });
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Status value={order.status} />
              {order.status !== "delivered" && order.status !== "cancelled" ? (
                <button
                  className="text-left text-sm text-teal-700"
                  onClick={() => {
                    const index = flow.indexOf(order.status);
                    void patch(order.id, { status: flow[Math.min(index + 1, flow.length - 1)] });
                  }}
                >
                  Next status
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </Panel>
    </div>
  );
}
