import { formatPrice } from "@/lib/format";

export function PageHead({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {note ? <p className="mt-1 text-sm text-slate-500">{note}</p> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = "teal",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "teal" | "blue" | "amber" | "rose";
}) {
  const bar = {
    teal: "kpi-teal",
    blue: "kpi-blue",
    amber: "kpi-amber",
    rose: "kpi-rose",
  }[tone];

  return (
    <article className={`dash-card dash-kpi relative p-5 ${bar}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </article>
  );
}

export function Money({ value }: { value: number }) {
  return <span className="font-medium text-slate-900">{formatPrice(value)}</span>;
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dash-card p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600";

export function Status({ value }: { value: string }) {
  const tone =
    value === "delivered" || value === "paid" || value === "active" || value === "in_stock" || value === "present" || value === "On time" || value === "showroom" || value === "In shop"
      ? "bg-emerald-50 text-emerald-700"
      : value === "low" || value === "due" || value === "in_transit" || value === "shipped" || value === "late" || value === "Late" || value === "half_day" || value === "Half day" || value === "on_leave" || value === "partial" || value === "godown"
        ? "bg-amber-50 text-amber-700"
        : value === "out" || value === "cancelled" || value === "absent" || value === "Not in" || value === "overdue"
          ? "bg-rose-50 text-rose-700"
          : value === "leave" || value === "Leave"
            ? "bg-sky-50 text-sky-700"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
