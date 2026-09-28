import type { AuthUser } from "@/lib/roles";

const TOKEN_KEY = "bms-os-token";
const USER_KEY = "bms-os-user";

function canUse() {
  return typeof window !== "undefined";
}

function write(storage: Storage, token: string, user: AuthUser) {
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

function read(storage: Storage) {
  const token = storage.getItem(TOKEN_KEY);
  const raw = storage.getItem(USER_KEY);
  if (!token) return null;
  let user: AuthUser | null = null;
  if (raw) {
    try {
      user = JSON.parse(raw) as AuthUser;
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export function getAuthToken() {
  if (!canUse()) return "";
  return window.sessionStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY) || "";
}

export function readSession() {
  if (!canUse()) return null;
  return read(window.sessionStorage) ?? read(window.localStorage);
}

export function writeSession(token: string, user: AuthUser) {
  if (!canUse()) return;
  write(window.sessionStorage, token, user);
  write(window.localStorage, token, user);
}

export function clearSession() {
  if (!canUse()) return;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  }
}
