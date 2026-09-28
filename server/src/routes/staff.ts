import { Router } from "express";
import { z } from "zod";
import { fallbackProducts } from "../lib/catalog.js";
import { createWalkInBill, listWalkInBills } from "../lib/admin-repo.js";
import { adminState } from "../lib/admin-data.js";
import { requireStaff, type AuthedRequest } from "../middleware/auth.js";

export const staffRouter = Router();

staffRouter.use(requireStaff);

staffRouter.get("/desk", (req: AuthedRequest, res) => {
  const store = adminState.stores.find((entry) => entry.id === req.user!.storeId);
  res.json({
    user: req.user,
    store,
    catalog: fallbackProducts().map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      sizes: product.sizes,
      category: product.category.name,
    })),
  });
});

staffRouter.get("/bills", (req: AuthedRequest, res) => {
  res.json(listWalkInBills(req.user!.storeId!));
});

staffRouter.post("/bills", (req: AuthedRequest, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      phone: z.string().min(8),
      email: z.string().optional().default(""),
      items: z
        .array(
          z.object({
            productId: z.string().min(2),
            quantity: z.number().int().min(1).max(20),
            size: z.string().optional(),
          }),
        )
        .min(1),
    })
    .parse(req.body);

  const bill = createWalkInBill({
    storeId: req.user!.storeId!,
    cashierId: req.user!.id,
    cashierName: req.user!.name,
    name: body.name,
    phone: body.phone,
    email: body.email.includes("@") ? body.email : undefined,
    items: body.items,
  });
  res.status(201).json(bill);
});
