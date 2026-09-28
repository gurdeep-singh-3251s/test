import { Router } from "express";
import { z } from "zod";
import { hasNeonUrl } from "../lib/db.js";
import { prisma } from "../lib/prisma.js";

export const subscriberRouter = Router();

const subscriberSchema = z.object({
  email: z.email(),
});

subscriberRouter.post("/", async (req, res) => {
  const { email } = subscriberSchema.parse(req.body);

  if (hasNeonUrl()) {
    try {
      const saved = await prisma.subscriber.upsert({
        where: { email },
        update: {},
        create: { email },
      });
      return res.status(201).json({ ok: true, id: saved.id, persisted: true });
    } catch (error) {
      console.warn("Neon subscriber write failed", error);
    }
  }

  res.status(201).json({ ok: true, persisted: false });
});
