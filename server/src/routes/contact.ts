import { Router } from "express";
import { z } from "zod";
import { hasNeonUrl } from "../lib/db.js";
import { prisma } from "../lib/prisma.js";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  message: z.string().min(8),
});

contactRouter.post("/", async (req, res) => {
  const body = contactSchema.parse(req.body);

  if (hasNeonUrl()) {
    try {
      const saved = await prisma.contactMessage.create({ data: body });
      return res.status(201).json({ ok: true, id: saved.id, persisted: true });
    } catch (error) {
      console.warn("Neon contact write failed", error);
    }
  }

  res.status(201).json({ ok: true, persisted: false });
});
