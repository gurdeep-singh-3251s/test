import { DEMO_TODAY } from "./payroll.js";

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function gstRateFor(category: string, sellPrice = 0) {
  if (category === "perfumes") return 18;
  if (sellPrice >= 2500) return 12;
  return 5;
}

export function hsnFor(category: string) {
  const map: Record<string, string> = {
    suits: "6204",
    dresses: "6204",
    shirts: "6205",
    pants: "6203",
    shoes: "6403",
    perfumes: "3303",
    belts: "4203",
    bags: "4202",
    kids: "6111",
    outfits: "6211",
  };
  return map[category] ?? "6204";
}

export function sizeFor(category: string) {
  if (category === "shoes") return "8";
  if (category === "kids") return "5-6Y";
  if (category === "pants") return "32";
  if (category === "shirts") return "M";
  return "Free";
}

export function taxOn(amount: number, rate: number) {
  return Math.round((amount * rate) / 100);
}

export function salaryDueDate(period: string, isManager: boolean) {
  const [year, month] = period.split("-").map(Number);
  if (isManager) {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${period}-${pad(last)}`;
  }
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${pad(nextMonth)}-07`;
}

export function daysUntil(dueDate: string, today = DEMO_TODAY) {
  const due = Date.parse(`${dueDate.slice(0, 10)}T00:00:00.000Z`);
  const now = Date.parse(`${today}T00:00:00.000Z`);
  return Math.round((due - now) / 86_400_000);
}

export function payRank(dueDate: string, remaining: number) {
  const days = daysUntil(dueDate);
  return days * 1_000_000 + (1000000 - remaining);
}

export function dueStatus(dueDate: string, remaining: number, paidAmount = 0) {
  if (remaining <= 0) return "paid" as const;
  if (paidAmount > 0) return "partial" as const;
  return daysUntil(dueDate) < 0 ? ("overdue" as const) : ("due" as const);
}
