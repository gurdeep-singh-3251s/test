import { Router } from "express";
import { fallbackCategories } from "../lib/catalog.js";
import { hasNeonUrl } from "../lib/db.js";
import { prisma } from "../lib/prisma.js";

export const categoryRouter = Router();

categoryRouter.get("/", async (_req, res) => {
  if (hasNeonUrl()) {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
      return res.json(categories);
    } catch (error) {
      console.warn("Neon query failed, using catalog fallback", error);
    }
  }

  res.json(fallbackCategories());
});
