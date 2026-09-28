"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPrice, formatUsd } from "@/lib/format";

const countries = ["Canada", "United States", "United Kingdom", "United Arab Emirates", "Australia", "New Zealand", "Germany"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [shipping, setShipping] = useState<"india" | "international">("india");

  const shippingFee = shipping === "international" ? 2499 : total >= 1999 ? 0 : 99;
  const grand = total + shippingFee;

  const fields = useMemo(
    () =>
      shipping === "international"
        ? [
            ["name", "Full name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone with country code", "tel"],
            ["address", "Street address", "text"],
            ["city", "City", "text"],
            ["pincode", "ZIP / postcode", "text"],
          ]
        : [
            ["name", "Full name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "tel"],
            ["address", "Address", "text"],
            ["city", "City", "text"],
            ["pincode", "Pincode", "text"],
          ],
    [shipping],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setPending(true);
    setError("");
    try {
      const order = await createOrder({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        country: shipping === "international" ? form.country : "India",
        shipping,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
        })),
      });
      clear();
      router.push(`/checkout/success?id=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-20">
        <h1 className="text-5xl">Your bag is empty.</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-[min(1000px,calc(100%-2rem))] gap-10 py-14 md:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="grid gap-4">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Checkout</p>
        <h1 className="text-6xl">Where should we send it?</h1>
        {user ? (
          <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
            Signed in as {user.email}. This order will show in your account with a QR bill.
          </p>
        ) : (
          <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
            <Link href="/login?next=/checkout" className="text-gold">
              Sign in
            </Link>{" "}
            to save the bill to your account — or continue as guest.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-2xl border px-4 py-3 text-left ${shipping === "india" ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}
            onClick={() => setShipping("india")}
          >
            India
            <span className="mt-1 block text-xs opacity-70">Free over ₹1,999</span>
          </button>
          <button
            type="button"
            className={`rounded-2xl border px-4 py-3 text-left ${shipping === "international" ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}
            onClick={() => setShipping("international")}
          >
            Worldwide
            <span className="mt-1 block text-xs opacity-70">₹2,499 shipping</span>
          </button>
        </div>
        {fields.map(([name, label, type]) => (
          <label key={name} className="grid gap-2 text-sm">
            {label}
            <input
              name={name}
              type={type}
              required
              defaultValue={name === "name" ? user?.name ?? "" : name === "email" ? user?.email ?? "" : ""}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
        ))}
        {shipping === "international" ? (
          <label className="grid gap-2 text-sm">
            Country
            <select name="country" className="rounded-xl border border-line bg-white px-3 py-3" required>
              {countries.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={pending} className="rounded-full bg-ink py-3 text-ivory disabled:opacity-60">
          {pending ? "Placing order..." : `Pay ${formatPrice(grand)}`}
        </button>
      </form>
      <aside className="h-fit rounded-3xl border border-line bg-white p-6">
        <h2 className="text-3xl">Bag</h2>
        <ul className="mt-4 grid gap-3 text-sm">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}`} className="flex justify-between gap-4">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-sm text-muted">
          <span>Shipping</span>
          <span>{shippingFee ? formatPrice(shippingFee) : "Free"}</span>
        </p>
        <p className="mt-3 text-lg">Total {formatPrice(grand)}</p>
        {shipping === "international" ? (
          <p className="mt-2 text-sm text-muted">About {formatUsd(grand)} · charged in INR</p>
        ) : null}
      </aside>
    </div>
  );
}
