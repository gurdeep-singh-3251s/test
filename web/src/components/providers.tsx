"use client";

import { RoleLayer } from "@/components/role-layer";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <RoleLayer>{children}</RoleLayer>
      </CartProvider>
    </AuthProvider>
  );
}
