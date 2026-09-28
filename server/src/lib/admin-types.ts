export type StoreFocus = "Women" | "Kids" | "All";

export type Store = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
  focus: StoreFocus;
};

export type AttendanceStatus = "present" | "late" | "half_day" | "leave" | "absent";

export type Staff = {
  id: string;
  storeId: string;
  name: string;
  role: string;
  duty: string;
  salary: number;
  phone: string;
  status: "active" | "on_leave";
  joinedAt: string;
  shiftStart: string;
  shiftEnd: string;
};

export type Attendance = {
  id: string;
  storeId: string;
  staffId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  hours: number;
  lateMinutes: number;
  note: string;
};

export type PayMethod = "upi" | "cash" | "bank" | "cheque";

export type StaffPayment = {
  id: string;
  storeId: string;
  staffId: string;
  staffName: string;
  amount: number;
  period: string;
  paidAt: string;
  note: string;
  method: PayMethod;
};

export type PayableKind = "staff" | "supplier" | "rent" | "power" | "tax" | "other";
export type PayableStatus = "due" | "overdue" | "partial" | "paid";

export type Payable = {
  id: string;
  storeId: string;
  kind: PayableKind;
  party: string;
  title: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  dueDate: string;
  period: string;
  status: PayableStatus;
  method: PayMethod | "";
  invoiceNo: string;
  gstin: string;
  note: string;
  refId: string;
  paidAt: string | null;
};

export type StockMoveType = "in" | "out" | "adjust" | "damage" | "return";

export type StockMove = {
  id: string;
  storeId: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: StockMoveType;
  quantity: number;
  note: string;
  at: string;
  ref: string;
};

export type UtilityBill = {
  id: string;
  storeId: string;
  type: "electricity" | "rent" | "water" | "internet";
  amount: number;
  period: string;
  dueDate: string;
  status: "due" | "paid";
  note: string;
};

export type Purchase = {
  id: string;
  storeId: string;
  itemName: string;
  supplier: string;
  category: string;
  quantity: number;
  unitCost: number;
  total: number;
  purchasedAt: string;
};

export type Expense = {
  id: string;
  storeId: string;
  title: string;
  category: string;
  amount: number;
  spentAt: string;
  note: string;
};

export type InventoryItem = {
  id: string;
  storeId: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reserved: number;
  damaged: number;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  size: string;
  color: string;
  bin: "showroom" | "godown";
  gstRate: number;
  hsn: string;
};

export type Customer = {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  totalSpent: number;
  firstVisit: string;
  lastVisit: string;
};

export type Sale = {
  id: string;
  storeId: string;
  itemName: string;
  quantity: number;
  amount: number;
  channel: "store" | "online";
  customer: string;
  soldAt: string;
};

export type Shipment = {
  id: string;
  storeId: string;
  itemName: string;
  supplier: string;
  quantity: number;
  status: "ordered" | "shipped" | "in_transit" | "delivered";
  tracking: string;
  eta: string;
  orderedAt: string;
};

export type RecurringTask = {
  id: string;
  storeId: string;
  title: string;
  kind: string;
  cadence: "daily" | "weekly" | "monthly";
  lastRun: string | null;
  nextRun: string;
  active: boolean;
};

export type ShopOrder = {
  id: string;
  storeId: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
  shipping: "india" | "international";
  shippingFee: number;
  total: number;
  status: "placed" | "packed" | "shipped" | "in_transit" | "delivered" | "cancelled";
  tracking: string;
  channel: "online" | "store";
  cashierId?: string;
  cashierName?: string;
  items: { productId: string; name: string; price: number; quantity: number; size?: string | null }[];
  createdAt: string;
};

export type AdminState = {
  stores: Store[];
  staff: Staff[];
  attendance: Attendance[];
  payments: StaffPayment[];
  payables: Payable[];
  bills: UtilityBill[];
  purchases: Purchase[];
  expenses: Expense[];
  inventory: InventoryItem[];
  stockMoves: StockMove[];
  customers: Customer[];
  sales: Sale[];
  shipments: Shipment[];
  tasks: RecurringTask[];
  orders: ShopOrder[];
};
