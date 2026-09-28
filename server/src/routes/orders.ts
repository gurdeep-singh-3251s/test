import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { addShopOrder, findOrder, FLAGSHIP_STORE_ID } from "../lib/admin-repo.js";
import { fallbackProductById } from "../lib/catalog.js";
import { hasNeonUrl } from "../lib/db.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

export const orderRouter = Router();

const orderSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  address: z.string().min(6),
  city: z.string().min(2),
  pincode: z.string().min(3),
  country: z.string().min(2).optional().default("India"),
  shipping: z.enum(["india", "international"]).optional().default("india"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        size: z.string().optional(),
      }),
    )
    .min(1),
});

orderRouter.post("/", async (req, res) => {
  const body = orderSchema.parse(req.body);
  const ids = [...new Set(body.items.map((item) => item.productId))];

  if (hasNeonUrl()) {
    try {
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
      });

      if (products.length !== ids.length) {
        throw new HttpError(400, "One or more products are no longer available");
      }

      const pricedItems = body.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          throw new HttpError(400, "Invalid product in bag");
        }
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
        };
      });

      const merchandise = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = body.shipping === "international" ? 2499 : merchandise >= 1999 ? 0 : 99;
      const total = merchandise + shippingFee;
      const order = await prisma.order.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
          pincode: body.pincode,
          total,
          items: { create: pricedItems },
        },
        include: { items: true },
      });
      addShopOrder({
        id: order.id,
        storeId: FLAGSHIP_STORE_ID,
        email: order.email,
        name: order.name,
        phone: order.phone,
        address: order.address,
        city: order.city,
        pincode: order.pincode,
        country: body.country,
        shipping: body.shipping,
        shippingFee,
        total: order.total,
        status: "placed",
        tracking: "",
        channel: "online",
        items: order.items,
        createdAt: order.createdAt.toISOString(),
      });
      return res.status(201).json({ ...order, country: body.country, shipping: body.shipping, shippingFee });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.warn("Neon order write failed, using demo order", error);
    }
  }

  const pricedItems = body.items.map((item) => {
    const product = fallbackProductById(item.productId);
    if (!product) {
      throw new HttpError(400, "Invalid product in bag");
    }
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      size: item.size ?? null,
    };
  });

  const merchandise = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = body.shipping === "international" ? 2499 : merchandise >= 1999 ? 0 : 99;
  const created = {
    id: `demo_${randomUUID()}`,
    email: body.email,
    name: body.name,
    phone: body.phone,
    address: body.address,
    city: body.city,
    pincode: body.pincode,
    country: body.country,
    shipping: body.shipping,
    shippingFee,
    total: merchandise + shippingFee,
    status: "placed" as const,
    items: pricedItems,
    persisted: false,
  };

  addShopOrder({
    id: created.id,
    storeId: FLAGSHIP_STORE_ID,
    email: created.email,
    name: created.name,
    phone: created.phone,
    address: created.address,
    city: created.city,
    pincode: created.pincode,
    country: created.country,
    shipping: created.shipping,
    shippingFee: created.shippingFee,
    total: created.total,
    status: "placed",
    tracking: "",
    channel: "online",
    items: created.items,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(created);
});

orderRouter.get("/:id", async (req, res) => {
  const local = findOrder(String(req.params.id));
  if (local) {
    return res.json(local);
  }

  if (hasNeonUrl()) {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (order) {
      return res.json(order);
    }
  }

  throw new HttpError(404, "Order not found");
});
