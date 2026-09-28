import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { adminState } from "./admin-data.js";
import { HttpError } from "../middleware/error.js";

export type Role = "owner" | "staff" | "customer";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
};

type UserRecord = PublicUser & { password: string };

const users = new Map<string, UserRecord>();
const revoked = new Set<string>();
const AUTH_SECRET = process.env.AUTH_SECRET || "bms-fashionz-demo-secret";

function signToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ e: email, i: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function readSignedEmail(token: string) {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e?: string };
    return body.e ?? null;
  } catch {
    return null;
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const next = scryptSync(password, salt, 32);
  const current = Buffer.from(hash, "hex");
  return current.length === next.length && timingSafeEqual(current, next);
}

function storeMeta(storeId?: string) {
  if (!storeId) return {};
  const store = adminState.stores.find((entry) => entry.id === storeId || entry.slug === storeId);
  if (!store) return { storeId };
  return { storeId: store.id, storeSlug: store.slug, storeName: store.name };
}

function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...storeMeta(user.storeId),
  };
}

function seed(name: string, email: string, password: string, role: Role, storeId?: string) {
  const id = `usr_${createHash("sha1").update(email).digest("hex").slice(0, 8)}`;
  users.set(email, {
    id,
    name,
    email,
    role,
    password: hashPassword(password),
    ...storeMeta(storeId),
  });
}

seed("Gurdeep Singh", "owner@bmsfashionz.demo", "owner123", "owner");
seed("Jaspreet Brar", "nri@bmsfashionz.demo", "nri123", "customer");
seed("Rohit Sharma", "staff@bmsfashionz.demo", "staff123", "staff", "store_model_town");
seed("Kavya Mehta", "staff.women@bmsfashionz.demo", "staff123", "staff", "store_women");
seed("Aman Gill", "staff.kids@bmsfashionz.demo", "staff123", "staff", "store_kids");
seed("Navjot Kaur", "staff.shop11@bmsfashionz.demo", "staff123", "staff", "store_rainak");

export function signup(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (users.has(email)) {
    throw new HttpError(409, "An account with this email already exists");
  }
  if (input.password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }
  const user: UserRecord = {
    id: `usr_${randomBytes(4).toString("hex")}`,
    name: input.name.trim(),
    email,
    role: "customer",
    password: hashPassword(input.password),
  };
  users.set(email, user);
  return issue(user);
}

export function login(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = users.get(email);
  if (!user || !verifyPassword(input.password, user.password)) {
    throw new HttpError(401, "Email or password is wrong");
  }
  return issue(user);
}

export function issue(user: UserRecord) {
  const token = signToken(user.email);
  return { token, user: publicUser(user) };
}

export function userFromToken(token?: string | null) {
  if (!token || revoked.has(token)) return null;
  const email = readSignedEmail(token);
  if (!email) return null;
  const user = users.get(email);
  return user ? publicUser(user) : null;
}

export function logout(token?: string | null) {
  if (token) revoked.add(token);
}

export function createStaffAccount(input: { name: string; email: string; password: string; storeId: string }) {
  const store = adminState.stores.find((entry) => entry.id === input.storeId || entry.slug === input.storeId);
  if (!store) throw new HttpError(404, "Store not found");
  const email = input.email.trim().toLowerCase();
  if (users.has(email)) {
    throw new HttpError(409, "An account with this email already exists");
  }
  if (input.password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }
  const user: UserRecord = {
    id: `usr_${randomBytes(4).toString("hex")}`,
    name: input.name.trim(),
    email,
    role: "staff",
    password: hashPassword(input.password),
    ...storeMeta(store.id),
  };
  users.set(email, user);
  return publicUser(user);
}

export function listAccounts() {
  return [...users.values()].map(publicUser);
}
