"use client";

import { useParams } from "next/navigation";
import { Field, Money, PageHead, Panel, inputClass } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
};

type Payload = { newCustomers: Customer[]; regularCustomers: Customer[]; all: Customer[] };

export default function CustomersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error, create } = useAdminList<Payload>(storeId, "customers");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Customers" note="New people and regulars who come back." />
      </div>
      <Panel title="Add customer">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const now = new Date().toISOString();
            void create({
              name: form.get("name"),
              phone: form.get("phone"),
              email: form.get("email"),
              visits: Number(form.get("visits") || 1),
              totalSpent: Number(form.get("totalSpent") || 0),
              firstVisit: now,
              lastVisit: now,
            });
            event.currentTarget.reset();
          }}
        >
          <Field label="Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Phone"><input name="phone" required className={inputClass} /></Field>
          <Field label="Email"><input name="email" className={inputClass} /></Field>
          <Field label="Visits"><input name="visits" type="number" defaultValue={1} className={inputClass} /></Field>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white md:col-span-4">Save customer</button>
        </form>
      </Panel>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={`New customers · ${data?.newCustomers.length ?? 0}`}>
          {(data?.newCustomers ?? []).map((row) => (
            <Person key={row.id} row={row} />
          ))}
        </Panel>
        <Panel title={`Regulars · ${data?.regularCustomers.length ?? 0}`}>
          {(data?.regularCustomers ?? []).map((row) => (
            <Person key={row.id} row={row} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Person({ row }: { row: Customer }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm">
      <div>
        <p>{row.name}</p>
        <p className="text-slate-500">{row.phone} · {row.visits} visits</p>
      </div>
      <Money value={row.totalSpent} />
    </div>
  );
}
