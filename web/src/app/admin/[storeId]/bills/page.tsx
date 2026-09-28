"use client";

import { useParams } from "next/navigation";
import { Field, Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";

type Bill = {
  id: string;
  type: string;
  amount: number;
  period: string;
  dueDate: string;
  status: "due" | "paid";
  note: string;
};

export default function BillsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create, patch } = useAdminList<Bill[]>(storeId, "bills");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Rent and power" note="Electricity, rent, water and internet for this shop." />
      </div>
      <Panel title="Add bill">
        <form
          className="grid gap-3 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void create({
              type: form.get("type"),
              amount: Number(form.get("amount")),
              period: form.get("period"),
              dueDate: new Date(String(form.get("dueDate"))).toISOString(),
              status: "due",
              note: form.get("note"),
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Type">
            <select name="type" className={inputClass}>
              <option value="electricity">Electricity</option>
              <option value="rent">Rent</option>
              <option value="water">Water</option>
              <option value="internet">Internet</option>
            </select>
          </Field>
          <Field label="Amount">
            <input name="amount" type="number" required className={inputClass} />
          </Field>
          <Field label="Period">
            <input name="period" defaultValue="2026-09" className={inputClass} />
          </Field>
          <Field label="Due">
            <input name="dueDate" type="date" required className={inputClass} />
          </Field>
          <Field label="Note">
            <input name="note" className={inputClass} />
          </Field>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white md:col-span-5">Save bill</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="These bills">
        <div className="grid gap-3">
          {(data ?? []).map((bill) => (
            <article key={bill.id} className="grid items-center gap-3 border-b border-slate-100 py-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
              <div>
                <p className="capitalize">{bill.type}</p>
                <p className="text-xs text-slate-500">{bill.period}</p>
              </div>
              <Money value={bill.amount} />
              <p className="text-sm text-slate-500">{bill.dueDate.slice(0, 10)}</p>
              <Status value={bill.status} />
              {bill.status === "due" ? (
                <button className="text-sm font-medium text-teal-700" onClick={() => void patch(bill.id, { status: "paid" })}>
                  Mark paid
                </button>
              ) : (
                <span />
              )}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
