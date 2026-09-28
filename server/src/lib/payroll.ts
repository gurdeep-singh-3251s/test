import type { Attendance, AttendanceStatus, Staff, StaffPayment } from "./admin-types.js";

export const DEMO_TODAY = "2026-09-27";
export const DEMO_NOW = "16:40";
export const GRACE_MINUTES = 10;
const LATE_CUT_PER_15 = 50;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function daysInMonth(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
}

export function timeToMinutes(time: string) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

export function addMinutes(time: string, delta: number) {
  return minutesToTime(timeToMinutes(time) + delta);
}

export function hoursBetween(start: string, end: string) {
  const minutes = timeToMinutes(end) - timeToMinutes(start);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 10) / 10;
}

export function dailyRate(salary: number, month: string) {
  return salary / daysInMonth(month);
}

export function deriveStatus(
  shiftStart: string,
  checkIn: string,
  requested?: AttendanceStatus,
): { status: AttendanceStatus; lateMinutes: number } {
  if (requested === "leave" || requested === "absent" || requested === "half_day") {
    return { status: requested, lateMinutes: 0 };
  }
  if (requested === "present") {
    return { status: "present", lateMinutes: 0 };
  }
  if (!checkIn) {
    return { status: requested ?? "present", lateMinutes: requested === "late" ? 20 : 0 };
  }
  const lateMinutes = Math.max(0, timeToMinutes(checkIn) - timeToMinutes(shiftStart));
  if (requested === "late") {
    return { status: "late", lateMinutes: Math.max(lateMinutes, 15) };
  }
  if (lateMinutes > GRACE_MINUTES) {
    return { status: "late", lateMinutes };
  }
  return { status: "present", lateMinutes };
}

export function dayPay(salary: number, month: string, row: Attendance) {
  const daily = dailyRate(salary, month);
  switch (row.status) {
    case "present":
      return Math.round(daily);
    case "late": {
      const extra = Math.max(0, row.lateMinutes - GRACE_MINUTES);
      const blocks = Math.ceil(extra / 15);
      const cut = Math.min(blocks * LATE_CUT_PER_15, daily * 0.2);
      return Math.round(daily - cut);
    }
    case "half_day":
      return Math.round(daily / 2);
    case "leave":
      return Math.round(daily);
    case "absent":
      return 0;
    default:
      return 0;
  }
}

export type MonthStats = {
  month: string;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  halfDays: number;
  hours: number;
  lateMinutes: number;
  due: number;
  paid: number;
  remaining: number;
  hasRegister: boolean;
};

export function monthStats(
  person: Staff,
  rows: Attendance[],
  payments: StaffPayment[],
  month: string,
): MonthStats {
  const monthRows = rows.filter((row) => row.date.startsWith(month) && row.staffId === person.id);
  const paid = payments
    .filter((row) => row.staffId === person.id && row.period === month)
    .reduce((total, row) => total + row.amount, 0);

  if (monthRows.length === 0) {
    const due = paid || 0;
    return {
      month,
      presentDays: 0,
      lateDays: 0,
      leaveDays: 0,
      absentDays: 0,
      halfDays: 0,
      hours: 0,
      lateMinutes: 0,
      due,
      paid,
      remaining: Math.max(0, due - paid),
      hasRegister: false,
    };
  }

  const due = monthRows.reduce((total, row) => total + dayPay(person.salary, month, row), 0);
  return {
    month,
    presentDays: monthRows.filter((row) => row.status === "present").length,
    lateDays: monthRows.filter((row) => row.status === "late").length,
    leaveDays: monthRows.filter((row) => row.status === "leave").length,
    absentDays: monthRows.filter((row) => row.status === "absent").length,
    halfDays: monthRows.filter((row) => row.status === "half_day").length,
    hours: Math.round(monthRows.reduce((total, row) => total + row.hours, 0) * 10) / 10,
    lateMinutes: monthRows.reduce((total, row) => total + row.lateMinutes, 0),
    due,
    paid,
    remaining: Math.max(0, due - paid),
    hasRegister: true,
  };
}

export function yearBoard(
  person: Staff,
  attendance: Attendance[],
  payments: StaffPayment[],
  year: number,
) {
  const months: MonthStats[] = [];
  const joinMonth = person.joinedAt.slice(0, 7);
  const lastMonth = DEMO_TODAY.slice(0, 7);

  for (let monthNum = 1; monthNum <= 12; monthNum += 1) {
    const period = `${year}-${pad(monthNum)}`;
    if (period < joinMonth || period > lastMonth) continue;
    const stats = monthStats(person, attendance, payments, period);
    if (!stats.hasRegister && stats.paid === 0) continue;
    months.push(stats);
  }

  return {
    year,
    months,
    totals: {
      presentDays: months.reduce((total, row) => total + row.presentDays, 0),
      lateDays: months.reduce((total, row) => total + row.lateDays, 0),
      leaveDays: months.reduce((total, row) => total + row.leaveDays, 0),
      absentDays: months.reduce((total, row) => total + row.absentDays, 0),
      hours: Math.round(months.reduce((total, row) => total + row.hours, 0) * 10) / 10,
      due: months.reduce((total, row) => total + row.due, 0),
      paid: months.reduce((total, row) => total + row.paid, 0),
    },
  };
}

export function stillInShop(row: Attendance | null | undefined) {
  if (!row?.checkIn) return false;
  if (row.checkOut) return false;
  return row.status === "present" || row.status === "late" || row.status === "half_day";
}

export function hoursSoFar(row: Attendance | null | undefined) {
  if (!row?.checkIn) return 0;
  if (row.checkOut) return row.hours;
  return hoursBetween(row.checkIn, DEMO_NOW);
}
