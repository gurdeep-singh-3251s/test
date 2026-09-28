import type { NextFunction, Request, Response } from "express";
import { userFromToken, type PublicUser } from "../lib/auth.js";
import { HttpError } from "./error.js";

export type AuthedRequest = Request & { user?: PublicUser | null };

export function readToken(req: Request) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = userFromToken(readToken(req));
  next();
}

export function requireUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = userFromToken(readToken(req));
  if (!req.user) return next(new HttpError(401, "Sign in to continue"));
  next();
}

export function requireOwner(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = userFromToken(readToken(req));
  if (!req.user) return next(new HttpError(401, "Sign in to continue"));
  if (req.user.role !== "owner") return next(new HttpError(403, "Owner access only"));
  next();
}

export function requireStaff(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = userFromToken(readToken(req));
  if (!req.user) return next(new HttpError(401, "Sign in to continue"));
  if (req.user.role !== "staff") return next(new HttpError(403, "Staff billing only"));
  if (!req.user.storeId) return next(new HttpError(403, "This staff login is not assigned to a shop"));
  next();
}

export function requireCustomer(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = userFromToken(readToken(req));
  if (!req.user) return next(new HttpError(401, "Sign in to continue"));
  if (req.user.role !== "customer") return next(new HttpError(403, "Customer account only"));
  next();
}
