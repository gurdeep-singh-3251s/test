import type { Category, Order, Product } from "./types";
import { API } from "./api-base";
import { getAuthToken } from "./session";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = getAuthToken();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export function getCategories() {
  return request<Category[]>("/categories");
}

export function getProducts(params?: { category?: string; q?: string; featured?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.q) query.set("q", params.q);
  if (params?.featured) query.set("featured", "true");
  const suffix = query.toString() ? `?${query}` : "";
  return request<Product[]>(`/products${suffix}`);
}

export function getProduct(slug: string) {
  return request<Product>(`/products/${slug}`);
}

export function createOrder(payload: {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  country?: string;
  shipping?: "india" | "international";
  items: { productId: string; quantity: number; size?: string }[];
}) {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrder(id: string) {
  return request<Order>(`/orders/${id}`);
}

export function sendContact(payload: { name: string; email: string; message: string }) {
  return request<{ ok: boolean }>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function joinNewsletter(email: string) {
  return request<{ ok: boolean }>("/subscribers", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
