import { Router } from "express";
import { z } from "zod";
import { createStaffAccount, listAccounts } from "../lib/auth.js";
import * as repo from "../lib/admin-repo.js";

export const adminRouter = Router();

adminRouter.get("/stores", (_req, res) => {
  res.json(repo.listStores());
});

adminRouter.post("/stores", (req, res) => {
  const body = z
    .object({
      slug: z.string().min(2),
      name: z.string().min(2),
      city: z.string().min(2),
      address: z.string().min(2),
      phone: z.string().min(6),
      manager: z.string().min(2),
      focus: z.enum(["Women", "Kids", "All"]).optional().default("All"),
    })
    .parse(req.body);
  res.status(201).json(repo.createStore(body));
});

adminRouter.get("/stores/:storeId", (req, res) => {
  res.json(repo.getStore(req.params.storeId));
});

adminRouter.get("/stores/:storeId/overview", (req, res) => {
  res.json(repo.getOverview(req.params.storeId));
});

adminRouter.get("/stores/:storeId/team", (req, res) => {
  const month = typeof req.query.month === "string" ? req.query.month : "2026-09";
  res.json(repo.getTeam(req.params.storeId, month));
});

adminRouter.get("/stores/:storeId/team/:staffId", (req, res) => {
  const month = typeof req.query.month === "string" ? req.query.month : "2026-09";
  const year = Number(req.query.year ?? 2026);
  res.json(repo.getTeamPerson(req.params.storeId, req.params.staffId, month, year));
});

adminRouter.post("/stores/:storeId/attendance", (req, res) => {
  const body = z
    .object({
      staffId: z.string(),
      date: z.string().optional(),
      status: z.enum(["present", "late", "half_day", "leave", "absent"]).optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      note: z.string().optional(),
      action: z.enum(["in", "out", "leave", "absent", "half_day"]).optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.upsertAttendance(req.params.storeId, body));
});

adminRouter.post("/stores/:storeId/clock", (req, res) => {
  const body = z
    .object({
      staffId: z.string(),
      action: z.enum(["in", "out", "leave", "absent"]),
      time: z.string().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.clockStaff(req.params.storeId, body));
});

adminRouter.patch("/stores/:storeId/attendance/:id", (req, res) => {
  const body = z
    .object({
      staffId: z.string(),
      date: z.string().optional(),
      status: z.enum(["present", "late", "half_day", "leave", "absent"]).optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      note: z.string().optional(),
    })
    .parse(req.body);
  res.json(repo.upsertAttendance(req.params.storeId, body, req.params.id));
});

adminRouter.get("/stores/:storeId/staff", (req, res) => {
  res.json(repo.listStaff(req.params.storeId));
});

adminRouter.post("/stores/:storeId/staff", (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      role: z.string().optional(),
      duty: z.string().optional(),
      salary: z.number().int().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "on_leave"]).optional(),
      shiftStart: z.string().optional(),
      shiftEnd: z.string().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.upsertStaff(req.params.storeId, body));
});

adminRouter.patch("/stores/:storeId/staff/:id", (req, res) => {
  res.json(repo.upsertStaff(req.params.storeId, req.body, req.params.id));
});

adminRouter.get("/stores/:storeId/pay-queue", (req, res) => {
  const month = typeof req.query.month === "string" ? req.query.month : "2026-09";
  res.json(repo.getStaffPayQueue(req.params.storeId, month));
});

adminRouter.post("/stores/:storeId/pay-staff", (req, res) => {
  const body = z
    .object({
      staffId: z.string(),
      period: z.string().optional(),
      amount: z.number().int().optional(),
      method: z.enum(["upi", "cash", "bank", "cheque"]).optional(),
      note: z.string().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.payStaff(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/money", (req, res) => {
  const month = typeof req.query.month === "string" ? req.query.month : "2026-09";
  res.json(repo.getPaymentsBoard(req.params.storeId, month));
});

adminRouter.post("/stores/:storeId/settle", (req, res) => {
  const body = z
    .object({
      source: z.enum(["staff", "bill", "payable"]),
      refId: z.string(),
      amount: z.number().int().optional(),
      method: z.enum(["upi", "cash", "bank", "cheque"]).optional(),
      period: z.string().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.settlePayment(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/stock", (req, res) => {
  res.json(repo.getInventoryBoard(req.params.storeId));
});

adminRouter.post("/stores/:storeId/stock/receive", (req, res) => {
  const body = z
    .object({
      itemId: z.string().optional(),
      name: z.string().optional(),
      sku: z.string().optional(),
      category: z.string().optional(),
      quantity: z.number().int().min(1),
      unitCost: z.number().int().optional(),
      sellPrice: z.number().int().optional(),
      supplier: z.string().optional(),
      size: z.string().optional(),
      color: z.string().optional(),
      bin: z.enum(["showroom", "godown"]).optional(),
      gstRate: z.number().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.receiveStock(req.params.storeId, body));
});

adminRouter.post("/stores/:storeId/stock/move", (req, res) => {
  const body = z
    .object({
      itemId: z.string(),
      type: z.enum(["in", "out", "adjust", "damage", "return"]),
      quantity: z.number().int().min(1),
      note: z.string().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.moveStock(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/payroll", (req, res) => {
  res.json(repo.listPayments(req.params.storeId));
});

adminRouter.post("/stores/:storeId/payroll", (req, res) => {
  const body = z
    .object({
      staffId: z.string(),
      amount: z.number().int(),
      period: z.string(),
      paidAt: z.string(),
      note: z.string().optional().default(""),
      method: z.enum(["upi", "cash", "bank", "cheque"]).optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.createPayment(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/bills", (req, res) => {
  res.json(repo.listBills(req.params.storeId));
});

adminRouter.post("/stores/:storeId/bills", (req, res) => {
  res.status(201).json(repo.upsertBill(req.params.storeId, req.body));
});

adminRouter.patch("/stores/:storeId/bills/:id", (req, res) => {
  res.json(repo.upsertBill(req.params.storeId, req.body, req.params.id));
});

adminRouter.get("/stores/:storeId/purchases", (req, res) => {
  res.json(repo.listPurchases(req.params.storeId));
});

adminRouter.post("/stores/:storeId/purchases", (req, res) => {
  const body = z
    .object({
      itemName: z.string().min(2),
      supplier: z.string().min(2),
      category: z.string().min(2),
      quantity: z.number().int().min(1),
      unitCost: z.number().int().min(1),
      purchasedAt: z.string(),
    })
    .parse(req.body);
  res.status(201).json(repo.createPurchase(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/expenses", (req, res) => {
  res.json(repo.listExpenses(req.params.storeId));
});

adminRouter.post("/stores/:storeId/expenses", (req, res) => {
  const body = z
    .object({
      title: z.string().min(2),
      category: z.string().min(2),
      amount: z.number().int().min(1),
      spentAt: z.string(),
      note: z.string().optional().default(""),
    })
    .parse(req.body);
  res.status(201).json(repo.createExpense(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/inventory", (req, res) => {
  res.json(repo.listInventory(req.params.storeId));
});

adminRouter.post("/stores/:storeId/inventory", (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      sku: z.string().optional(),
      category: z.string().optional(),
      quantity: z.number().int().optional(),
      reserved: z.number().int().optional(),
      reorderLevel: z.number().int().optional(),
      costPrice: z.number().int().optional(),
      sellPrice: z.number().int().optional(),
      size: z.string().optional(),
      color: z.string().optional(),
      bin: z.enum(["showroom", "godown"]).optional(),
      gstRate: z.number().optional(),
    })
    .parse(req.body);
  res.status(201).json(repo.upsertInventory(req.params.storeId, body));
});

adminRouter.patch("/stores/:storeId/inventory/:id", (req, res) => {
  res.json(repo.upsertInventory(req.params.storeId, req.body, req.params.id));
});

adminRouter.get("/stores/:storeId/customers", (req, res) => {
  res.json(repo.listCustomers(req.params.storeId));
});

adminRouter.post("/stores/:storeId/customers", (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      phone: z.string().min(6),
      email: z.string(),
      visits: z.number().int().optional().default(1),
      totalSpent: z.number().int().optional().default(0),
      firstVisit: z.string(),
      lastVisit: z.string(),
    })
    .parse(req.body);
  res.status(201).json(repo.createCustomer(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/sales", (req, res) => {
  res.json(repo.listSales(req.params.storeId));
});

adminRouter.post("/stores/:storeId/sales", (req, res) => {
  const body = z
    .object({
      itemName: z.string().min(2),
      quantity: z.number().int().min(1),
      amount: z.number().int().min(1),
      channel: z.enum(["store", "online"]),
      customer: z.string().min(2),
      soldAt: z.string(),
    })
    .parse(req.body);
  res.status(201).json(repo.createSale(req.params.storeId, body));
});

adminRouter.get("/stores/:storeId/shipments", (req, res) => {
  res.json(repo.listShipments(req.params.storeId));
});

adminRouter.post("/stores/:storeId/shipments", (req, res) => {
  res.status(201).json(repo.upsertShipment(req.params.storeId, req.body));
});

adminRouter.patch("/stores/:storeId/shipments/:id", (req, res) => {
  res.json(repo.upsertShipment(req.params.storeId, req.body, req.params.id));
});

adminRouter.get("/stores/:storeId/orders", (req, res) => {
  res.json(repo.listOrders(req.params.storeId));
});

adminRouter.patch("/stores/:storeId/orders/:id", (req, res) => {
  res.json(repo.updateOrder(req.params.storeId, req.params.id, req.body));
});

adminRouter.get("/stores/:storeId/tasks", (req, res) => {
  res.json(repo.listTasks(req.params.storeId));
});

adminRouter.post("/stores/:storeId/tasks", (req, res) => {
  const body = z
    .object({
      title: z.string().min(2),
      kind: z.string().min(2),
      cadence: z.enum(["daily", "weekly", "monthly"]),
      lastRun: z.string().nullable(),
      nextRun: z.string(),
      active: z.boolean().optional().default(true),
    })
    .parse(req.body);
  res.status(201).json(repo.createTask(req.params.storeId, body));
});

adminRouter.post("/stores/:storeId/tasks/:id/run", (req, res) => {
  res.json(repo.runTask(req.params.storeId, req.params.id));
});

adminRouter.get("/stores/:storeId/walkins", (req, res) => {
  res.json(repo.listWalkInBills(req.params.storeId));
});

adminRouter.get("/desks", (_req, res) => {
  res.json(listAccounts().filter((user) => user.role === "staff"));
});

adminRouter.post("/desks", (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(6),
      storeId: z.string().min(2),
    })
    .parse(req.body);
  res.status(201).json(createStaffAccount(body));
});
