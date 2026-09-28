"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/outfit", label: "Help me pick" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Account" },
];

export function MobileNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-line bg-ivory md:hidden">
      <button
        className="flex h-11 w-full items-center justify-between px-4 text-[11px] uppercase tracking-[0.18em]"
        onClick={() => setOpen((value) => !value)}
      >
        Modules
        <span>{open ? "Close" : "Open"}</span>
      </button>
      {open ? (
        <nav className="grid gap-1 border-t border-line px-3 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "owner" ? (
            <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm">
              Admin
            </Link>
          ) : null}
          {user?.role === "staff" ? (
            <Link href="/staff" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm">
              Create bills
            </Link>
          ) : null}
          <Link
            href={user ? (user.role === "staff" ? "/staff" : user.role === "owner" ? "/admin" : "/account") : "/login"}
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2 text-sm"
          >
            {user ? "Signed in" : "Sign in"}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

export function Header() {
  return null;
}
