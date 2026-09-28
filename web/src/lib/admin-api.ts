import { API } from "@/lib/api-base";
import { getAuthToken } from "@/lib/session";

function token() {
  return getAuthToken();
}

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = token();
  const response = await fetch(`${API}/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Admin request failed");
  }

  return response.json() as Promise<T>;
}

export type StoreCard = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
  focus: "Women" | "Kids" | "All";
  earned: number;
  spent: number;
  profit: number;
  newCustomers: number;
  regularCustomers: number;
  openOrders: number;
  lowStock: number;
};

export type Overview = {
  store: {
    id: string;
    slug: string;
    name: string;
    city: string;
    manager: string;
    address: string;
    phone: string;
    focus: "Women" | "Kids" | "All";
  };
  totals: {
    earned: number;
    spent: number;
    profit: number;
    electricity: number;
    staffBill: number;
    purchaseSpend: number;
    extraSpend: number;
    newCustomers: number;
    regularCustomers: number;
    openOrders: number;
  };
  alerts: { lowStock: number; billsDue: number; inbound: number; tasksDue: number };
  floor?: {
    now: string;
    inNow: number;
    people: { id: string; name: string; role: string; cameAt: string; hoursSoFar: number; late: boolean; lateMinutes: number }[];
  };
  patterns: {
    topItems: { name: string; units: number }[];
    bestDays: { day: string; amount: number }[];
    repeatRate: number;
    onlineShare: number;
  };
};

export const adminApi = {
  stores: () => adminRequest<StoreCard[]>("/stores"),
  overview: (storeId: string) => adminRequest<Overview>(`/stores/${storeId}/overview`),
  list: <T>(storeId: string, resource: string) => adminRequest<T>(`/stores/${storeId}/${resource}`),
  create: <T>(storeId: string, resource: string, body: unknown) =>
    adminRequest<T>(`/stores/${storeId}/${resource}`, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(storeId: string, resource: string, id: string, body: unknown) =>
    adminRequest<T>(`/stores/${storeId}/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  runTask: (storeId: string, id: string) =>
    adminRequest(`/stores/${storeId}/tasks/${id}/run`, { method: "POST" }),
  desks: () =>
    adminRequest<{ id: string; name: string; email: string; storeName?: string; storeId?: string }[]>("/desks"),
  createDesk: (body: { name: string; email: string; password: string; storeId: string }) =>
    adminRequest("/desks", { method: "POST", body: JSON.stringify(body) }),
  team: (storeId: string, month: string) =>
    adminRequest<TeamBoard>(`/stores/${storeId}/team?month=${month}`),
  teamPerson: (storeId: string, staffId: string, month: string) =>
    adminRequest<TeamPerson>(`/stores/${storeId}/team/${staffId}?month=${month}&year=2026`),
  markDay: (
    storeId: string,
    body: {
      staffId: string;
      date?: string;
      status?: AttendanceStatus;
      checkIn?: string;
      checkOut?: string;
      note?: string;
      action?: "in" | "out" | "leave" | "absent" | "half_day";
    },
  ) => adminRequest(`/stores/${storeId}/attendance`, { method: "POST", body: JSON.stringify(body) }),
  clock: (
    storeId: string,
    body: { staffId: string; action: "in" | "out" | "leave" | "absent"; time?: string },
  ) => adminRequest(`/stores/${storeId}/clock`, { method: "POST", body: JSON.stringify(body) }),
  payQueue: (storeId: string, month: string) =>
    adminRequest<StaffPayQueue>(`/stores/${storeId}/pay-queue?month=${month}`),
  payStaff: (
    storeId: string,
    body: { staffId: string; period?: string; amount?: number; method?: string; note?: string },
  ) => adminRequest(`/stores/${storeId}/pay-staff`, { method: "POST", body: JSON.stringify(body) }),
  money: (storeId: string, month: string) =>
    adminRequest<MoneyBoard>(`/stores/${storeId}/money?month=${month}`),
  settle: (
    storeId: string,
    body: { source: "staff" | "bill" | "payable"; refId: string; amount?: number; method?: string; period?: string },
  ) => adminRequest(`/stores/${storeId}/settle`, { method: "POST", body: JSON.stringify(body) }),
  stock: (storeId: string) => adminRequest<StockBoard>(`/stores/${storeId}/stock`),
  receiveStock: (storeId: string, body: unknown) =>
    adminRequest(`/stores/${storeId}/stock/receive`, { method: "POST", body: JSON.stringify(body) }),
  moveStock: (storeId: string, body: unknown) =>
    adminRequest(`/stores/${storeId}/stock/move`, { method: "POST", body: JSON.stringify(body) }),
};

export type AttendanceStatus = "present" | "late" | "half_day" | "leave" | "absent";

export type Attendance = {
  id: string;
  staffId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  hours: number;
  lateMinutes: number;
  note: string;
};

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

export type TeamPersonCard = {
  id: string;
  name: string;
  role: string;
  duty: string;
  salary: number;
  phone: string;
  status: string;
  shiftStart: string;
  shiftEnd: string;
  today: Attendance | null;
  inShop: boolean;
  cameAt: string;
  leftAt: string;
  hoursSoFar: number;
  month: MonthStats;
};

export type TeamBoard = {
  month: string;
  today: string;
  now: string;
  kpis: {
    inNow: number;
    inShop: number;
    late: number;
    onLeave: number;
    absent: number;
    leftShop: number;
    hoursToday: number;
    due: number;
    paid: number;
    remaining: number;
  };
  people: TeamPersonCard[];
};

export type TeamPerson = {
  person: {
    id: string;
    name: string;
    role: string;
    duty: string;
    salary: number;
    phone: string;
    status: string;
    joinedAt: string;
    shiftStart: string;
    shiftEnd: string;
  };
  month: string;
  today: Attendance | null;
  days: Attendance[];
  monthStats: MonthStats;
  year: {
    year: number;
    months: MonthStats[];
    totals: {
      presentDays: number;
      lateDays: number;
      leaveDays: number;
      absentDays: number;
      hours: number;
      due: number;
      paid: number;
    };
  };
  payments: { id: string; amount: number; period: string; paidAt: string; note: string; method?: string }[];
};

export type StaffPayRow = {
  staffId: string;
  name: string;
  role: string;
  phone: string;
  period: string;
  dueDate: string;
  days: number;
  due: number;
  paid: number;
  remaining: number;
  status: string;
};

export type StaffPayQueue = {
  month: string;
  today: string;
  kpis: { people: number; toPay: number; overdue: number; dueSoon: number };
  queue: StaffPayRow[];
};

export type MoneyRow = {
  id: string;
  source: "staff" | "bill" | "payable";
  kind: string;
  party: string;
  title: string;
  amount: number;
  tax: number;
  total: number;
  remaining: number;
  dueDate: string;
  days: number;
  status: string;
  invoiceNo: string;
  gstin: string;
  refId: string;
  period: string;
};

export type MoneyBoard = {
  month: string;
  today: string;
  kpis: {
    toPay: number;
    overdue: number;
    dueSoon: number;
    staffPay: number;
    stockBills: number;
    taxDue: number;
  };
  tax: { collected: number; inputCredit: number; net: number };
  queue: MoneyRow[];
};

export type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reserved: number;
  damaged: number;
  available: number;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  stockValue: number;
  sellValue: number;
  size: string;
  color: string;
  bin: string;
  gstRate: number;
  hsn: string;
  status: string;
};

export type StockMove = {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: string;
  quantity: number;
  note: string;
  at: string;
};

export type StockBoard = {
  items: StockItem[];
  moves: StockMove[];
  kpis: {
    pieces: number;
    available: number;
    stockValue: number;
    low: number;
    out: number;
    reserved: number;
    damaged: number;
  };
  reorder: StockItem[];
};
