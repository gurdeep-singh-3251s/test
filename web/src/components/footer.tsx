"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { joinNewsletter } from "@/lib/api";

const shopLinks = [
  ["Shirts", "/shop?category=shirts"],
  ["Pants", "/shop?category=pants"],
  ["Shoes", "/shop?category=shoes"],
  ["Perfumes", "/shop?category=perfumes"],
  ["Belts", "/shop?category=belts"],
  ["Outfits", "/shop?category=outfits"],
  ["Women", "/shop?category=women"],
  ["Kids", "/shop?category=kids"],
];

export function Footer() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    if (typeof email !== "string") return;
    try {
      await joinNewsletter(email);
      setStatus("You’re on the list.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not subscribe");
    }
  }

  return (
    <footer className="border-t border-line bg-[#f3eee4]">
      <div className="grid gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">BMS Fashionz</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Four shops on one road. Shop online, make store bills, and ship worldwide.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {shopLinks.map(([label, href]) => (
            <Link key={href} href={href} className="text-muted hover:text-ink">
              {label}
            </Link>
          ))}
          <Link href="/outfit" className="text-muted hover:text-ink">
            Help me pick
          </Link>
          <Link href="/about" className="text-muted hover:text-ink">
            About
          </Link>
          <Link href="/contact" className="text-muted hover:text-ink">
            Contact
          </Link>
        </div>
        <form onSubmit={onSubmit} className="grid gap-2">
          <p className="text-sm">Drop alerts</p>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
            <button className="rounded-lg bg-ink px-4 text-sm text-ivory">Join</button>
          </div>
          {status ? <p className="text-xs text-gold">{status}</p> : null}
        </form>
      </div>
    </footer>
  );
}
