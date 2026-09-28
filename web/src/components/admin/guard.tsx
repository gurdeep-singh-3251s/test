"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["owner"]}>
      <AdminChrome>{children}</AdminChrome>
    </RequireAuth>
  );
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await logout();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (!user) return null;

  return (
    <div className="dash flex min-h-screen flex-col">
      <header className="dash-top">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-sm font-semibold text-white">B</span>
          <span className="text-sm font-semibold text-slate-900">BMS Admin</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-slate-500 sm:inline">{user.name}</span>
          <Link href="/" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
            Shop
          </Link>
          <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-white" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">{children}</div>
    </div>
  );
}
