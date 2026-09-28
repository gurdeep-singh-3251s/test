"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthWindow } from "@/components/os-chrome";
import { GuestOnly } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";

function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await signup(String(form.get("name")), String(form.get("email")), String(form.get("password")));
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthWindow
      title="Create account"
      aside={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">Customer account</p>
          <div>
            <h1 className="font-serif text-6xl leading-[0.92]">Shop and keep your bills.</h1>
            <p className="mt-4 max-w-sm text-white/50">
              This signup is only for customers. Staff and owner logins are made by the owner.
            </p>
          </div>
          <p className="text-xs text-white/35">Same pieces as Shop 8, 9, 10 and 11.</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="w-full max-w-sm grid gap-4">
        <h1 className="font-serif text-4xl">Create account</h1>
        <p className="text-sm text-white/45">You can shop online. You cannot make store bills or open admin.</p>
        <label className="grid gap-2 text-sm">
          Name
          <input
            name="name"
            required
            minLength={2}
            autoComplete="name"
            className="rounded-lg border border-white/10 bg-[#181614] px-3 py-3 outline-none focus:border-[#c4a574]"
          />
        </label>
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
            minLength={6}
            required
            autoComplete="new-password"
            className="rounded-lg border border-white/10 bg-[#181614] px-3 py-3 outline-none focus:border-[#c4a574]"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button disabled={pending} className="rounded-lg bg-[#c4a574] py-3 text-ink disabled:opacity-60">
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-sm text-white/45">
          Already have an account?{" "}
          <Link href="/login" className="text-[#c4a574]">
            Sign in
          </Link>
        </p>
      </form>
    </AuthWindow>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <GuestOnly>
        <SignupForm />
      </GuestOnly>
    </Suspense>
  );
}
