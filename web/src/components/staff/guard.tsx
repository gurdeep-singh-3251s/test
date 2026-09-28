"use client";

import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth-guard";
import { StatusBar, TitleBar } from "@/components/os-chrome";
import { useAuth } from "@/lib/auth";

export function StaffGuard({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["staff"]}>
      <StaffChrome>{children}</StaffChrome>
    </RequireAuth>
  );
}

function StaffChrome({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await logout();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (!user) return null;

  return (
    <div className="os-desktop p-0 md:p-3">
      <div className="os-window os-window-dark">
        <TitleBar
          title={`Create bills · ${user.storeName?.replace("BMS Fashionz ", "") ?? "Shop"}`}
          trailing={
            <>
              <span className="hidden text-[11px] uppercase tracking-[0.14em] text-white/45 sm:inline">
                {user.name}
              </span>
              <button
                className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          }
        />
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        <StatusBar extra={`${user.name} · ${user.storeName ?? "shop"} · store bills`} />
      </div>
    </div>
  );
}
