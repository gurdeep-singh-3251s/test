"use client";

import { useParams } from "next/navigation";
import { Field, Money, PageHead, Panel, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";
import { formatPrice } from "@/lib/format";

type Sale = {
  id: string;
  itemName: string;
  quantity: number;
  amount: number;
  channel: string;
  customer: string;
  soldAt: string;
};

export default function SalesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create } = useAdminList<Sale[]>(storeId, "sales");
  const earned = (data ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Sales" note={`What this shop sold. Total ${formatPrice(earned)}.`} />
      </div>
      <Panel title="Add a sale">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              itemName: form.get("itemName"),
              quantity: Number(form.get("quantity")),
              amount: Number(form.get("amount")),
              channel: form.get("channel"),
              customer: form.get("customer"),
              soldAt: new Date().toISOString(),
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Item"><input name="itemName" required className={inputClass} /></Field>
          <Field label="Customer"><input name="customer" required className={inputClass} /></Field>
          <Field label="Channel">
            <select name="channel" className={inputClass}>
              <option value="store">Store</option>
              <option value="online">Online</option>
            </select>
          </Field>
          <Field label="Qty"><input name="quantity" type="number" required className={inputClass} /></Field>
          <Field label="Amount"><input name="amount" type="number" required className={inputClass} /></Field>
          <button className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Add sale</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Sales">
        {(data ?? []).map((row) => (
          <div key={row.id} className="grid gap-2 border-b border-slate-100 py-3 text-sm md:grid-cols-[1.3fr_1fr_1fr_auto]">
            <div>
              <p>{row.itemName}</p>
              <p className="text-slate-500">{row.customer}</p>
            </div>
            <p className="capitalize">{row.channel} · ×{row.quantity}</p>
            <p className="text-slate-500">{row.soldAt.slice(0, 10)}</p>
            <Money value={row.amount} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
