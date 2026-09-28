"use client";

import { useParams } from "next/navigation";
import { Field, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";

type Shipment = {
  id: string;
  itemName: string;
  supplier: string;
  quantity: number;
  status: "ordered" | "shipped" | "in_transit" | "delivered";
  tracking: string;
  eta: string;
};

const nextStatus = {
  ordered: "shipped",
  shipped: "in_transit",
  in_transit: "delivered",
  delivered: "delivered",
} as const;

export default function ShipmentsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create, patch } = useAdminList<Shipment[]>(storeId, "shipments");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Incoming boxes" note="Stock you ordered. See if it is coming or already here." />
      </div>
      <Panel title="New inbound order">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              itemName: form.get("itemName"),
              supplier: form.get("supplier"),
              quantity: Number(form.get("quantity")),
              tracking: form.get("tracking"),
              status: "ordered",
              eta: new Date(String(form.get("eta"))).toISOString(),
              orderedAt: new Date().toISOString(),
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Item"><input name="itemName" required className={inputClass} /></Field>
          <Field label="Supplier"><input name="supplier" required className={inputClass} /></Field>
          <Field label="Qty"><input name="quantity" type="number" required className={inputClass} /></Field>
          <Field label="Tracking"><input name="tracking" className={inputClass} /></Field>
          <Field label="ETA"><input name="eta" type="date" required className={inputClass} /></Field>
          <button className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Add box</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Tracking">
        {(data ?? []).map((row) => (
          <article key={row.id} className="grid items-center gap-3 border-b border-slate-100 py-3 md:grid-cols-[1.3fr_1fr_auto_auto]">
            <div>
              <p>{row.itemName}</p>
              <p className="text-xs text-slate-500">{row.supplier} · {row.quantity} pcs · {row.tracking || "No AWB"}</p>
            </div>
            <p className="text-sm text-slate-500">ETA {row.eta.slice(0, 10)}</p>
            <Status value={row.status} />
            {row.status !== "delivered" ? (
              <button className="text-sm text-teal-700" onClick={() => void patch(row.id, { status: nextStatus[row.status] })}>
                Advance
              </button>
            ) : (
              <span />
            )}
          </article>
        ))}
      </Panel>
    </div>
  );
}
