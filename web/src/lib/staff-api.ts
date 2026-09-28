import { API } from "@/lib/api-base";
import type { Order } from "@/lib/types";
import { getAuthToken } from "@/lib/session";

function token() {
  return getAuthToken();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/staff${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body as { error?: string } | null)?.error ?? "Staff request failed");
  }
  return body as T;
}

export type StaffCatalogItem = {
  id: string;
  name: string;
  price: number;
  sizes: string[];
  category: string;
};

export type StaffDesk = {
  user: { id: string; name: string; storeName?: string; storeId?: string };
  store: { id: string; slug: string; name: string; address: string; focus: string } | null;
  catalog: StaffCatalogItem[];
};

export const staffApi = {
  desk: () => request<StaffDesk>("/desk"),
  bills: () => request<Order[]>("/bills"),
  createBill: (body: {
    name: string;
    phone: string;
    email?: string;
    items: { productId: string; quantity: number; size?: string }[];
  }) => request<Order>("/bills", { method: "POST", body: JSON.stringify(body) }),
};
