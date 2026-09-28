"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { deskHome, safeNext, type Role } from "@/lib/roles";

function Spinner({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#e8eef5] text-sm text-slate-500">
      {label}
    </div>
  );
}

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(deskHome(user.role));
    }
  }, [ready, user, roles, pathname, router]);

  if (!ready) return <Spinner label="Checking sign in…" />;
  if (!user) return <Spinner label="Taking you to sign in…" />;
  if (roles && !roles.includes(user.role)) return <Spinner label="Opening your page…" />;
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "";

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(safeNext(user.role, next));
  }, [ready, user, next, router]);

  if (!ready) return <Spinner label="Checking sign in…" />;
  if (user) return <Spinner label="You are already signed in…" />;
  return <>{children}</>;
}
