import type { Attendance, AttendanceStatus } from "@/lib/admin-api";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DAY_MARKS: { status: AttendanceStatus; label: string }[] = [
  { status: "present", label: "On time" },
  { status: "late", label: "Late" },
  { status: "half_day", label: "Half day" },
  { status: "leave", label: "Leave" },
  { status: "absent", label: "Not in" },
];

export function padDay(value: number) {
  return String(value).padStart(2, "0");
}

export function daysInMonth(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
}

export function shiftMonth(month: string, delta: number) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNum - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${padDay(date.getUTCMonth() + 1)}`;
}

export function monthTitle(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNum - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDay(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatHours(value: number) {
  if (!value) return "0h";
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function workLabel(status?: string | null) {
  if (!status) return "No entry";
  if (status === "present") return "On time";
  if (status === "absent") return "Not in";
  if (status === "half_day") return "Half day";
  if (status === "late") return "Late";
  if (status === "leave") return "Leave";
  return status.replaceAll("_", " ");
}

export function workTone(status?: string | null) {
  if (status === "present") return "bg-emerald-500 text-white";
  if (status === "late") return "bg-amber-400 text-slate-900";
  if (status === "leave") return "bg-sky-500 text-white";
  if (status === "absent") return "bg-rose-500 text-white";
  if (status === "half_day") return "bg-violet-500 text-white";
  return "bg-slate-100 text-slate-400";
}

export type CalendarCell = {
  date: string;
  day: number;
  attendance: Attendance | null;
  isToday: boolean;
  isFuture: boolean;
};

export function calendarCells(month: string, days: Attendance[], today: string): (CalendarCell | null)[] {
  const [year, monthNum] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNum - 1, 1));
  const blanks = first.getUTCDay();
  const total = daysInMonth(month);
  const byDate = new Map(days.map((row) => [row.date, row]));
  const cells: (CalendarCell | null)[] = Array.from({ length: blanks }, () => null);

  for (let day = 1; day <= total; day += 1) {
    const date = `${month}-${padDay(day)}`;
    cells.push({
      date,
      day,
      attendance: byDate.get(date) ?? null,
      isToday: date === today,
      isFuture: date > today,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
