"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Money, PageHead, Panel, Status } from "@/components/admin/ui";
import { useAdminList } from "@/components/admin/use-admin";

type WalkIn = {
  id: string;
  name: string;
  phone: string;
  total: number;
  status: string;
  cashierName?: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

export default function WalkinsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data, error } = useAdminList<WalkIn[]>(storeId, "walkins");

  return (
    <div className="grid gap-6">
      <div>
        <PageHead title="Store bills" note="Bills staff made in the shop." />
      </div>
      {error ? <p className="text-rose-600">{error}</p> : null}
      <Panel title="Bills from the shop">
        {(data ?? []).length === 0 ? <p className="text-slate-500">No store bills yet.</p> : null}
        {(data ?? []).map((bill) => (
          <article key={bill.id} className="grid gap-3 border-b border-slate-100 py-4 md:grid-cols-[1.4fr_1fr_auto]">
            <div>
              <p>{bill.name}</p>
              <p className="text-xs text-slate-500">
                {bill.id} · {bill.phone} · {bill.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}
              </p>
            </div>
            <div className="text-sm">
              <p className="text-slate-500">Cashier {bill.cashierName ?? "staff"}</p>
              <p className="text-slate-500">{bill.createdAt.slice(0, 16).replace("T", " ")}</p>
              <Link href={`/bill/${bill.id}`} className="text-teal-700">
                Open QR bill
              </Link>
            </div>
            <div className="text-right">
              <Money value={bill.total} />
              <div className="mt-1">
                <Status value={bill.status} />
              </div>
            </div>
          </article>
        ))}
      </Panel>
    </div>
  );
}
