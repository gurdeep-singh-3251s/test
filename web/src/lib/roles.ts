export type Role = "owner" | "staff" | "customer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
};

export function deskHome(role: Role) {
  if (role === "owner") return "/admin";
  if (role === "staff") return "/staff";
  return "/account";
}

export function safeNext(role: Role, next: string) {
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return deskHome(role);
  }
  if (role === "owner") return next.startsWith("/admin") ? next : deskHome(role);
  if (role === "staff") return next.startsWith("/staff") ? next : deskHome(role);
  if (next.startsWith("/admin") || next.startsWith("/staff")) return deskHome(role);
  return next;
}
