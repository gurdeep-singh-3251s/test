import { randomUUID } from "node:crypto";
import { adminState } from "./admin-data.js";
import type {
  Attendance,
  AttendanceStatus,
  Customer,
  Expense,
  InventoryItem,
  Payable,
  PayMethod,
  Purchase,
  RecurringTask,
  Sale,
  Shipment,
  ShopOrder,
  Staff,
  StaffPayment,
  StockMove,
  StockMoveType,
  Store,
  UtilityBill,
} from "./admin-types.js";
import { fallbackProductById } from "./catalog.js";
import { HttpError } from "../middleware/error.js";
import {
  daysUntil,
  dueStatus,
  gstRateFor,
  hsnFor,
  salaryDueDate,
  sizeFor,
  taxOn,
} from "./money.js";
import {
  addMinutes,
  DEMO_NOW,
  DEMO_TODAY,
  deriveStatus,
  hoursBetween,
  hoursSoFar,
  monthStats,
  stillInShop,
  yearBoard,
} from "./payroll.js";

function byStore<T extends { storeId: string }>(rows: T[], storeId: string) {
  return rows.filter((row) => row.storeId === storeId);
}

function requireStore(storeId: string) {
  const store = adminState.stores.find((entry) => entry.id === storeId || entry.slug === storeId);
  if (!store) throw new HttpError(404, "Store not found");
  return store;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function currentMonth() {
  return "2026-09";
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function listStores() {
  return adminState.stores.map((store) => snapshot(store));
}

export function getStore(storeId: string) {
  return snapshot(requireStore(storeId));
}

export function createStore(input: Omit<Store, "id">) {
  const store: Store = { ...input, focus: input.focus ?? "All", id: `store_${randomUUID().slice(0, 8)}` };
  adminState.stores.push(store);
  return store;
}

function snapshot(store: Store) {
  const overview = getOverview(store.id);
  return { ...store, ...overview.totals, lowStock: overview.alerts.lowStock };
}

export function getOverview(storeId: string) {
  const store = requireStore(storeId);
  const month = currentMonth();
  const bills = byStore(adminState.bills, store.id);
  const purchases = byStore(adminState.purchases, store.id);
  const expenses = byStore(adminState.expenses, store.id);
  const sales = byStore(adminState.sales, store.id);
  const customers = byStore(adminState.customers, store.id);
  const inventory = byStore(adminState.inventory, store.id);
  const shipments = byStore(adminState.shipments, store.id);
  const tasks = byStore(adminState.tasks, store.id);
  const orders = byStore(adminState.orders, store.id);

  const monthSales = sales.filter((row) => monthKey(row.soldAt) === month);
  const monthPurchases = purchases.filter((row) => monthKey(row.purchasedAt) === month);
  const monthExpenses = expenses.filter((row) => monthKey(row.spentAt) === month);
  const electricity = bills.filter((row) => row.type === "electricity");
  const staffBill = monthPayrollDue(store.id, month);
  const purchaseSpend = sum(monthPurchases.map((row) => row.total));
  const extraSpend = sum(monthExpenses.map((row) => row.amount));
  const electricitySpend = sum(electricity.filter((row) => row.period === month).map((row) => row.amount));
  const earned = sum(monthSales.map((row) => row.amount));
  const spent = staffBill + purchaseSpend + extraSpend + electricitySpend;
  const newCustomers = customers.filter((row) => row.visits <= 1);
  const regularCustomers = customers.filter((row) => row.visits >= 3);

  const itemCounts = new Map<string, number>();
  for (const row of monthSales) {
    itemCounts.set(row.itemName, (itemCounts.get(row.itemName) ?? 0) + row.quantity);
  }
  const weekdayCounts = new Map<string, number>();
  for (const row of monthSales) {
    const day = new Date(row.soldAt).toLocaleDateString("en-IN", { weekday: "long" });
    weekdayCounts.set(day, (weekdayCounts.get(day) ?? 0) + row.amount);
  }

  const patterns = {
    topItems: [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, units]) => ({ name, units })),
    bestDays: [...weekdayCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([day, amount]) => ({ day, amount })),
    repeatRate: customers.length
      ? Math.round((regularCustomers.length / customers.length) * 100)
      : 0,
    onlineShare: monthSales.length
      ? Math.round(
          (monthSales.filter((row) => row.channel === "online").length / monthSales.length) * 100,
        )
      : 0,
  };

  const floor = getTeam(store.id);

  return {
    store,
    totals: {
      earned,
      spent,
      profit: earned - spent,
      electricity: electricitySpend,
      staffBill,
      purchaseSpend,
      extraSpend,
      newCustomers: newCustomers.length,
      regularCustomers: regularCustomers.length,
      openOrders: orders.filter((row) => !["delivered", "cancelled"].includes(row.status)).length,
    },
    alerts: {
      lowStock: inventory.filter((row) => row.quantity <= row.reorderLevel).length,
      billsDue:
        bills.filter((row) => row.status === "due").length +
        byStore(adminState.payables, store.id).filter((row) => row.status !== "paid").length,
      inbound: shipments.filter((row) => row.status !== "delivered").length,
      tasksDue: tasks.filter((row) => row.active && new Date(row.nextRun) <= new Date("2026-09-28")).length,
    },
    patterns,
    floor: {
      now: DEMO_NOW,
      inNow: floor.kpis.inNow,
      people: floor.people
        .filter((person) => person.inShop)
        .map((person) => ({
          id: person.id,
          name: person.name,
          role: person.role,
          cameAt: person.cameAt,
          hoursSoFar: person.hoursSoFar,
          late: person.today?.status === "late",
          lateMinutes: person.today?.lateMinutes ?? 0,
        })),
    },
  };
}

export function monthPayrollDue(storeId: string, month = currentMonth()) {
  const store = requireStore(storeId);
  const team = byStore(adminState.staff, store.id);
  const attendance = byStore(adminState.attendance, store.id);
  const payments = byStore(adminState.payments, store.id);
  return sum(team.map((person) => monthStats(person, attendance, payments, month).due));
}

export function getTeam(storeId: string, month = currentMonth()) {
  const store = requireStore(storeId);
  const team = byStore(adminState.staff, store.id);
  const attendance = byStore(adminState.attendance, store.id);
  const payments = byStore(adminState.payments, store.id);
  const today = DEMO_TODAY;

  const people = team.map((person) => {
    const todayRow = attendance.find((row) => row.staffId === person.id && row.date === today) ?? null;
    const inShop = stillInShop(todayRow);
    return {
      ...person,
      today: todayRow,
      inShop,
      cameAt: todayRow?.checkIn || "",
      leftAt: todayRow?.checkOut || "",
      hoursSoFar: hoursSoFar(todayRow),
      month: monthStats(person, attendance, payments, month),
    };
  });

  const todayRows = people.map((person) => person.today);
  const due = sum(people.map((person) => person.month.due));
  const paid = sum(people.map((person) => person.month.paid));
  const inNow = people.filter((person) => person.inShop);

  return {
    month,
    today,
    now: DEMO_NOW,
    kpis: {
      inNow: inNow.length,
      inShop: todayRows.filter((row) => row?.status === "present" || row?.status === "late" || row?.status === "half_day").length,
      late: inNow.filter((person) => person.today?.status === "late").length,
      onLeave: todayRows.filter((row) => row?.status === "leave").length,
      absent: todayRows.filter((row) => row?.status === "absent" || !row).length,
      leftShop: people.filter((person) => Boolean(person.leftAt)).length,
      hoursToday: Math.round(inNow.reduce((total, person) => total + person.hoursSoFar, 0) * 10) / 10,
      due,
      paid,
      remaining: Math.max(0, due - paid),
    },
    people,
  };
}

export function getTeamPerson(storeId: string, staffId: string, month = currentMonth(), year = 2026) {
  const store = requireStore(storeId);
  const person = adminState.staff.find((row) => row.id === staffId && row.storeId === store.id);
  if (!person) throw new HttpError(404, "Staff not found");
  const attendance = byStore(adminState.attendance, store.id);
  const payments = byStore(adminState.payments, store.id).filter((row) => row.staffId === person.id);
  const days = attendance
    .filter((row) => row.staffId === person.id && row.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    person,
    month,
    today: attendance.find((row) => row.staffId === person.id && row.date === DEMO_TODAY) ?? null,
    days,
    monthStats: monthStats(person, attendance, payments, month),
    year: yearBoard(person, attendance, payments, year),
    payments,
  };
}

export function upsertAttendance(
  storeId: string,
  input: {
    staffId: string;
    date?: string;
    status?: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    note?: string;
    action?: "in" | "out" | "leave" | "absent" | "half_day";
  },
  id?: string,
) {
  const store = requireStore(storeId);
  const person = adminState.staff.find((row) => row.id === input.staffId && row.storeId === store.id);
  if (!person) throw new HttpError(404, "Staff not found");

  const date = input.date ?? DEMO_TODAY;
  const existing =
    (id ? adminState.attendance.find((row) => row.id === id && row.storeId === store.id) : undefined) ??
    adminState.attendance.find((row) => row.staffId === person.id && row.date === date && row.storeId === store.id);

  const liveToday = date === DEMO_TODAY;
  const action = input.action;
  let statusHint = input.status ?? existing?.status;
  let checkIn = input.checkIn || existing?.checkIn || "";
  let checkOut = input.checkOut ?? existing?.checkOut ?? "";

  if (action === "in") {
    checkIn = input.checkIn || DEMO_NOW;
    checkOut = "";
    statusHint = deriveStatus(person.shiftStart, checkIn).status;
  } else if (action === "out") {
    checkIn = existing?.checkIn || person.shiftStart;
    checkOut = input.checkOut || DEMO_NOW;
    statusHint = existing?.status && existing.status !== "leave" && existing.status !== "absent" ? existing.status : "present";
  } else if (action === "leave" || input.status === "leave") {
    statusHint = "leave";
    checkIn = "";
    checkOut = "";
  } else if (action === "absent" || input.status === "absent") {
    statusHint = "absent";
    checkIn = "";
    checkOut = "";
  } else if (action === "half_day" || input.status === "half_day") {
    statusHint = "half_day";
    checkIn = input.checkIn || existing?.checkIn || person.shiftStart;
    checkOut = input.checkOut || addMinutes(person.shiftStart, 5 * 60);
  } else if (liveToday && (statusHint === "present" || statusHint === "late") && input.checkOut === undefined) {
    checkIn = input.checkIn || existing?.checkIn || person.shiftStart;
    checkOut = "";
  } else if (!liveToday) {
    if (statusHint === "leave" || statusHint === "absent") {
      checkIn = "";
      checkOut = "";
    } else if (statusHint === "present" && !input.checkIn) {
      checkIn = person.shiftStart;
      checkOut = input.checkOut || existing?.checkOut || person.shiftEnd;
    } else if (statusHint === "late" && !input.checkIn) {
      checkIn = addMinutes(person.shiftStart, 20);
      checkOut = input.checkOut || existing?.checkOut || person.shiftEnd;
    } else {
      checkIn = input.checkIn || existing?.checkIn || person.shiftStart;
      checkOut = input.checkOut || existing?.checkOut || person.shiftEnd;
    }
  }

  const derived = deriveStatus(person.shiftStart, checkIn, statusHint);
  const hours = checkIn && checkOut ? hoursBetween(checkIn, checkOut) : 0;

  if (existing) {
    Object.assign(existing, {
      date,
      status: derived.status,
      checkIn,
      checkOut,
      hours,
      lateMinutes: derived.status === "late" ? derived.lateMinutes : 0,
      note: input.note ?? existing.note,
    });
    syncStaffStatus(person, date, derived.status);
    return existing;
  }

  const created: Attendance = {
    id: `att_${person.id}_${date}`,
    storeId: store.id,
    staffId: person.id,
    date,
    status: derived.status,
    checkIn,
    checkOut,
    hours,
    lateMinutes: derived.status === "late" ? derived.lateMinutes : 0,
    note: input.note ?? "",
  };
  adminState.attendance.push(created);
  syncStaffStatus(person, date, derived.status);
  return created;
}

export function clockStaff(
  storeId: string,
  input: { staffId: string; action: "in" | "out" | "leave" | "absent"; time?: string },
) {
  const note =
    input.action === "in"
      ? "Marked in"
      : input.action === "out"
        ? "Marked out"
        : input.action === "leave"
          ? "Sent on leave"
          : "Marked not in";
  return upsertAttendance(storeId, {
    staffId: input.staffId,
    date: DEMO_TODAY,
    action: input.action,
    checkIn: input.action === "in" ? input.time : undefined,
    checkOut: input.action === "out" ? input.time : undefined,
    note,
  });
}

function syncStaffStatus(person: Staff, date: string, status: AttendanceStatus) {
  if (date !== DEMO_TODAY) return;
  person.status = status === "leave" ? "on_leave" : "active";
}

export function listStaff(storeId: string) {
  return byStore(adminState.staff, requireStore(storeId).id);
}

export function upsertStaff(storeId: string, input: Partial<Staff>, id?: string) {
  const store = requireStore(storeId);
  if (id) {
    const current = adminState.staff.find((row) => row.id === id && row.storeId === store.id);
    if (!current) throw new HttpError(404, "Staff not found");
    Object.assign(current, input);
    return current;
  }
  const created: Staff = {
    id: `stf_${randomUUID().slice(0, 8)}`,
    storeId: store.id,
    name: input.name ?? "Staff",
    role: input.role ?? "Floor",
    duty: input.duty ?? "General floor",
    salary: input.salary ?? 18000,
    phone: input.phone ?? "",
    status: input.status ?? "active",
    joinedAt: new Date().toISOString(),
    shiftStart: input.shiftStart ?? "11:00",
    shiftEnd: input.shiftEnd ?? "21:00",
  };
  adminState.staff.push(created);
  return created;
}

export function listPayments(storeId: string) {
  return byStore(adminState.payments, requireStore(storeId).id);
}

export function createPayment(
  storeId: string,
  input: Omit<StaffPayment, "id" | "storeId" | "staffName" | "method"> & { method?: PayMethod },
) {
  const store = requireStore(storeId);
  const person = adminState.staff.find((row) => row.id === input.staffId);
  const row: StaffPayment = {
    ...input,
    id: randomUUID(),
    storeId: store.id,
    staffName: person?.name ?? "Staff",
    method: input.method ?? "upi",
  };
  adminState.payments.push(row);
  return row;
}

export function getStaffPayQueue(storeId: string, month = currentMonth()) {
  const board = getTeam(storeId, month);
  const queue = board.people
    .filter((person) => person.month.remaining > 0)
    .map((person) => {
      const dueDate = salaryDueDate(month, person.role.toLowerCase().includes("manager"));
      const days = daysUntil(dueDate);
      return {
        staffId: person.id,
        name: person.name,
        role: person.role,
        phone: person.phone,
        period: month,
        dueDate,
        days,
        due: person.month.due,
        paid: person.month.paid,
        remaining: person.month.remaining,
        status: dueStatus(dueDate, person.month.remaining, person.month.paid),
      };
    })
    .sort((a, b) => a.days - b.days || b.remaining - a.remaining);

  return {
    month,
    today: DEMO_TODAY,
    kpis: {
      people: queue.length,
      toPay: sum(queue.map((row) => row.remaining)),
      overdue: queue.filter((row) => row.days < 0).length,
      dueSoon: queue.filter((row) => row.days >= 0 && row.days <= 7).length,
    },
    queue,
  };
}

export function payStaff(
  storeId: string,
  input: { staffId: string; period?: string; amount?: number; method?: PayMethod; note?: string },
) {
  const period = input.period ?? currentMonth();
  const person = getTeamPerson(storeId, input.staffId, period);
  const remaining = person.monthStats.remaining;
  if (remaining <= 0) throw new HttpError(400, "Nothing left to pay this month");
  const amount = Math.min(input.amount ?? remaining, remaining);
  return createPayment(storeId, {
    staffId: input.staffId,
    amount,
    period,
    paidAt: new Date().toISOString(),
    note: input.note ?? `Pay for ${period}`,
    method: input.method ?? "upi",
  });
}

function billKind(type: UtilityBill["type"]): Payable["kind"] {
  if (type === "rent") return "rent";
  if (type === "electricity") return "power";
  return "other";
}

export function getPaymentsBoard(storeId: string, month = currentMonth()) {
  const store = requireStore(storeId);
  const staffQueue = getStaffPayQueue(store.id, month).queue.map((row) => ({
    id: `staff-${row.staffId}-${row.period}`,
    source: "staff" as const,
    kind: "staff" as const,
    party: row.name,
    title: `Salary ${row.period}`,
    amount: row.remaining,
    tax: 0,
    total: row.remaining,
    remaining: row.remaining,
    dueDate: row.dueDate,
    days: row.days,
    status: row.status,
    invoiceNo: "",
    gstin: "",
    refId: row.staffId,
    period: row.period,
  }));

  const billRows = byStore(adminState.bills, store.id)
    .filter((row) => row.status === "due")
    .map((row) => {
      const dueDate = row.dueDate.slice(0, 10);
      return {
        id: `bill-${row.id}`,
        source: "bill" as const,
        kind: billKind(row.type),
        party: store.name.replace("BMS Fashionz ", "Shop "),
        title: `${row.type} · ${row.period}`,
        amount: row.amount,
        tax: 0,
        total: row.amount,
        remaining: row.amount,
        dueDate,
        days: daysUntil(dueDate),
        status: dueStatus(dueDate, row.amount),
        invoiceNo: "",
        gstin: "",
        refId: row.id,
        period: row.period,
      };
    });

  const sales = byStore(adminState.sales, store.id).filter((row) => monthKey(row.soldAt) === month);
  const collected = sum(
    sales.map((row) => taxOn(row.amount, /perfume|oud|vetiver|ember/i.test(row.itemName) ? 18 : 5)),
  );
  const inputCredit = sum(
    byStore(adminState.payables, store.id)
      .filter((row) => row.kind === "supplier" && row.period === month)
      .map((row) => row.taxAmount),
  );
  const net = Math.max(0, collected - inputCredit);
  for (const row of byStore(adminState.payables, store.id)) {
    if (row.kind === "tax" && row.status !== "paid") {
      row.amount = net;
      row.total = net;
    }
  }

  const payableRows = byStore(adminState.payables, store.id)
    .filter((row) => row.paidAmount < row.total)
    .map((row) => {
      const total = row.kind === "tax" ? net : row.total;
      const remaining = Math.max(0, total - row.paidAmount);
      const days = daysUntil(row.dueDate);
      return {
        id: row.id,
        source: "payable" as const,
        kind: row.kind,
        party: row.party,
        title: row.title,
        amount: row.kind === "tax" ? net : row.amount,
        tax: row.taxAmount,
        total,
        remaining,
        dueDate: row.dueDate,
        days,
        status: dueStatus(row.dueDate, remaining, row.paidAmount),
        invoiceNo: row.invoiceNo,
        gstin: row.gstin,
        refId: row.id,
        period: row.period,
      };
    })
    .filter((row) => row.remaining > 0);

  const queue = [...staffQueue, ...billRows, ...payableRows].sort(
    (a, b) => a.days - b.days || b.remaining - a.remaining,
  );

  return {
    month,
    today: DEMO_TODAY,
    kpis: {
      toPay: sum(queue.map((row) => row.remaining)),
      overdue: queue.filter((row) => row.days < 0).length,
      dueSoon: queue.filter((row) => row.days >= 0 && row.days <= 7).length,
      staffPay: sum(staffQueue.map((row) => row.remaining)),
      stockBills: sum(payableRows.filter((row) => row.kind === "supplier").map((row) => row.remaining)),
      taxDue: net,
    },
    tax: {
      collected,
      inputCredit,
      net,
    },
    queue,
  };
}

export function settlePayment(
  storeId: string,
  input: { source: "staff" | "bill" | "payable"; refId: string; amount?: number; method?: PayMethod; period?: string },
) {
  const method = input.method ?? "upi";
  if (input.source === "staff") {
    return payStaff(storeId, {
      staffId: input.refId,
      period: input.period,
      amount: input.amount,
      method,
    });
  }
  if (input.source === "bill") {
    const bill = upsertBill(storeId, { status: "paid" }, input.refId);
    return bill;
  }
  const store = requireStore(storeId);
  const payable = adminState.payables.find((row) => row.id === input.refId && row.storeId === store.id);
  if (!payable) throw new HttpError(404, "Bill not found");
  const remaining = payable.total - payable.paidAmount;
  const amount = Math.min(input.amount ?? remaining, remaining);
  payable.paidAmount += amount;
  payable.method = method;
  if (payable.paidAmount >= payable.total) {
    payable.status = "paid";
    payable.paidAt = new Date().toISOString();
  } else {
    payable.status = "partial";
  }
  return payable;
}

export function listBills(storeId: string) {
  return byStore(adminState.bills, requireStore(storeId).id);
}

export function upsertBill(storeId: string, input: Partial<UtilityBill>, id?: string) {
  const store = requireStore(storeId);
  if (id) {
    const current = adminState.bills.find((row) => row.id === id && row.storeId === store.id);
    if (!current) throw new HttpError(404, "Bill not found");
    Object.assign(current, input);
    return current;
  }
  const created: UtilityBill = {
    id: randomUUID(),
    storeId: store.id,
    type: input.type ?? "electricity",
    amount: input.amount ?? 0,
    period: input.period ?? currentMonth(),
    dueDate: input.dueDate ?? new Date().toISOString(),
    status: input.status ?? "due",
    note: input.note ?? "",
  };
  adminState.bills.push(created);
  return created;
}

export function listPurchases(storeId: string) {
  return byStore(adminState.purchases, requireStore(storeId).id);
}

export function createPurchase(storeId: string, input: Omit<Purchase, "id" | "storeId" | "total">) {
  const store = requireStore(storeId);
  const row: Purchase = {
    ...input,
    id: randomUUID(),
    storeId: store.id,
    total: input.quantity * input.unitCost,
  };
  adminState.purchases.push(row);
  const rate = gstRateFor(input.category);
  const taxAmount = taxOn(row.total, rate);
  adminState.payables.push({
    id: `pay_${row.id}`,
    storeId: store.id,
    kind: "supplier",
    party: input.supplier,
    title: input.itemName,
    amount: row.total,
    taxRate: rate,
    taxAmount,
    total: row.total + taxAmount,
    paidAmount: 0,
    dueDate: DEMO_TODAY,
    period: currentMonth(),
    status: "due",
    method: "",
    invoiceNo: `INV-${row.id.slice(-6).toUpperCase()}`,
    gstin: "",
    note: "New stock bill",
    refId: row.id,
    paidAt: null,
  });
  const match = byStore(adminState.inventory, store.id).find(
    (item) => item.name.toLowerCase() === input.itemName.toLowerCase(),
  );
  if (match) {
    match.quantity += input.quantity;
    addMove(store.id, match, "in", input.quantity, `Bought from ${input.supplier}`, row.id);
  }
  return row;
}

export function listExpenses(storeId: string) {
  return byStore(adminState.expenses, requireStore(storeId).id);
}

export function createExpense(storeId: string, input: Omit<Expense, "id" | "storeId">) {
  const store = requireStore(storeId);
  const row: Expense = { ...input, id: randomUUID(), storeId: store.id };
  adminState.expenses.push(row);
  return row;
}

export function listInventory(storeId: string) {
  return getInventoryBoard(storeId).items;
}

export function getInventoryBoard(storeId: string) {
  const store = requireStore(storeId);
  const items = byStore(adminState.inventory, store.id).map((row) => {
    const available = Math.max(0, row.quantity - row.reserved - row.damaged);
    return {
      ...row,
      available,
      stockValue: row.quantity * row.costPrice,
      sellValue: available * row.sellPrice,
      status: row.quantity === 0 ? "out" : row.quantity <= row.reorderLevel ? "low" : "in_stock",
    };
  });
  const moves = byStore(adminState.stockMoves, store.id).sort((a, b) => b.at.localeCompare(a.at));
  const low = items.filter((row) => row.status === "low" || row.status === "out");
  return {
    items,
    moves: moves.slice(0, 40),
    kpis: {
      pieces: sum(items.map((row) => row.quantity)),
      available: sum(items.map((row) => row.available)),
      stockValue: sum(items.map((row) => row.stockValue)),
      low: low.length,
      out: items.filter((row) => row.status === "out").length,
      reserved: sum(items.map((row) => row.reserved)),
      damaged: sum(items.map((row) => row.damaged)),
    },
    reorder: low,
  };
}

function addMove(
  storeId: string,
  item: InventoryItem,
  type: StockMoveType,
  quantity: number,
  note: string,
  ref = "",
) {
  const move: StockMove = {
    id: randomUUID(),
    storeId,
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    type,
    quantity,
    note,
    at: new Date().toISOString(),
    ref,
  };
  adminState.stockMoves.unshift(move);
  return move;
}

export function receiveStock(
  storeId: string,
  input: {
    itemId?: string;
    name?: string;
    sku?: string;
    category?: string;
    quantity: number;
    unitCost?: number;
    sellPrice?: number;
    supplier?: string;
    size?: string;
    color?: string;
    bin?: "showroom" | "godown";
    gstRate?: number;
  },
) {
  const store = requireStore(storeId);
  let item = input.itemId
    ? adminState.inventory.find((row) => row.id === input.itemId && row.storeId === store.id)
    : undefined;
  if (!item && input.name) {
    const name = input.name;
    item = adminState.inventory.find(
      (row) => row.storeId === store.id && row.name.toLowerCase() === name.toLowerCase(),
    );
  }
  if (!item) {
    item = upsertInventory(storeId, {
      name: input.name,
      sku: input.sku,
      category: input.category,
      quantity: 0,
      costPrice: input.unitCost,
      sellPrice: input.sellPrice,
      size: input.size,
      color: input.color,
      bin: input.bin,
      gstRate: input.gstRate,
    });
  }
  item.quantity += input.quantity;
  if (input.unitCost) item.costPrice = input.unitCost;
  if (input.bin) item.bin = input.bin;
  const move = addMove(store.id, item, "in", input.quantity, input.supplier ? `From ${input.supplier}` : "Stock in");
  if (input.supplier && input.unitCost) {
    const cost = input.quantity * input.unitCost;
    const rate = input.gstRate ?? item.gstRate;
    const taxAmount = taxOn(cost, rate);
    const purchase: Purchase = {
      id: randomUUID(),
      storeId: store.id,
      itemName: item.name,
      supplier: input.supplier,
      category: item.category,
      quantity: input.quantity,
      unitCost: input.unitCost,
      total: cost,
      purchasedAt: new Date().toISOString(),
    };
    adminState.purchases.push(purchase);
    adminState.payables.push({
      id: `pay_${purchase.id}`,
      storeId: store.id,
      kind: "supplier",
      party: input.supplier,
      title: item.name,
      amount: cost,
      taxRate: rate,
      taxAmount,
      total: cost + taxAmount,
      paidAmount: 0,
      dueDate: DEMO_TODAY,
      period: currentMonth(),
      status: "due",
      method: "",
      invoiceNo: `INV-${purchase.id.slice(-6).toUpperCase()}`,
      gstin: "",
      note: "Stock received",
      refId: purchase.id,
      paidAt: null,
    });
  }
  return { item, move };
}

export function moveStock(
  storeId: string,
  input: { itemId: string; type: StockMoveType; quantity: number; note?: string },
) {
  const store = requireStore(storeId);
  const item = adminState.inventory.find((row) => row.id === input.itemId && row.storeId === store.id);
  if (!item) throw new HttpError(404, "Item not found");
  const qty = Math.max(1, input.quantity);
  if (input.type === "in" || input.type === "return") {
    item.quantity += qty;
  } else if (input.type === "out") {
    item.quantity = Math.max(0, item.quantity - qty);
  } else if (input.type === "damage") {
    item.damaged += qty;
    item.quantity = Math.max(0, item.quantity - qty);
  } else if (input.type === "adjust") {
    item.quantity = qty;
  }
  const move = addMove(store.id, item, input.type, qty, input.note ?? "");
  return { item, move };
}

export function upsertInventory(storeId: string, input: Partial<InventoryItem>, id?: string) {
  const store = requireStore(storeId);
  if (id) {
    const current = adminState.inventory.find((row) => row.id === id && row.storeId === store.id);
    if (!current) throw new HttpError(404, "Item not found");
    Object.assign(current, input);
    return current;
  }
  const created: InventoryItem = {
    id: `inv_${randomUUID().slice(0, 8)}`,
    storeId: store.id,
    sku: input.sku ?? `SKU-${randomUUID().slice(0, 5).toUpperCase()}`,
    name: input.name ?? "Untitled item",
    category: input.category ?? "general",
    quantity: input.quantity ?? 0,
    reserved: input.reserved ?? 0,
    reorderLevel: input.reorderLevel ?? 5,
    costPrice: input.costPrice ?? 0,
    sellPrice: input.sellPrice ?? 0,
    size: input.size ?? sizeFor(input.category ?? "general"),
    color: input.color ?? "Navy",
    bin: input.bin ?? "showroom",
    gstRate: input.gstRate ?? gstRateFor(input.category ?? "general", input.sellPrice ?? 0),
    hsn: input.hsn ?? hsnFor(input.category ?? "general"),
    damaged: input.damaged ?? 0,
  };
  adminState.inventory.push(created);
  return created;
}

export function listCustomers(storeId: string) {
  const rows = byStore(adminState.customers, requireStore(storeId).id);
  return {
    newCustomers: rows.filter((row) => row.visits <= 1),
    regularCustomers: rows.filter((row) => row.visits >= 3),
    all: rows,
  };
}

export function createCustomer(storeId: string, input: Omit<Customer, "id" | "storeId">) {
  const store = requireStore(storeId);
  const row: Customer = { ...input, id: randomUUID(), storeId: store.id };
  adminState.customers.push(row);
  return row;
}

export function listSales(storeId: string) {
  return byStore(adminState.sales, requireStore(storeId).id);
}

export function createSale(storeId: string, input: Omit<Sale, "id" | "storeId">) {
  const store = requireStore(storeId);
  const row: Sale = { ...input, id: randomUUID(), storeId: store.id };
  adminState.sales.push(row);
  const match = adminState.customers.find(
    (customer) => customer.storeId === store.id && customer.name === input.customer,
  );
  if (match) {
    match.visits += 1;
    match.totalSpent += input.amount;
    match.lastVisit = input.soldAt;
  }
  return row;
}

export function listShipments(storeId: string) {
  return byStore(adminState.shipments, requireStore(storeId).id);
}

export function upsertShipment(storeId: string, input: Partial<Shipment>, id?: string) {
  const store = requireStore(storeId);
  if (id) {
    const current = adminState.shipments.find((row) => row.id === id && row.storeId === store.id);
    if (!current) throw new HttpError(404, "Shipment not found");
    Object.assign(current, input);
    return current;
  }
  const created: Shipment = {
    id: randomUUID(),
    storeId: store.id,
    itemName: input.itemName ?? "Incoming stock",
    supplier: input.supplier ?? "",
    quantity: input.quantity ?? 1,
    status: input.status ?? "ordered",
    tracking: input.tracking ?? "",
    eta: input.eta ?? new Date().toISOString(),
    orderedAt: input.orderedAt ?? new Date().toISOString(),
  };
  adminState.shipments.push(created);
  return created;
}

export function listOrders(storeId: string) {
  return byStore(adminState.orders, requireStore(storeId).id);
}

export function findOrder(id: string) {
  return adminState.orders.find((row) => row.id === id) ?? null;
}

export function findOrdersByEmail(email: string) {
  return adminState.orders.filter((row) => row.email.toLowerCase() === email.toLowerCase());
}

export function updateOrder(storeId: string, id: string, input: Partial<ShopOrder>) {
  const store = requireStore(storeId);
  const current = adminState.orders.find((row) => row.id === id && row.storeId === store.id);
  if (!current) throw new HttpError(404, "Order not found");
  Object.assign(current, input);
  return current;
}

export function addShopOrder(order: ShopOrder) {
  adminState.orders.unshift(order);
  return order;
}

export function listWalkInBills(storeId: string) {
  return listOrders(storeId).filter((row) => row.channel === "store");
}

export function createWalkInBill(input: {
  storeId: string;
  cashierId: string;
  cashierName: string;
  name: string;
  phone: string;
  email?: string;
  items: { productId: string; quantity: number; size?: string }[];
}) {
  const store = requireStore(input.storeId);
  if (input.items.length === 0) throw new HttpError(400, "Add at least one product");

  const items = input.items.map((line) => {
    const product = fallbackProductById(line.productId);
    if (!product) throw new HttpError(400, `Unknown product id ${line.productId}`);
    if (line.quantity < 1) throw new HttpError(400, "Quantity must be at least 1");
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      size: line.size ?? product.sizes[0] ?? null,
    };
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date().toISOString();
  const email = (input.email?.trim() || `${input.phone.replace(/\D/g, "")}@walkin.bms`).toLowerCase();

  const order: ShopOrder = {
    id: `bms-pos-${randomUUID().slice(0, 8)}`,
    storeId: store.id,
    email,
    name: input.name.trim(),
    phone: input.phone.trim(),
    address: store.address,
    city: store.city,
    pincode: "144001",
    country: "India",
    shipping: "india",
    shippingFee: 0,
    total,
    status: "delivered",
    tracking: "",
    channel: "store",
    cashierId: input.cashierId,
    cashierName: input.cashierName,
    items,
    createdAt: now,
  };

  adminState.orders.unshift(order);

  for (const item of items) {
    createSale(store.id, {
      itemName: item.name,
      quantity: item.quantity,
      amount: item.price * item.quantity,
      channel: "store",
      customer: order.name,
      soldAt: now,
    });
    const stock = adminState.inventory.find(
      (row) => row.storeId === store.id && row.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (stock) stock.quantity = Math.max(0, stock.quantity - item.quantity);
  }

  const named = adminState.customers.find((row) => row.storeId === store.id && row.name === order.name);
  if (!named) {
    const byPhone = adminState.customers.find((row) => row.storeId === store.id && row.phone === order.phone);
    if (byPhone) {
      byPhone.visits += 1;
      byPhone.totalSpent += total;
      byPhone.lastVisit = now;
    } else {
      adminState.customers.push({
        id: randomUUID(),
        storeId: store.id,
        name: order.name,
        phone: order.phone,
        email,
        visits: 1,
        totalSpent: total,
        firstVisit: now,
        lastVisit: now,
      });
    }
  }

  return order;
}

export function listTasks(storeId: string) {
  return byStore(adminState.tasks, requireStore(storeId).id);
}

export function createTask(storeId: string, input: Omit<RecurringTask, "id" | "storeId">) {
  const store = requireStore(storeId);
  const row: RecurringTask = { ...input, id: randomUUID(), storeId: store.id };
  adminState.tasks.push(row);
  return row;
}

export function runTask(storeId: string, id: string) {
  const store = requireStore(storeId);
  const current = adminState.tasks.find((row) => row.id === id && row.storeId === store.id);
  if (!current) throw new HttpError(404, "Task not found");
  const now = new Date("2026-09-27T12:00:00.000Z");
  current.lastRun = now.toISOString();
  const next = new Date(now);
  if (current.cadence === "daily") next.setUTCDate(next.getUTCDate() + 1);
  if (current.cadence === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  if (current.cadence === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  current.nextRun = next.toISOString();
  return current;
}

export const FLAGSHIP_STORE_ID = "store_model_town";
