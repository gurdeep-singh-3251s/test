"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function RoleLayer({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !user) return;
    if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/bill")) return;

    if (user.role === "staff" && !pathname.startsWith("/staff")) {
      router.replace("/staff");
      return;
    }
    if (user.role === "owner" && pathname.startsWith("/staff")) {
      router.replace("/admin");
      return;
    }
    if (user.role === "customer" && (pathname.startsWith("/admin") || pathname.startsWith("/staff"))) {
      router.replace("/account");
    }
  }, [ready, user, pathname, router]);

  return children;
}
