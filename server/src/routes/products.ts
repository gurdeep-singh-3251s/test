import { Router } from "express";
import { fallbackProduct, fallbackProducts } from "../lib/catalog.js";
import { hasNeonUrl } from "../lib/db.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

export const productRouter = Router();

productRouter.get("/", async (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const featured = req.query.featured === "true";

  if (hasNeonUrl()) {
    try {
      const products = await prisma.product.findMany({
        where: {
          featured: featured ? true : undefined,
          category: category && category !== "all" ? { slug: category } : undefined,
          OR: q
            ? [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { name: { contains: q, mode: "insensitive" } } },
              ]
            : undefined,
        },
        include: { category: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
      return res.json(products);
    } catch (error) {
      console.warn("Neon query failed, using catalog fallback", error);
    }
  }

  res.json(fallbackProducts({ category, q, featured }));
});

productRouter.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug);

  if (hasNeonUrl()) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: true },
      });
      if (product) {
        return res.json(product);
      }
    } catch (error) {
      console.warn("Neon query failed, using catalog fallback", error);
    }
  }

  const product = fallbackProduct(slug);
  if (!product) {
    throw new HttpError(404, "Product not found");
  }
  res.json(product);
});
