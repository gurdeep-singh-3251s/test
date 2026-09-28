import { randomUUID } from "node:crypto";
import type {
  AdminState,
  Attendance,
  AttendanceStatus,
  Customer,
  Expense,
  InventoryItem,
  Payable,
  Purchase,
  RecurringTask,
  Sale,
  Shipment,
  ShopOrder,
  Staff,
  StaffPayment,
  StockMove,
  UtilityBill,
} from "./admin-types.js";
import { gstRateFor, hsnFor, sizeFor, taxOn } from "./money.js";
import { addMinutes, DEMO_TODAY, deriveStatus, hoursBetween } from "./payroll.js";

const WOMEN = "store_women";
const KIDS = "store_kids";
const MODEL = "store_model_town";
const RAINAK = "store_rainak";

function iso(daysAgo: number, hour = 12) {
  const date = new Date("2026-09-27T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function staff(
  storeId: string,
  name: string,
  role: string,
  duty: string,
  salary: number,
  phone: string,
  joinedDays: number,
  shiftStart = "11:00",
  shiftEnd = "21:00",
): Staff {
  return {
    id: `stf_${name.toLowerCase().replace(/\s+/g, "_")}_${storeId.slice(-4)}`,
    storeId,
    name,
    role,
    duty,
    salary,
    phone,
    status: "active",
    joinedAt: iso(joinedDays),
    shiftStart,
    shiftEnd,
  };
}

function hashKey(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function seedPersonDays(person: Staff, year: number, month: number, fromDay: number, toDay: number) {
  const rows: Attendance[] = [];
  const leaveDay = 3 + (hashKey(person.id) % 18);

  for (let day = fromDay; day <= toDay; day += 1) {
    const date = ymd(year, month, day);
    const seed = hashKey(`${person.id}:${date}`);
    let status: AttendanceStatus;
    let checkIn = "";
    let checkOut = "";
    let note = "";

    if (day === leaveDay || (month === 9 && day === 12 && seed % 2 === 0)) {
      status = "leave";
      note = day === leaveDay ? "Family work" : "Not well";
    } else if (seed % 29 === 0) {
      status = "absent";
      note = "Did not come";
    } else if (seed % 16 === 0) {
      status = "half_day";
      checkIn = person.shiftStart;
      checkOut = addMinutes(person.shiftStart, 5 * 60);
      note = "Left after half day";
    } else if (seed % 6 === 0) {
      const late = 18 + (seed % 35);
      checkIn = addMinutes(person.shiftStart, late);
      checkOut = addMinutes(person.shiftEnd, (seed % 3) * 8 - 8);
      status = "late";
      note = `Came ${late} min late`;
    } else {
      const jitter = (seed % 9) - 4;
      checkIn = addMinutes(person.shiftStart, jitter);
      checkOut = addMinutes(person.shiftEnd, (seed % 21) - 10);
      status = deriveStatus(person.shiftStart, checkIn).status;
    }

    const derived = deriveStatus(person.shiftStart, checkIn, status);
    rows.push({
      id: `att_${person.id}_${date}`,
      storeId: person.storeId,
      staffId: person.id,
      date,
      status: derived.status,
      checkIn,
      checkOut,
      hours: checkIn && checkOut ? hoursBetween(checkIn, checkOut) : 0,
      lateMinutes: derived.status === "late" ? derived.lateMinutes : 0,
      note,
    });
  }

  return rows;
}

function seedAttendance(staffRows: Staff[]) {
  const rows: Attendance[] = [];
  for (const person of staffRows) {
    rows.push(...seedPersonDays(person, 2026, 8, 1, 31));
    rows.push(...seedPersonDays(person, 2026, 9, 1, 27));
  }

  const byStore = new Map<string, Staff[]>();
  for (const person of staffRows) {
    const list = byStore.get(person.storeId) ?? [];
    list.push(person);
    byStore.set(person.storeId, list);
  }

  for (const people of byStore.values()) {
    people.forEach((person, index) => {
      const date = DEMO_TODAY;
      const current = rows.find((row) => row.staffId === person.id && row.date === date);
      if (!current) return;
      if (index === 0) {
        current.status = "leave";
        current.checkIn = "";
        current.checkOut = "";
        current.hours = 0;
        current.lateMinutes = 0;
        current.note = "Approved leave";
        person.status = "on_leave";
      } else if (index === 1) {
        current.status = "late";
        current.checkIn = addMinutes(person.shiftStart, 28);
        current.checkOut = "";
        current.hours = 0;
        current.lateMinutes = 28;
        current.note = "Late by 28 min · still in shop";
      } else if (index === people.length - 1 && people.length > 3) {
        current.status = "present";
        current.checkIn = addMinutes(person.shiftStart, -2);
        current.checkOut = "15:10";
        current.hours = hoursBetween(current.checkIn, current.checkOut);
        current.lateMinutes = 0;
        current.note = "Left after lunch rush";
      } else {
        current.status = "present";
        current.checkIn = addMinutes(person.shiftStart, -2);
        current.checkOut = "";
        current.hours = 0;
        current.lateMinutes = 0;
        current.note = "On the floor";
      }
    });
  }

  return rows;
}

function bill(
  storeId: string,
  type: UtilityBill["type"],
  amount: number,
  period: string,
  daysUntilDue: number,
  status: UtilityBill["status"],
): UtilityBill {
  const due = new Date("2026-09-27T12:00:00.000Z");
  due.setUTCDate(due.getUTCDate() + daysUntilDue);
  return {
    id: randomUUID(),
    storeId,
    type,
    amount,
    period,
    dueDate: due.toISOString(),
    status,
    note: type === "electricity" ? "Showroom + stockroom meters" : "",
  };
}

function purchase(
  storeId: string,
  itemName: string,
  supplier: string,
  category: string,
  quantity: number,
  unitCost: number,
  daysAgo: number,
): Purchase {
  return {
    id: randomUUID(),
    storeId,
    itemName,
    supplier,
    category,
    quantity,
    unitCost,
    total: quantity * unitCost,
    purchasedAt: iso(daysAgo),
  };
}

function expense(
  storeId: string,
  title: string,
  category: string,
  amount: number,
  daysAgo: number,
): Expense {
  return {
    id: randomUUID(),
    storeId,
    title,
    category,
    amount,
    spentAt: iso(daysAgo),
    note: "",
  };
}

function stock(
  storeId: string,
  sku: string,
  name: string,
  category: string,
  quantity: number,
  reorderLevel: number,
  costPrice: number,
  sellPrice: number,
): InventoryItem {
  const colors = ["Navy", "Ivory", "Black", "Sand", "Wine"];
  const color = colors[sku.length % colors.length];
  return {
    id: `inv_${sku}_${storeId.slice(-5)}`,
    storeId,
    sku,
    name,
    category,
    quantity,
    reserved: Math.max(0, Math.round(quantity * 0.08)),
    damaged: quantity <= reorderLevel ? 1 : 0,
    reorderLevel,
    costPrice,
    sellPrice,
    size: sizeFor(category),
    color,
    bin: quantity <= reorderLevel ? "godown" : "showroom",
    gstRate: gstRateFor(category, sellPrice),
    hsn: hsnFor(category),
  };
}

function customer(
  storeId: string,
  name: string,
  phone: string,
  visits: number,
  totalSpent: number,
  firstDays: number,
  lastDays: number,
): Customer {
  return {
    id: randomUUID(),
    storeId,
    name,
    phone,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.demo`,
    visits,
    totalSpent,
    firstVisit: iso(firstDays),
    lastVisit: iso(lastDays),
  };
}

function sale(
  storeId: string,
  itemName: string,
  quantity: number,
  amount: number,
  channel: Sale["channel"],
  buyer: string,
  daysAgo: number,
  hour: number,
): Sale {
  return {
    id: randomUUID(),
    storeId,
    itemName,
    quantity,
    amount,
    channel,
    customer: buyer,
    soldAt: iso(daysAgo, hour),
  };
}

function shipment(
  storeId: string,
  itemName: string,
  supplier: string,
  quantity: number,
  status: Shipment["status"],
  tracking: string,
  etaDays: number,
  orderedDays: number,
): Shipment {
  const eta = new Date("2026-09-27T12:00:00.000Z");
  eta.setUTCDate(eta.getUTCDate() + etaDays);
  return {
    id: randomUUID(),
    storeId,
    itemName,
    supplier,
    quantity,
    status,
    tracking,
    eta: eta.toISOString(),
    orderedAt: iso(orderedDays),
  };
}

function task(
  storeId: string,
  title: string,
  kind: string,
  cadence: RecurringTask["cadence"],
  nextDays: number,
  lastDays: number | null,
): RecurringTask {
  const next = new Date("2026-09-27T12:00:00.000Z");
  next.setUTCDate(next.getUTCDate() + nextDays);
  return {
    id: randomUUID(),
    storeId,
    title,
    kind,
    cadence,
    lastRun: lastDays === null ? null : iso(lastDays),
    nextRun: next.toISOString(),
    active: true,
  };
}

function order(
  storeId: string,
  name: string,
  city: string,
  total: number,
  status: ShopOrder["status"],
  tracking: string,
  daysAgo: number,
  items: ShopOrder["items"],
): ShopOrder {
  return {
    id: `ord_${randomUUID().slice(0, 8)}`,
    storeId,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.demo`,
    name,
    phone: "98" + Math.floor(100000000 + Math.random() * 899999999).toString().slice(0, 8),
    address: "12 Style Arcade",
    city,
    pincode: "144001",
    country: "India",
    shipping: "india",
    shippingFee: 0,
    total,
    status,
    tracking,
    channel: "online",
    items,
    createdAt: iso(daysAgo, 16),
  };
}

function walkins(storeId: string, itemName: string, amount: number, count: number, buyer: string) {
  return Array.from({ length: count }, (_, index) =>
    sale(
      storeId,
      itemName,
      1,
      amount,
      index % 6 === 0 ? "online" : "store",
      buyer,
      index % 26,
      12 + (index % 8),
    ),
  );
}

export function createAdminState(): AdminState {
  const stores = [
    {
      id: WOMEN,
      slug: "kishanpura-women",
      name: "BMS Fashionz Women",
      city: "Jalandhar",
      address: "Shop 8, Kishanpura Chowk–Lamba Pind Chowk Road",
      phone: "+91 98765 43210",
      manager: "Simran Kaur",
      focus: "Women" as const,
    },
    {
      id: KIDS,
      slug: "kishanpura-kids",
      name: "BMS Fashionz Kids",
      city: "Jalandhar",
      address: "Shop 9, Kishanpura Chowk–Lamba Pind Chowk Road",
      phone: "+91 98765 43211",
      manager: "Pooja Nair",
      focus: "Kids" as const,
    },
    {
      id: MODEL,
      slug: "kishanpura",
      name: "BMS Fashionz",
      city: "Jalandhar",
      address: "Shop 10, Kishanpura Chowk–Lamba Pind Chowk Road",
      phone: "+91 98765 43212",
      manager: "Gurdeep Singh",
      focus: "All" as const,
    },
    {
      id: RAINAK,
      slug: "kishanpura-2",
      name: "BMS Fashionz 2",
      city: "Jalandhar",
      address: "Shop 11, Kishanpura Chowk–Lamba Pind Chowk Road",
      phone: "+91 98765 43213",
      manager: "Harpreet Singh",
      focus: "All" as const,
    },
  ];

  const staffRows: Staff[] = [
    staff(WOMEN, "Simran Kaur", "Store manager", "Women’s floor + styling 11–8", 30000, "98111 10001", 420),
    staff(WOMEN, "Anjali Sharma", "Stylist", "Suits, western, trial room", 22000, "98111 10002", 210),
    staff(WOMEN, "Meera Joshi", "Billing", "Counter + UPI 11–8", 20000, "98111 10003", 180),
    staff(KIDS, "Pooja Nair", "Store manager", "Kids floor + school rush", 26000, "98222 20001", 300),
    staff(KIDS, "Ravi Kumar", "Floor", "Sizes + gift wrapping", 18000, "98222 20002", 140),
    staff(KIDS, "Fatima Qureshi", "Billing", "Counter 11–8", 19000, "98222 20003", 90),
    staff(MODEL, "Gurdeep Singh", "Store manager", "Full family showroom", 34000, "98333 30001", 500),
    staff(MODEL, "Karan Gill", "Floor lead", "Men + women + kids 11–9", 24000, "98333 30002", 160),
    staff(MODEL, "Neha Dutta", "Billing", "Peak evening counter", 21000, "98333 30003", 70),
    staff(MODEL, "Imran Khan", "Warehouse", "Stock + inbound 10–7", 20000, "98333 30004", 200, "10:00", "19:00"),
    staff(RAINAK, "Harpreet Singh", "Store manager", "Bazaar floor + staff roster", 32000, "98444 40001", 380),
    staff(RAINAK, "Sahil Arora", "Floor", "Men + women rush hours", 22000, "98444 40002", 110),
    staff(RAINAK, "Vikram Rao", "Warehouse", "Back godown, same road", 19000, "98444 40003", 250, "10:00", "19:00"),
  ];

  const attendance = seedAttendance(staffRows);

  const payments: StaffPayment[] = [
    ...staffRows.map((person) => ({
      id: randomUUID(),
      storeId: person.storeId,
      staffId: person.id,
      staffName: person.name,
      amount: person.salary,
      period: "2026-08",
      paidAt: iso(30),
      note: "August payroll",
      method: "bank" as const,
    })),
    ...staffRows.map((person) => ({
      id: randomUUID(),
      storeId: person.storeId,
      staffId: person.id,
      staffName: person.name,
      amount: person.salary,
      period: "2026-07",
      paidAt: iso(60),
      note: "July payroll",
      method: "bank" as const,
    })),
  ];

  const bills: UtilityBill[] = [
    bill(WOMEN, "electricity", 14200, "2026-09", 8, "due"),
    bill(WOMEN, "rent", 72000, "2026-09", 3, "due"),
    bill(WOMEN, "internet", 1999, "2026-09", -2, "paid"),
    bill(KIDS, "electricity", 9800, "2026-09", 7, "due"),
    bill(KIDS, "rent", 48000, "2026-09", 4, "paid"),
    bill(MODEL, "electricity", 18600, "2026-09", 5, "due"),
    bill(MODEL, "rent", 95000, "2026-09", 2, "due"),
    bill(MODEL, "internet", 2499, "2026-09", -1, "paid"),
    bill(RAINAK, "electricity", 16800, "2026-09", 6, "due"),
    bill(RAINAK, "rent", 88000, "2026-09", 3, "due"),
    bill(RAINAK, "water", 2400, "2026-09", 10, "due"),
  ];

  const purchases: Purchase[] = [
    purchase(WOMEN, "Silk suit set lot", "Amritsar Weaves", "suits", 30, 1400, 12),
    purchase(WOMEN, "Western dresses", "BMS Atelier", "dresses", 18, 1100, 8),
    purchase(WOMEN, "Heels restock", "Stride Co", "shoes", 16, 980, 5),
    purchase(WOMEN, "Tote + clutch crate", "Hide & Co", "bags", 14, 620, 3),
    purchase(KIDS, "Kids tee pack", "Little North", "kids", 40, 280, 9),
    purchase(KIDS, "School shoes", "Stride Co", "shoes", 24, 420, 6),
    purchase(KIDS, "Frocks + sets", "Little North", "kids", 20, 540, 3),
    purchase(KIDS, "Winter jackets sample", "Little North", "kids", 10, 780, 1),
    purchase(MODEL, "Ivory Oxford Shirt lot", "Northweave", "shirts", 36, 890, 10),
    purchase(MODEL, "Stone chinos", "TailorHouse", "pants", 20, 1100, 7),
    purchase(MODEL, "Kids + women mix crate", "BMS Atelier", "outfits", 12, 1600, 4),
    purchase(MODEL, "Sneaker restock", "Stride Co", "shoes", 12, 1800, 2),
    purchase(RAINAK, "Midnight poplin shirts", "Northweave", "shirts", 28, 980, 11),
    purchase(RAINAK, "Italian leather belts", "Hide & Co", "belts", 18, 540, 6),
    purchase(RAINAK, "Family weekend looks", "BMS Atelier", "outfits", 10, 2400, 2),
    purchase(RAINAK, "Perfume counter fill", "Scent Lab", "perfumes", 16, 640, 4),
  ];

  const expenses: Expense[] = [
    expense(WOMEN, "Trial-room mirrors", "visual", 6200, 11),
    expense(WOMEN, "Instagram reel shoot", "marketing", 4500, 5),
    expense(WOMEN, "Mannequin wigs", "visual", 1800, 14),
    expense(KIDS, "Balloon weekend stall", "marketing", 2800, 8),
    expense(KIDS, "Gift wrap stock", "welfare", 1200, 3),
    expense(KIDS, "School-season banners", "marketing", 2200, 12),
    expense(MODEL, "Window mannequin refresh", "visual", 8500, 9),
    expense(MODEL, "Local Facebook ads", "marketing", 6000, 4),
    expense(MODEL, "AC service Shop 10", "maintenance", 3400, 16),
    expense(RAINAK, "Signboard LED", "maintenance", 7400, 6),
    expense(RAINAK, "Staff tea + water", "welfare", 1800, 2),
    expense(RAINAK, "Sunday flyer print", "marketing", 1500, 10),
  ];

  const inventory: InventoryItem[] = [
    stock(WOMEN, "WS-SLT-01", "Silk Suit Set", "suits", 18, 8, 1400, 3499),
    stock(WOMEN, "WS-COT-02", "Cotton Daily Suit", "suits", 22, 10, 890, 2199),
    stock(WOMEN, "WD-FLR-01", "Floral Western Dress", "dresses", 9, 8, 1100, 2799),
    stock(WOMEN, "WD-BLK-02", "Black Party Dress", "dresses", 6, 5, 1500, 3299),
    stock(WOMEN, "WH-NUD-01", "Nude Block Heels", "shoes", 4, 6, 980, 2299),
    stock(WOMEN, "WB-TOTE-01", "Tan Tote Bag", "bags", 11, 5, 720, 1899),
    stock(WOMEN, "PF-ROS-01", "Rose Ember", "perfumes", 14, 6, 640, 1999),
    stock(WOMEN, "WL-DUP-01", "Banarasi Dupatta", "suits", 16, 6, 420, 1299),
    stock(KIDS, "KT-TEE-01", "Kids Graphic Tee", "kids", 32, 12, 280, 799),
    stock(KIDS, "KT-TEE-02", "School Polo", "kids", 20, 10, 320, 899),
    stock(KIDS, "KF-FRK-01", "Printed Frock", "kids", 16, 8, 540, 1299),
    stock(KIDS, "KS-SCH-01", "School Shoes", "shoes", 5, 10, 420, 999),
    stock(KIDS, "KP-SET-01", "Boys Shorts Set", "kids", 14, 8, 360, 899),
    stock(KIDS, "KJ-WIN-01", "Kids Winter Jacket", "kids", 3, 6, 780, 1799),
    stock(KIDS, "KB-CAP-01", "Cartoon Cap", "kids", 24, 8, 90, 299),
    stock(MODEL, "SH-IVO-01", "Ivory Oxford Shirt", "shirts", 22, 10, 890, 1899),
    stock(MODEL, "SH-MID-01", "Midnight Poplin Shirt", "shirts", 14, 8, 980, 2199),
    stock(MODEL, "PT-STN-01", "Stone Stretch Chinos", "pants", 15, 8, 1100, 2299),
    stock(MODEL, "WD-FLR-01", "Floral Western Dress", "dresses", 8, 6, 1100, 2799),
    stock(MODEL, "KT-TEE-01", "Kids Graphic Tee", "kids", 18, 10, 280, 799),
    stock(MODEL, "SH-COG-01", "Cognac City Sneakers", "shoes", 5, 8, 1800, 3499),
    stock(MODEL, "BL-ITL-01", "Italian Leather Belt", "belts", 13, 6, 540, 1299),
    stock(MODEL, "PF-NOI-01", "Noir Oud", "perfumes", 10, 6, 720, 1899),
    stock(RAINAK, "SH-MID-01", "Midnight Poplin Shirt", "shirts", 19, 8, 980, 2199),
    stock(RAINAK, "SH-SAN-01", "Sand Linen Shirt", "shirts", 11, 6, 1200, 2499),
    stock(RAINAK, "BL-ITL-01", "Italian Leather Belt", "belts", 12, 6, 540, 1299),
    stock(RAINAK, "OU-FAM-01", "Family Weekend Look", "outfits", 6, 5, 2400, 5499),
    stock(RAINAK, "WS-SLT-01", "Silk Suit Set", "suits", 7, 6, 1400, 3499),
    stock(RAINAK, "KS-SCH-01", "School Shoes", "shoes", 9, 8, 420, 999),
    stock(RAINAK, "PT-INK-01", "Ink Tailored Trousers", "pants", 8, 6, 1300, 2799),
    stock(RAINAK, "PF-VET-01", "White Vetiver", "perfumes", 12, 5, 640, 1699),
  ];

  const stockMoves: StockMove[] = inventory.flatMap((item, index) => {
    const inbound: StockMove = {
      id: `mv_in_${item.id}`,
      storeId: item.storeId,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: "in",
      quantity: item.quantity + 8,
      note: "Received from supplier",
      at: iso(8 + (index % 6)),
      ref: "purchase",
    };
    const sold: StockMove = {
      id: `mv_out_${item.id}`,
      storeId: item.storeId,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: "out",
      quantity: 6 + (index % 4),
      note: "Sold from showroom",
      at: iso(2 + (index % 5)),
      ref: "sale",
    };
    if (!item.damaged) return [inbound, sold];
    return [
      inbound,
      sold,
      {
        id: `mv_dmg_${item.id}`,
        storeId: item.storeId,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: "damage" as const,
        quantity: item.damaged,
        note: "Trial-room damage",
        at: iso(1),
        ref: "adjust",
      },
    ];
  });

  const supplierGstin: Record<string, string> = {
    "Amritsar Weaves": "03AABCA1234D1Z5",
    "BMS Atelier": "03AABCB5678E1Z2",
    "Stride Co": "07AABCS9012F1Z8",
    "Hide & Co": "03AABCH3456G1Z1",
    "Little North": "03AABCL7890H1Z6",
    Northweave: "03AABCN2345I1Z3",
    TailorHouse: "03AABCT6789J1Z9",
    "Scent Lab": "27AABCP0123K1Z4",
  };

  const payables: Payable[] = [
    ...purchases.map((row, index) => {
      const rate = gstRateFor(row.category);
      const taxAmount = taxOn(row.total, rate);
      const total = row.total + taxAmount;
      const paid = index % 3 === 0;
      return {
        id: `pay_${row.id}`,
        storeId: row.storeId,
        kind: "supplier" as const,
        party: row.supplier,
        title: row.itemName,
        amount: row.total,
        taxRate: rate,
        taxAmount,
        total,
        paidAmount: paid ? total : 0,
        dueDate: iso(index % 2 === 0 ? 4 : -6).slice(0, 10),
        period: "2026-09",
        status: paid ? ("paid" as const) : index % 2 === 0 ? ("overdue" as const) : ("due" as const),
        method: paid ? ("bank" as const) : ("" as const),
        invoiceNo: `INV-26-${String(index + 41).padStart(3, "0")}`,
        gstin: supplierGstin[row.supplier] ?? "",
        note: paid ? "Paid on delivery" : "Stock received, bill open",
        refId: row.id,
        paidAt: paid ? iso(index + 1) : null,
      };
    }),
    ...[WOMEN, KIDS, MODEL, RAINAK].map((storeId, index) => {
      const amount = 18000 + index * 4200;
      const taxAmount = 0;
      return {
        id: `pay_gst_${storeId}`,
        storeId,
        kind: "tax" as const,
        party: "GST",
        title: "GST for September (sales tax minus tax already paid on stock)",
        amount,
        taxRate: 0,
        taxAmount,
        total: amount,
        paidAmount: 0,
        dueDate: "2026-10-20",
        period: "2026-09",
        status: "due" as const,
        method: "" as const,
        invoiceNo: `GSTR-09-${index + 1}`,
        gstin: "03AABC B0000Z1Z1".replace(" ", ""),
        note: "Pay to government by 20 Oct",
        refId: storeId,
        paidAt: null,
      };
    }),
  ];

  const customers: Customer[] = [
    customer(WOMEN, "Navneet Kaur", "98140 11111", 1, 3499, 4, 4),
    customer(WOMEN, "Anjali Sharma", "98140 11112", 7, 21400, 160, 2),
    customer(WOMEN, "Isha Verma", "98140 11113", 4, 9800, 80, 6),
    customer(WOMEN, "Baljit Kaur", "98140 11116", 9, 31200, 220, 1),
    customer(WOMEN, "Ritika Malhotra", "98140 11117", 1, 2299, 2, 2),
    customer(WOMEN, "Harleen Gill", "98140 11118", 5, 16800, 110, 3),
    customer(WOMEN, "Sonia Bedi", "98140 11119", 3, 7400, 45, 8),
    customer(WOMEN, "Tanya Kapoor", "98140 11120", 1, 2799, 0, 0),
    customer(KIDS, "Rohit Bansal", "98150 22221", 1, 999, 2, 2),
    customer(KIDS, "Pooja Nair", "98150 22222", 6, 7200, 90, 3),
    customer(KIDS, "Dev Patel", "98150 22223", 3, 3100, 40, 5),
    customer(KIDS, "Manav Sood", "98150 22224", 4, 4800, 60, 1),
    customer(KIDS, "Kiran Joshi", "98150 22225", 1, 1299, 3, 3),
    customer(KIDS, "Aman Khanna", "98150 22226", 8, 9100, 180, 0),
    customer(KIDS, "Neha Dutta", "98150 22227", 2, 1798, 20, 7),
    customer(MODEL, "Arjun Mehta", "98160 33331", 8, 24600, 200, 1),
    customer(MODEL, "Simran Kaur", "98160 33332", 1, 1899, 1, 1),
    customer(MODEL, "Karan Gill", "98160 33333", 5, 16200, 90, 3),
    customer(MODEL, "Kabir Singh", "98160 33334", 6, 19800, 130, 2),
    customer(MODEL, "Riya Sen", "98160 33335", 1, 1899, 0, 0),
    customer(MODEL, "Gurpreet Brar", "98160 33336", 4, 11200, 70, 6),
    customer(MODEL, "Pallavi Nanda", "98160 33337", 3, 8600, 50, 9),
    customer(MODEL, "Jatin Sharma", "98160 33338", 7, 22100, 150, 4),
    customer(RAINAK, "Meera Joshi", "98170 44441", 9, 28600, 240, 0),
    customer(RAINAK, "Harsh Vardhan", "98170 44442", 1, 2199, 3, 3),
    customer(RAINAK, "Ananya Rao", "98170 44443", 4, 15400, 70, 2),
    customer(RAINAK, "Aman Khanna", "98170 44444", 5, 17600, 95, 1),
    customer(RAINAK, "Sandeep Toor", "98170 44445", 1, 2499, 5, 5),
    customer(RAINAK, "Priya Bhalla", "98170 44446", 6, 19850, 140, 3),
    customer(RAINAK, "Varun Sethi", "98170 44447", 3, 6900, 35, 8),
  ];

  const sales: Sale[] = [
    sale(WOMEN, "Silk Suit Set", 1, 3499, "store", "Navneet Kaur", 4, 13),
    sale(WOMEN, "Silk Suit Set", 1, 3499, "store", "Baljit Kaur", 1, 16),
    sale(WOMEN, "Silk Suit Set", 2, 6998, "store", "Harleen Gill", 8, 18),
    sale(WOMEN, "Cotton Daily Suit", 1, 2199, "store", "Sonia Bedi", 3, 12),
    sale(WOMEN, "Cotton Daily Suit", 2, 4398, "store", "Anjali Sharma", 10, 15),
    sale(WOMEN, "Floral Western Dress", 1, 2799, "store", "Anjali Sharma", 2, 17),
    sale(WOMEN, "Floral Western Dress", 1, 2799, "online", "Tanya Kapoor", 0, 21),
    sale(WOMEN, "Black Party Dress", 1, 3299, "store", "Baljit Kaur", 6, 19),
    sale(WOMEN, "Nude Block Heels", 1, 2299, "store", "Ritika Malhotra", 2, 14),
    sale(WOMEN, "Nude Block Heels", 1, 2299, "store", "Isha Verma", 11, 17),
    sale(WOMEN, "Tan Tote Bag", 1, 1899, "store", "Harleen Gill", 5, 13),
    sale(WOMEN, "Rose Ember", 1, 1999, "store", "Isha Verma", 6, 15),
    sale(WOMEN, "Rose Ember", 2, 3998, "store", "Anjali Sharma", 14, 18),
    sale(WOMEN, "Banarasi Dupatta", 2, 2598, "store", "Sonia Bedi", 7, 12),
    sale(WOMEN, "Silk Suit Set", 1, 3499, "online", "Baljit Kaur", 9, 20),
    sale(WOMEN, "Cotton Daily Suit", 1, 2199, "store", "Navneet Kaur", 16, 11),
    sale(WOMEN, "Floral Western Dress", 1, 2799, "store", "Harleen Gill", 18, 16),
    sale(WOMEN, "Black Party Dress", 1, 3299, "store", "Tanya Kapoor", 20, 19),
    sale(WOMEN, "Tan Tote Bag", 1, 1899, "store", "Ritika Malhotra", 13, 15),
    sale(WOMEN, "Banarasi Dupatta", 1, 1299, "store", "Isha Verma", 22, 12),
    sale(KIDS, "School Shoes", 2, 1998, "store", "Rohit Bansal", 2, 12),
    sale(KIDS, "School Shoes", 1, 999, "store", "Kiran Joshi", 3, 11),
    sale(KIDS, "School Shoes", 2, 1998, "store", "Aman Khanna", 8, 17),
    sale(KIDS, "Printed Frock", 1, 1299, "store", "Pooja Nair", 3, 16),
    sale(KIDS, "Printed Frock", 2, 2598, "store", "Neha Dutta", 7, 14),
    sale(KIDS, "Printed Frock", 1, 1299, "online", "Manav Sood", 2, 20),
    sale(KIDS, "Kids Graphic Tee", 3, 2397, "store", "Dev Patel", 1, 18),
    sale(KIDS, "Kids Graphic Tee", 2, 1598, "store", "Pooja Nair", 5, 13),
    sale(KIDS, "Kids Graphic Tee", 4, 3196, "store", "Aman Khanna", 9, 16),
    sale(KIDS, "School Polo", 2, 1798, "store", "Manav Sood", 4, 12),
    sale(KIDS, "Boys Shorts Set", 2, 1798, "store", "Dev Patel", 6, 15),
    sale(KIDS, "Kids Winter Jacket", 1, 1799, "store", "Pooja Nair", 0, 17),
    sale(KIDS, "Cartoon Cap", 3, 897, "store", "Rohit Bansal", 1, 14),
    sale(KIDS, "School Polo", 1, 899, "store", "Kiran Joshi", 11, 12),
    sale(KIDS, "Boys Shorts Set", 1, 899, "store", "Neha Dutta", 14, 16),
    sale(KIDS, "Kids Graphic Tee", 2, 1598, "online", "Aman Khanna", 12, 21),
    sale(KIDS, "Printed Frock", 1, 1299, "store", "Pooja Nair", 18, 15),
    sale(KIDS, "School Shoes", 1, 999, "store", "Manav Sood", 20, 11),
    sale(MODEL, "Ivory Oxford Shirt", 1, 1899, "store", "Simran Kaur", 1, 14),
    sale(MODEL, "Ivory Oxford Shirt", 2, 3798, "store", "Jatin Sharma", 3, 16),
    sale(MODEL, "Ivory Oxford Shirt", 1, 1899, "online", "Riya Sen", 0, 21),
    sale(MODEL, "Midnight Poplin Shirt", 1, 2199, "store", "Kabir Singh", 2, 18),
    sale(MODEL, "Midnight Poplin Shirt", 2, 4398, "store", "Gurpreet Brar", 6, 15),
    sale(MODEL, "Stone Stretch Chinos", 1, 2299, "store", "Karan Gill", 4, 13),
    sale(MODEL, "Stone Stretch Chinos", 1, 2299, "store", "Arjun Mehta", 8, 19),
    sale(MODEL, "Cognac City Sneakers", 1, 3499, "online", "Arjun Mehta", 1, 21),
    sale(MODEL, "Cognac City Sneakers", 1, 3499, "store", "Jatin Sharma", 7, 17),
    sale(MODEL, "Kids Graphic Tee", 2, 1598, "store", "Karan Gill", 5, 13),
    sale(MODEL, "Floral Western Dress", 1, 2799, "store", "Pallavi Nanda", 3, 16),
    sale(MODEL, "Floral Western Dress", 1, 2799, "store", "Simran Kaur", 9, 14),
    sale(MODEL, "Italian Leather Belt", 1, 1299, "store", "Kabir Singh", 2, 12),
    sale(MODEL, "Noir Oud", 2, 3798, "store", "Arjun Mehta", 4, 20),
    sale(MODEL, "Ivory Oxford Shirt", 1, 1899, "store", "Gurpreet Brar", 11, 15),
    sale(MODEL, "Midnight Poplin Shirt", 1, 2199, "store", "Jatin Sharma", 13, 18),
    sale(MODEL, "Stone Stretch Chinos", 1, 2299, "online", "Kabir Singh", 15, 21),
    sale(MODEL, "Kids Graphic Tee", 3, 2397, "store", "Pallavi Nanda", 16, 12),
    sale(MODEL, "Noir Oud", 1, 1899, "store", "Karan Gill", 18, 19),
    sale(MODEL, "Italian Leather Belt", 2, 2598, "store", "Arjun Mehta", 20, 14),
    sale(MODEL, "Cognac City Sneakers", 1, 3499, "store", "Gurpreet Brar", 22, 17),
    sale(RAINAK, "Midnight Poplin Shirt", 2, 4398, "store", "Harsh Vardhan", 3, 14),
    sale(RAINAK, "Midnight Poplin Shirt", 1, 2199, "store", "Sandeep Toor", 5, 12),
    sale(RAINAK, "Sand Linen Shirt", 1, 2499, "store", "Varun Sethi", 1, 16),
    sale(RAINAK, "Family Weekend Look", 1, 5499, "online", "Meera Joshi", 0, 19),
    sale(RAINAK, "Family Weekend Look", 1, 5499, "store", "Aman Khanna", 6, 18),
    sale(RAINAK, "Silk Suit Set", 1, 3499, "store", "Ananya Rao", 2, 17),
    sale(RAINAK, "Silk Suit Set", 1, 3499, "store", "Priya Bhalla", 8, 15),
    sale(RAINAK, "Italian Leather Belt", 2, 2598, "store", "Meera Joshi", 4, 13),
    sale(RAINAK, "Ink Tailored Trousers", 1, 2799, "store", "Varun Sethi", 7, 19),
    sale(RAINAK, "White Vetiver", 2, 3398, "store", "Priya Bhalla", 3, 16),
    sale(RAINAK, "School Shoes", 2, 1998, "store", "Ananya Rao", 9, 12),
    sale(RAINAK, "Sand Linen Shirt", 1, 2499, "online", "Harsh Vardhan", 10, 21),
    sale(RAINAK, "Midnight Poplin Shirt", 1, 2199, "store", "Aman Khanna", 12, 14),
    sale(RAINAK, "Italian Leather Belt", 1, 1299, "store", "Sandeep Toor", 14, 13),
    sale(RAINAK, "White Vetiver", 1, 1699, "store", "Meera Joshi", 16, 18),
    sale(RAINAK, "Ink Tailored Trousers", 1, 2799, "store", "Priya Bhalla", 18, 17),
    sale(RAINAK, "Silk Suit Set", 1, 3499, "store", "Ananya Rao", 21, 15),
    sale(RAINAK, "Family Weekend Look", 1, 5499, "store", "Meera Joshi", 23, 19),
    ...walkins(WOMEN, "Silk Suit Set", 3499, 28, "Walk-in Shop 8"),
    ...walkins(WOMEN, "Cotton Daily Suit", 2199, 22, "Walk-in Shop 8"),
    ...walkins(WOMEN, "Floral Western Dress", 2799, 12, "Walk-in Shop 8"),
    ...walkins(KIDS, "Kids Graphic Tee", 799, 36, "Walk-in Shop 9"),
    ...walkins(KIDS, "Printed Frock", 1299, 18, "Walk-in Shop 9"),
    ...walkins(KIDS, "School Shoes", 999, 20, "Walk-in Shop 9"),
    ...walkins(MODEL, "Ivory Oxford Shirt", 1899, 30, "Walk-in Shop 10"),
    ...walkins(MODEL, "Stone Stretch Chinos", 2299, 18, "Walk-in Shop 10"),
    ...walkins(MODEL, "Cognac City Sneakers", 3499, 10, "Walk-in Shop 10"),
    ...walkins(RAINAK, "Midnight Poplin Shirt", 2199, 26, "Walk-in Shop 11"),
    ...walkins(RAINAK, "Family Weekend Look", 5499, 8, "Walk-in Shop 11"),
    ...walkins(RAINAK, "Silk Suit Set", 3499, 12, "Walk-in Shop 11"),
  ];

  const shipments: Shipment[] = [
    shipment(WOMEN, "Silk suit restock", "Amritsar Weaves", 20, "in_transit", "AW-44110", 2, 5),
    shipment(WOMEN, "Heels + tote crate", "Stride Co", 14, "shipped", "ST-88102", 5, 2),
    shipment(KIDS, "School shoes", "Stride Co", 30, "shipped", "ST-22910", 4, 3),
    shipment(KIDS, "Winter jackets", "Little North", 16, "ordered", "LN-5501", 8, 1),
    shipment(MODEL, "Oxford + chino crate", "Northweave", 24, "ordered", "NW-88421", 6, 1),
    shipment(MODEL, "Sneaker restock", "Stride Co", 12, "in_transit", "ST-22988", 1, 4),
    shipment(RAINAK, "Family weekend looks", "BMS Atelier", 8, "in_transit", "AT-10044", 1, 4),
    shipment(RAINAK, "Belt restock", "Hide & Co", 16, "delivered", "HD-2201", -1, 9),
    shipment(RAINAK, "Perfume counter fill", "Scent Lab", 20, "shipped", "SL-909", 3, 2),
  ];

  const tasks: RecurringTask[] = [
    task(WOMEN, "Pay Shop 8 electricity", "utilities", "monthly", 8, 28),
    task(WOMEN, "New suit drop WhatsApp", "crm", "weekly", 1, 6),
    task(KIDS, "School-season restock check", "inventory", "weekly", 0, 7),
    task(KIDS, "Run kids payroll", "payroll", "monthly", 3, 30),
    task(MODEL, "Pay Shop 10 electricity", "utilities", "monthly", 5, 27),
    task(MODEL, "Run staff payroll", "payroll", "monthly", 3, 30),
    task(MODEL, "Reorder low stock", "inventory", "weekly", 0, 7),
    task(RAINAK, "Shop 11 rent + power", "utilities", "monthly", 6, 26),
    task(RAINAK, "Follow regulars with new drop", "crm", "weekly", 2, 5),
  ];

  const orders: ShopOrder[] = [
    order(WOMEN, "Tanya Kapoor", "Jalandhar", 2799, "packed", "", 0, [
      { productId: "prod-floral-western-dress", name: "Floral Western Dress", price: 2799, quantity: 1, size: "M" },
    ]),
    order(WOMEN, "Baljit Kaur", "Jalandhar", 3499, "shipped", "BMS-W-1008", 1, [
      { productId: "prod_silk-suit-set", name: "Silk Suit Set", price: 3499, quantity: 1, size: "L" },
    ]),
    order(WOMEN, "Ritika Malhotra", "Jalandhar", 2299, "delivered", "BMS-W-0991", 8, [
      { productId: "prod-nude-block-heels", name: "Nude Block Heels", price: 2299, quantity: 1, size: "6" },
    ]),
    order(KIDS, "Manav Sood", "Jalandhar", 1299, "shipped", "BMS-K-2044", 2, [
      { productId: "prod-printed-frock", name: "Printed Frock", price: 1299, quantity: 1, size: "5-6Y" },
    ]),
    order(KIDS, "Aman Khanna", "Jalandhar", 2397, "in_transit", "BMS-K-2050", 3, [
      { productId: "prod-kids-graphic-tee", name: "Kids Graphic Tee", price: 799, quantity: 3, size: "6-7Y" },
    ]),
    order(KIDS, "Kiran Joshi", "Jalandhar", 999, "placed", "", 0, [
      { productId: "prod-school-shoes", name: "School Shoes", price: 999, quantity: 1, size: "12" },
    ]),
    order(MODEL, "Kabir Singh", "Jalandhar", 3499, "shipped", "BMS-M-1001", 1, [
      { productId: "prod_cognac-city-sneakers", name: "Cognac City Sneakers", price: 3499, quantity: 1, size: "9" },
    ]),
    order(MODEL, "Riya Sen", "Jalandhar", 1899, "placed", "", 0, [
      { productId: "prod_ivory-oxford-shirt", name: "Ivory Oxford Shirt", price: 1899, quantity: 1, size: "M" },
    ]),
    order(MODEL, "Jatin Sharma", "Jalandhar", 4398, "packed", "", 1, [
      { productId: "prod_ivory-oxford-shirt", name: "Ivory Oxford Shirt", price: 1899, quantity: 1, size: "L" },
      { productId: "prod_midnight-poplin-shirt", name: "Midnight Poplin Shirt", price: 2199, quantity: 1, size: "L" },
    ]),
    order(MODEL, "Arjun Mehta", "Jalandhar", 3798, "delivered", "BMS-M-0882", 9, [
      { productId: "prod_noir-oud", name: "Noir Oud", price: 1899, quantity: 2, size: "50ml" },
    ]),
    order(RAINAK, "Aman Khanna", "Jalandhar", 5499, "in_transit", "BMS-2-3310", 3, [
      { productId: "ou-fam-01", name: "Family Weekend Look", price: 5499, quantity: 1, size: "L" },
    ]),
    order(RAINAK, "Meera Joshi", "Jalandhar", 5499, "delivered", "BMS-2-3188", 10, [
      { productId: "ou-fam-01", name: "Family Weekend Look", price: 5499, quantity: 1, size: "M" },
    ]),
    order(RAINAK, "Sandeep Toor", "Jalandhar", 2499, "placed", "", 0, [
      { productId: "prod_sand-linen-shirt", name: "Sand Linen Shirt", price: 2499, quantity: 1, size: "XL" },
    ]),
    {
      id: "bms-nri-001",
      storeId: MODEL,
      email: "nri@bmsfashionz.demo",
      name: "Jaspreet Brar",
      phone: "+1 416 555 0199",
      address: "88 Harbour Street, Apt 1904",
      city: "Toronto",
      pincode: "M5J 0B1",
      country: "Canada",
      shipping: "international",
      shippingFee: 2499,
      total: 8297,
      status: "shipped",
      tracking: "DHL-NRI-88421",
      channel: "online",
      items: [
        { productId: "prod_silk-suit-set", name: "Silk Suit Set", price: 3499, quantity: 1, size: "M" },
        { productId: "prod_ivory-oxford-shirt", name: "Ivory Oxford Shirt", price: 1899, quantity: 1, size: "L" },
        { productId: "prod_rose-ember", name: "Rose Ember", price: 1999, quantity: 1, size: "50ml" },
      ],
      createdAt: iso(2, 18),
    },
    {
      id: "bms-pos-001",
      storeId: MODEL,
      email: "walkin.raj@mail.demo",
      name: "Rajveer Singh",
      phone: "+91 98140 22011",
      address: "Shop 10, Kishanpura Chowk–Lamba Pind Chowk Road",
      city: "Jalandhar",
      pincode: "144001",
      country: "India",
      shipping: "india",
      shippingFee: 0,
      total: 5398,
      status: "delivered",
      tracking: "",
      channel: "store",
      cashierId: "usr_staff10",
      cashierName: "Rohit Sharma",
      items: [
        { productId: "prod_ivory-oxford-shirt", name: "Ivory Oxford Shirt", price: 1899, quantity: 1, size: "L" },
        { productId: "prod_cognac-city-sneakers", name: "Cognac City Sneakers", price: 3499, quantity: 1, size: "9" },
      ],
      createdAt: iso(0, 15),
    },
  ];

  return {
    stores,
    staff: staffRows,
    attendance,
    payments,
    payables,
    bills,
    purchases,
    expenses,
    inventory,
    stockMoves,
    customers,
    sales,
    shipments,
    tasks,
    orders,
  };
}

export const adminState = createAdminState();
