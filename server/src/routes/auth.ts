import { Router } from "express";
import { z } from "zod";
import { login, logout, signup } from "../lib/auth.js";
import { findOrdersByEmail } from "../lib/admin-repo.js";
import { readToken, requireCustomer, requireUser, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/signup", (req, res) => {
  const body = z
    .object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(6),
    })
    .parse(req.body);
  res.status(201).json(signup(body));
});

authRouter.post("/login", (req, res) => {
  const body = z
    .object({
      email: z.email(),
      password: z.string().min(6),
    })
    .parse(req.body);
  res.json(login(body));
});

authRouter.post("/logout", (req, res) => {
  logout(readToken(req));
  res.json({ ok: true });
});

authRouter.get("/me", requireUser, (req: AuthedRequest, res) => {
  res.json(req.user);
});

authRouter.get("/orders", requireCustomer, (req: AuthedRequest, res) => {
  res.json(findOrdersByEmail(req.user!.email));
});
