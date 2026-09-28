"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const modules = [
  { href: "/", label: "Home", rail: "Home" },
  { href: "/shop", label: "Shop", rail: "Shop" },
  { href: "/outfit", label: "Help me pick", rail: "Help" },
  { href: "/about", label: "About", rail: "About" },
  { href: "/cart", label: "Bag", rail: "Bag" },
  { href: "/account", label: "Account", rail: "Account" },
];

function moduleActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentModule(pathname: string) {
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/staff")) return "Create bills";
  if (pathname.startsWith("/shop")) return "Shop";
  if (pathname.startsWith("/outfit")) return "Help me pick";
  if (pathname.startsWith("/shipping") || pathname.startsWith("/nri")) return "Shipping";
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return "Checkout";
  if (pathname.startsWith("/account")) return "Account";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/login")) return "Sign in";
  if (pathname.startsWith("/signup")) return "Create account";
  return "Home";
}

export function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="os-light bg-[#ff5f57]" />
      <span className="os-light bg-[#febc2e]" />
      <span className="os-light bg-[#28c840]" />
    </div>
  );
}

export function TitleBar({
  title,
  trailing,
}: {
  title?: string;
  trailing?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const { count } = useCart();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <header className="os-titlebar">
      <TrafficLights />
      <Link
        href={user?.role === "staff" ? "/staff" : user?.role === "owner" && pathname.startsWith("/admin") ? "/admin" : "/"}
        className="hidden items-baseline gap-2 sm:flex"
      >
        <span className="font-serif text-lg tracking-[0.18em]">BMS</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#c4a574]">Fashionz</span>
      </Link>
      <span className="hidden text-[11px] uppercase tracking-[0.18em] text-white/35 md:inline">
        {title ?? currentModule(pathname)}
      </span>
      <nav className="ml-2 hidden items-center gap-1 lg:flex">
        {pathname.startsWith("/staff") || pathname.startsWith("/admin")
          ? null
          : modules
          .filter((item) => item.href !== "/cart")
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                moduleActive(pathname, item.href) ? "bg-white/10 text-[#c4a574]" : "text-white/55 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        {ready && user?.role === "owner" && !pathname.startsWith("/staff") ? (
          <Link
            href="/admin"
            className={`rounded-md px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
              pathname.startsWith("/admin") ? "bg-white/10 text-[#c4a574]" : "text-white/55 hover:bg-white/5"
            }`}
          >
            Admin
          </Link>
        ) : null}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {trailing ?? (
          <>
            <form onSubmit={onSearch} className="hidden md:block">
              <input
                name="q"
                placeholder="Search catalog"
                className="w-44 rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-ivory outline-none placeholder:text-white/30"
              />
            </form>
            <Link href="/cart" className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]">
              Bag {count}
            </Link>
            {ready && user ? (
              <Link
                href={user.role === "owner" ? "/admin" : user.role === "staff" ? "/staff" : "/account"}
                className="rounded-md bg-[#c4a574] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-ink"
              >
                {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link href="/login" className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]">
                Sign in
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}

export function AppRail() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  const items = [
    ...modules,
    ...(user?.role === "owner" ? [{ href: "/admin", label: "Admin", rail: "Admin" }] : []),
  ];

  return (
    <aside className="hidden w-[76px] shrink-0 flex-col border-r border-line bg-[#f3eee4] py-3 md:flex">
      {items.map((item) => {
        const active = moduleActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mx-2 mb-1 grid h-14 place-items-center rounded-xl text-center text-[10px] uppercase tracking-[0.14em] ${
              active ? "bg-ink text-ivory" : "text-muted hover:bg-white"
            }`}
          >
            <span>
              {item.rail}
              {item.href === "/cart" && count ? (
                <span className="mt-0.5 block text-[9px] text-gold">{count}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}

export function StatusBar({ extra }: { extra?: string }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }).format(new Date()),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="os-statusbar">
      <span className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#28c840]" />
        Live
      </span>
      <span className="hidden truncate sm:inline">{extra ?? "Shop 8–11 · Kishanpura–Lamba Pind Road"}</span>
      <span>INR · IST {clock}</span>
    </footer>
  );
}

export function AuthWindow({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <div className="os-desktop grid min-h-screen place-items-center p-3 md:p-8">
      <div className="os-window os-window-dark w-full max-w-4xl min-h-[min(640px,calc(100vh-4rem))]">
        <header className="os-titlebar">
          <TrafficLights />
          <span className="font-serif tracking-[0.18em]">BMS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/35">{title}</span>
          <Link href="/" className="ml-auto text-[11px] uppercase tracking-[0.14em] text-white/45 hover:text-[#c4a574]">
            Shop
          </Link>
        </header>
        <div className="grid flex-1 md:grid-cols-2">
          <aside className="hidden flex-col justify-between border-r border-white/10 bg-[#161412] p-10 md:flex">
            {aside}
          </aside>
          <main className="grid place-items-center px-6 py-12">{children}</main>
        </div>
        <StatusBar extra="Shop · Create bills · Admin" />
      </div>
    </div>
  );
}
