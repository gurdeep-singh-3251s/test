"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, type StoreCard } from "@/lib/admin-api";

const groups = [
  {
    label: "Look around",
    items: [["Overview", ""]],
  },
  {
    label: "Money",
    items: [
      ["Sales", "/sales"],
      ["Pay staff", "/pay"],
      ["Pay bills", "/payments"],
      ["Bought stock", "/purchases"],
      ["Extra costs", "/expenses"],
      ["Rent & power", "/bills"],
    ],
  },
  {
    label: "Shop",
    items: [
      ["Stock room", "/inventory"],
      ["Incoming boxes", "/shipments"],
      ["Website orders", "/orders"],
      ["Store bills", "/walkins"],
    ],
  },
  {
    label: "People",
    items: [
      ["Customers", "/customers"],
      ["Team & pay", "/staff"],
      ["Reminders", "/tasks"],
    ],
  },
];

export function AdminShell({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [stores, setStores] = useState<StoreCard[]>([]);

  useEffect(() => {
    void adminApi.stores().then(setStores).catch(() => setStores([]));
  }, []);

  const current = stores.find((store) => store.slug === storeId || store.id === storeId);

  return (
    <>
      <aside className="dash-side w-full shrink-0 md:w-[240px]">
        <div className="px-4 py-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">This shop</p>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#0a1930] px-3 py-2 text-sm text-white"
            value={current?.slug ?? storeId}
            onChange={(event) => {
              window.location.href = `/admin/${event.target.value}`;
            }}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.slug}>
                {store.name.replace("BMS Fashionz ", "")} · {store.focus}
              </option>
            ))}
          </select>
          <Link href="/admin" className="mt-3 block text-xs text-teal-300 hover:text-white">
            All shops
          </Link>
        </div>
        <nav className="px-3 pb-6">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
              {group.items.map(([label, href]) => {
                const path = `/admin/${storeId}${href}`;
                const active = href === "" ? pathname === `/admin/${storeId}` : pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    href={path}
                    className={`mb-0.5 block rounded-lg px-3 py-2 text-sm ${
                      active ? "bg-teal-700 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 overflow-auto p-5 md:p-8">{children}</div>
    </>
  );
}
