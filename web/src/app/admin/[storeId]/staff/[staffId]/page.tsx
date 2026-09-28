"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Field, Metric, Money, PageHead, Panel, Status, inputClass } from "@/components/admin/ui";
import { adminApi, type Attendance, type AttendanceStatus, type TeamPerson } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import {
  DAY_MARKS,
  WEEKDAYS,
  calendarCells,
  formatDay,
  formatHours,
  initials,
  monthTitle,
  shiftMonth,
  workLabel,
  workTone,
} from "@/lib/staff-work";

const TODAY = "2026-09-27";

export default function EmployeePage() {
  const { storeId, staffId } = useParams<{ storeId: string; staffId: string }>();
  const [month, setMonth] = useState("2026-09");
  const [detail, setDetail] = useState<TeamPerson | null>(null);
  const [picked, setPicked] = useState(TODAY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const next = await adminApi.teamPerson(storeId, staffId, month);
      setDetail(next);
      setPicked((current) => (current.startsWith(month) ? current : month === "2026-09" ? TODAY : `${month}-01`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this person");
    }
  }, [storeId, staffId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const cells = useMemo(
    () => (detail ? calendarCells(month, detail.days, TODAY) : []),
    [detail, month],
  );
  const selected = detail?.days.find((row) => row.date === picked) ?? null;

  async function mark(status: AttendanceStatus, extra?: { checkIn?: string; checkOut?: string; note?: string }) {
    setBusy(true);
    try {
      await adminApi.markDay(storeId, { staffId, date: picked, status, ...extra });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the day");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!detail || detail.monthStats.remaining <= 0) return;
    setBusy(true);
    try {
      await adminApi.payStaff(storeId, {
        staffId,
        period: month,
        method: "upi",
        note: `Pay for ${monthTitle(month)}`,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pay");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return error ? <p className="text-rose-600">{error}</p> : <p className="text-slate-500">Opening employee…</p>;
  }

  const person = detail.person;
  const stats = detail.monthStats;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/admin/${storeId}/staff`} className="text-sm text-teal-700">
            ← All staff
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-700 text-lg font-semibold text-white">
              {initials(person.name)}
            </span>
            <PageHead
              title={person.name}
              note={`${person.role} · ${person.duty}`}
            />
          </div>
        </div>
        <Status value={person.status} />
      </div>

      <section className="dash-card grid gap-4 p-5 md:grid-cols-4">
        <Info label="Phone" value={person.phone || "—"} />
        <Info label="Showroom time" value={`${person.shiftStart} – ${person.shiftEnd}`} />
        <Info label="Monthly salary" value={formatPrice(person.salary)} />
        <Info
          label="Joined"
          value={new Date(person.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="On time" value={stats.presentDays} />
        <Metric label="Late" value={stats.lateDays} tone="amber" hint={stats.lateMinutes ? `${stats.lateMinutes} min late` : undefined} />
        <Metric label="Leave" value={stats.leaveDays} tone="blue" />
        <Metric label="Not in" value={stats.absentDays} tone="rose" />
        <Metric label="Hours" value={formatHours(stats.hours)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="dash-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Calendar · {monthTitle(month)}</h2>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                onClick={() => setMonth((current) => shiftMonth(current, -1))}
              >
                Prev
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                onClick={() => setMonth("2026-09")}
              >
                This month
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                onClick={() => setMonth((current) => shiftMonth(current, 1))}
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell) return <div key={`blank-${index}`} className="min-h-[76px] rounded-xl bg-slate-50/70" />;
              const active = picked === cell.date;
              return (
                <button
                  key={cell.date}
                  onClick={() => setPicked(cell.date)}
                  className={`min-h-[76px] rounded-xl border p-2 text-left transition ${
                    active ? "border-teal-600 ring-2 ring-teal-100" : "border-slate-100 hover:border-teal-300"
                  } ${cell.isToday ? "bg-teal-50" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-semibold ${cell.isFuture ? "text-slate-300" : "text-slate-800"}`}>
                      {cell.day}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${workTone(cell.attendance?.status)}`} />
                  </div>
                  <p className="mt-2 truncate text-[11px] text-slate-500">
                    {cell.isFuture ? "Upcoming" : workLabel(cell.attendance?.status)}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {cell.attendance?.checkIn
                      ? `${cell.attendance.checkIn}–${cell.attendance.checkOut || "…"}`
                      : cell.attendance?.note || ""}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <Legend color="bg-emerald-500" label="On time" />
            <Legend color="bg-amber-400" label="Late" />
            <Legend color="bg-sky-500" label="Leave" />
            <Legend color="bg-rose-500" label="Not in" />
            <Legend color="bg-violet-500" label="Half day" />
          </div>
        </section>

        <DayPanel
          key={picked}
          date={picked}
          row={selected}
          busy={busy}
          remaining={stats.remaining}
          due={stats.due}
          paid={stats.paid}
          onMark={(status) => void mark(status)}
          onTimes={(checkIn, checkOut) => void mark(selected?.status ?? "present", { checkIn, checkOut })}
          onPay={() => void pay()}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Year 2026">
          <div className="grid gap-2">
            {detail.year.months.map((row) => (
              <button
                key={row.month}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  row.month === month ? "bg-teal-50 text-teal-900" : "bg-slate-50"
                }`}
                onClick={() => setMonth(row.month)}
              >
                <span>{monthTitle(row.month)}</span>
                <span className="text-xs text-slate-500">
                  {row.hasRegister
                    ? `${row.presentDays + row.lateDays} in · ${row.leaveDays} leave`
                    : "Salary month"}
                  {" · "}
                  <Money value={row.due} />
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Year so far: {detail.year.totals.presentDays + detail.year.totals.lateDays} days in shop,{" "}
            {detail.year.totals.leaveDays} leave, {formatHours(detail.year.totals.hours)},{" "}
            {formatPrice(detail.year.totals.paid)} already given.
          </p>
        </Panel>

        <Panel title="Pay already given">
          {detail.payments.length === 0 ? (
            <p className="text-sm text-slate-500">No pay recorded yet.</p>
          ) : (
            detail.payments.map((row) => (
              <div key={row.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                <span>
                  {monthTitle(row.period)}
                  <span className="block text-xs text-slate-400">
                    {row.paidAt.slice(0, 10)} {row.method ? `· ${row.method}` : ""}
                  </span>
                </span>
                <Money value={row.amount} />
              </div>
            ))
          )}
        </Panel>
      </div>

      <Panel title="Edit this person">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setBusy(true);
            void adminApi
              .patch(storeId, "staff", staffId, {
                duty: form.get("duty"),
                phone: form.get("phone"),
                salary: Number(form.get("salary")),
                shiftStart: form.get("shiftStart"),
                shiftEnd: form.get("shiftEnd"),
              })
              .then(load)
              .catch((err) => setError(err instanceof Error ? err.message : "Could not save"))
              .finally(() => setBusy(false));
          }}
        >
          <Field label="Duty"><input name="duty" defaultValue={person.duty} className={inputClass} /></Field>
          <Field label="Phone"><input name="phone" defaultValue={person.phone} className={inputClass} /></Field>
          <Field label="Salary"><input name="salary" type="number" defaultValue={person.salary} className={inputClass} /></Field>
          <Field label="In time"><input name="shiftStart" type="time" defaultValue={person.shiftStart} className={inputClass} /></Field>
          <Field label="Out time"><input name="shiftEnd" type="time" defaultValue={person.shiftEnd} className={inputClass} /></Field>
          <button disabled={busy} className="self-end rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">
            Save details
          </button>
        </form>
      </Panel>

      {error ? <p className="text-rose-600">{error}</p> : null}
    </div>
  );
}

function DayPanel({
  date,
  row,
  busy,
  remaining,
  due,
  paid,
  onMark,
  onTimes,
  onPay,
}: {
  date: string;
  row: Attendance | null;
  busy: boolean;
  remaining: number;
  due: number;
  paid: number;
  onMark: (status: AttendanceStatus) => void;
  onTimes: (checkIn: string, checkOut: string) => void;
  onPay: () => void;
}) {
  return (
    <section className="dash-card p-5">
      <h2 className="text-base font-semibold text-slate-900">{formatDay(date)}</h2>
      <p className="mt-1 text-sm text-slate-500">{workLabel(row?.status)}</p>

      <div className="mt-4 grid gap-2">
        <Mini label="In" value={row?.checkIn || "—"} />
        <Mini label="Out" value={row?.checkOut || "—"} />
        <Mini label="Hours" value={formatHours(row?.hours ?? 0)} />
        <Mini label="Late" value={row?.lateMinutes ? `${row.lateMinutes} min` : "No"} />
        {row?.note ? <Mini label="Note" value={row.note} /> : null}
      </div>

      <form
        className="mt-4 grid grid-cols-2 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onTimes(String(form.get("checkIn")), String(form.get("checkOut")));
        }}
      >
        <Field label="In time"><input name="checkIn" type="time" defaultValue={row?.checkIn || "11:00"} className={inputClass} /></Field>
        <Field label="Out time"><input name="checkOut" type="time" defaultValue={row?.checkOut || "21:00"} className={inputClass} /></Field>
        <button disabled={busy} className="col-span-2 rounded-lg border border-slate-200 py-2 text-sm">
          Save in / out
        </button>
      </form>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Mark this day</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {DAY_MARKS.map((mark) => (
          <button
            key={mark.status}
            disabled={busy}
            className={`rounded-lg px-2 py-2 text-xs font-medium ${
              row?.status === mark.status ? workTone(mark.status) : "border border-slate-200 text-slate-600"
            }`}
            onClick={() => onMark(mark.status)}
          >
            {mark.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">This month pay</p>
        <p className="mt-1 text-sm">Due <Money value={due} /> · given <Money value={paid} /></p>
        {remaining > 0 ? (
          <button
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-teal-700 py-2 text-sm font-medium text-white"
            onClick={onPay}
          >
            Pay {formatPrice(remaining)}
          </button>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">Paid for this month</p>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
