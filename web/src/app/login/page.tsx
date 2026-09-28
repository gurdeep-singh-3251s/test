"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthWindow } from "@/components/os-chrome";
import { GuestOnly } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { safeNext } from "@/lib/roles";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "";
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const user = await login(String(form.get("email")), String(form.get("password")));
      router.push(safeNext(user.role, next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <GuestOnly>
    <AuthWindow
      title="Sign in"
      aside={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">BMS Fashionz</p>
          <div>
            <h1 className="font-serif text-6xl leading-[0.92]">Four shops. One login.</h1>
            <p className="mt-4 max-w-sm text-white/50">
              Customers shop online. Staff make bills in the store. The owner sees everything.
            </p>
          </div>
          <p className="text-xs text-white/35">Kishanpura Chowk–Lamba Pind Chowk Road, Jalandhar</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="w-full max-w-sm grid gap-4">
        <p className="font-serif text-4xl md:hidden">BMS Fashionz</p>
        <h2 className="font-serif text-4xl">Sign in</h2>
        <p className="text-sm text-white/45">Use the login that matches your job.</p>
        <label className="grid gap-2 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-white/10 bg-[#181614] px-3 py-3 outline-none focus:border-[#c4a574]"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-white/10 bg-[#181614] px-3 py-3 outline-none focus:border-[#c4a574]"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button disabled={pending} className="rounded-lg bg-[#c4a574] py-3 text-ink disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <div className="rounded-lg border border-white/10 bg-[#181614] p-4 text-xs text-white/55">
          <p className="text-[#c4a574]">Demo logins</p>
          <p className="mt-2">Owner · owner@bmsfashionz.demo · owner123</p>
          <p>Staff · staff@bmsfashionz.demo · staff123</p>
          <p>Customer · nri@bmsfashionz.demo · nri123</p>
        </div>
        <p className="text-sm text-white/45">
          New here?{" "}
          <Link href="/signup" className="text-[#c4a574]">
            Create account
          </Link>
        </p>
      </form>
    </AuthWindow>
    </GuestOnly>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
