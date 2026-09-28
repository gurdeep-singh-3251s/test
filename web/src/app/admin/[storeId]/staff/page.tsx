"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Field, Metric, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { adminApi, type TeamBoard, type TeamPersonCard } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { formatHours, initials, workLabel } from "@/lib/staff-work";

export default function StaffPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [month] = useState("2026-09");
  const [board, setBoard] = useState<TeamBoard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadBoard = useCallback(async () => {
    try {
      setError("");
      setBoard(await adminApi.team(storeId, month));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team");
    }
  }, [storeId, month]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  async function clock(staffId: string, action: "in" | "out" | "leave" | "absent", time?: string) {
    setBusy(staffId + action);
    try {
      await adminApi.clock(storeId, { staffId, action, time });
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy("");
    }
  }

  if (!board) {
    return error ? <p className="text-rose-600">{error}</p> : <p className="text-slate-500">Loading team…</p>;
  }

  const inNow = board.people.filter((person) => person.inShop);
  const notIn = board.people.filter((person) => !person.inShop);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          title="Team"
          note="Who is in the showroom right now, what time they came, and who you still need to mark."
        />
        <Link href={`/admin/${storeId}/pay`} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">
          Pay staff
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="In shop now" value={board.kpis.inNow} hint={`As of ${board.now}`} />
        <Metric label="Came late" value={board.kpis.late} tone="amber" />
        <Metric label="On leave" value={board.kpis.onLeave} tone="blue" />
        <Metric label="Already left" value={board.kpis.leftShop} tone="rose" />
      </div>

      <Panel title={`In the shop now · ${inNow.length}`}>
        {inNow.length === 0 ? (
          <p className="text-sm text-slate-500">Nobody is marked in right now. Mark someone in below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Person</th>
                  <th className="pb-3 font-medium">Came at</th>
                  <th className="pb-3 font-medium">Hours so far</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {inNow.map((person) => (
                  <tr key={person.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <Link href={`/admin/${storeId}/staff/${encodeURIComponent(person.id)}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {person.name}
                      </Link>
                      <p className="text-xs text-slate-500">{person.role}</p>
                    </td>
                    <td className="py-3 font-semibold text-teal-800">{person.cameAt || "—"}</td>
                    <td className="py-3">{formatHours(person.hoursSoFar)}</td>
                    <td className="py-3">
                      <Status value={person.today?.status === "late" ? "Late" : "In shop"} />
                      {person.today?.lateMinutes ? (
                        <p className="mt-1 text-xs text-amber-700">{person.today.lateMinutes} min late</p>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          disabled={Boolean(busy)}
                          className="rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white disabled:opacity-50"
                          onClick={() => void clock(person.id, "out")}
                        >
                          Mark out
                        </button>
                        <button
                          disabled={Boolean(busy)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] disabled:opacity-50"
                          onClick={() => void clock(person.id, "leave")}
                        >
                          Send on leave
                        </button>
                        <Link
                          href={`/admin/${storeId}/staff/${encodeURIComponent(person.id)}`}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                        >
                          Full page
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Not in the shop">
        <div className="grid gap-3">
          {notIn.map((person) => (
            <article key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3">
              <div>
                <Link href={`/admin/${storeId}/staff/${encodeURIComponent(person.id)}`} className="font-medium hover:text-teal-700">
                  {person.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {person.role} · {person.leftAt ? `Left at ${person.leftAt}` : workLabel(person.today?.status)}
                </p>
              </div>
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const time = String(new FormData(event.currentTarget).get("time") || board.now);
                  void clock(person.id, "in", time);
                }}
              >
                <label className="grid gap-1 text-[11px] text-slate-500">
                  In time
                  <input name="time" type="time" defaultValue={person.shiftStart} className={inputClass} />
                </label>
                <button disabled={Boolean(busy)} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
                  Mark in
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-50"
                  onClick={() => void clock(person.id, "leave")}
                >
                  Leave
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-50"
                  onClick={() => void clock(person.id, "absent")}
                >
                  Not in
                </button>
              </form>
            </article>
          ))}
        </div>
      </Panel>

      <h2 className="text-base font-semibold text-slate-900">All people</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {board.people.map((person) => (
          <EmployeeCard key={person.id} storeId={storeId} person={person} now={board.now} />
        ))}
      </div>

      <Panel title="Add a person">
        <form
          className="grid gap-3 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void adminApi
              .create(storeId, "staff", {
                name: form.get("name"),
                role: form.get("role"),
                duty: form.get("duty"),
                salary: Number(form.get("salary")),
                phone: form.get("phone"),
                shiftStart: form.get("shiftStart"),
                shiftEnd: form.get("shiftEnd"),
              })
              .then(() => {
                event.currentTarget.reset();
                void loadBoard();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "Could not add"));
          }}
        >
          <Field label="Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Role"><input name="role" required className={inputClass} /></Field>
          <Field label="Duty"><input name="duty" required className={inputClass} /></Field>
          <Field label="Monthly salary"><input name="salary" type="number" required className={inputClass} /></Field>
          <Field label="In time"><input name="shiftStart" type="time" defaultValue="11:00" className={inputClass} /></Field>
          <Field label="Out time"><input name="shiftEnd" type="time" defaultValue="21:00" className={inputClass} /></Field>
          <Field label="Phone"><input name="phone" className={inputClass} /></Field>
          <button className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white md:col-span-6">
            Add person
          </button>
        </form>
      </Panel>

      {error ? <p className="text-rose-600">{error}</p> : null}
    </div>
  );
}

function EmployeeCard({
  storeId,
  person,
  now,
}: {
  storeId: string;
  person: TeamPersonCard;
  now: string;
}) {
  return (
    <Link href={`/admin/${storeId}/staff/${encodeURIComponent(person.id)}`} className="dash-card block p-5 transition hover:border-teal-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-700 text-sm font-semibold text-white">
            {initials(person.name)}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{person.name}</p>
            <p className="text-xs text-slate-500">{person.role} · {person.shiftStart}–{person.shiftEnd}</p>
          </div>
        </div>
        <Status value={person.inShop ? "In shop" : person.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-[11px] uppercase tracking-wide text-slate-400">Came at</dt>
          <dd className="mt-0.5 font-medium">{person.cameAt || "Not in"}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-[11px] uppercase tracking-wide text-slate-400">{person.inShop ? `Hours till ${now}` : "Left at"}</dt>
          <dd className="mt-0.5 font-medium">{person.inShop ? formatHours(person.hoursSoFar) : person.leftAt || workLabel(person.today?.status)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm font-medium text-teal-700">Open calendar and full details →</p>
    </Link>
  );
}
