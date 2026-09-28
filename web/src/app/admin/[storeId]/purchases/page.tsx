"use client";

import { useParams } from "next/navigation";
import { Field, Money, PageHead, Panel, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";
import { formatPrice } from "@/lib/format";

type Purchase = {
  id: string;
  itemName: string;
  supplier: string;
  category: string;
  quantity: number;
  unitCost: number;
  total: number;
  purchasedAt: string;
};

export default function PurchasesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create } = useAdminList<Purchase[]>(storeId, "purchases");
  const spent = (data ?? []).reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Bought stock" note={`What you bought for this shop. Total ${formatPrice(spent)}.`} />
      </div>
      <Panel title="Add what you bought">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              itemName: form.get("itemName"),
              supplier: form.get("supplier"),
              category: form.get("category"),
              quantity: Number(form.get("quantity")),
              unitCost: Number(form.get("unitCost")),
              purchasedAt: new Date().toISOString(),
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Item"><input name="itemName" required className={inputClass} /></Field>
          <Field label="Supplier"><input name="supplier" required className={inputClass} /></Field>
          <Field label="Category"><input name="category" required className={inputClass} /></Field>
          <Field label="Qty"><input name="quantity" type="number" required className={inputClass} /></Field>
          <Field label="Unit cost"><input name="unitCost" type="number" required className={inputClass} /></Field>
          <button className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">Add purchase</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Bought for the store">
        {(data ?? []).map((row) => (
          <div key={row.id} className="grid gap-2 border-b border-slate-100 py-3 text-sm md:grid-cols-[1.4fr_1fr_auto_auto]">
            <div>
              <p>{row.itemName}</p>
              <p className="text-slate-500">{row.supplier} · {row.category}</p>
            </div>
            <p>{row.quantity} × {formatPrice(row.unitCost)}</p>
            <p className="text-slate-500">{row.purchasedAt.slice(0, 10)}</p>
            <Money value={row.total} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
