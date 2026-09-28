"use client";

import { useParams } from "next/navigation";
import { Field, Money, PageHead, Panel, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";
import { formatPrice } from "@/lib/format";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  spentAt: string;
  note: string;
};

export default function ExpensesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create } = useAdminList<Expense[]>(storeId, "expenses");
  const total = (data ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Extra costs" note={`Ads, repairs and other costs. Total ${formatPrice(total)}.`} />
      </div>
      <Panel title="Add expense">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              title: form.get("title"),
              category: form.get("category"),
              amount: Number(form.get("amount")),
              spentAt: new Date().toISOString(),
              note: form.get("note") || "",
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Title"><input name="title" required className={inputClass} /></Field>
          <Field label="Category"><input name="category" required className={inputClass} /></Field>
          <Field label="Amount"><input name="amount" type="number" required className={inputClass} /></Field>
          <Field label="Note"><input name="note" className={inputClass} /></Field>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white md:col-span-4">Add expense</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Ledger">
        {(data ?? []).map((row) => (
          <div key={row.id} className="flex justify-between border-b border-slate-100 py-3 text-sm">
            <div>
              <p>{row.title}</p>
              <p className="text-slate-500">{row.category} · {row.spentAt.slice(0, 10)}</p>
            </div>
            <Money value={row.amount} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
