import Link from "next/link";

export default function ShippingPage() {
  return (
    <div className="mx-auto w-[min(760px,calc(100%-2rem))] py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Shipping</p>
      <h1 className="mt-3 text-6xl">India and worldwide.</h1>
      <p className="mt-5 text-muted">
        Order from Jalandhar or from anywhere else. We pack from the four shops on Kishanpura Road
        and send it to you. If you live outside India, pick Worldwide at checkout.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-2xl">India</h2>
          <p className="mt-2 text-sm text-muted">Free over ₹1,999. Otherwise ₹99.</p>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-2xl">Worldwide</h2>
          <p className="mt-2 text-sm text-muted">₹2,499. You pay in rupees. We show an approximate USD amount so you know the cost.</p>
        </article>
      </div>
      <Link href="/shop" className="mt-10 inline-block rounded-full bg-ink px-6 py-3 text-ivory">
        Start shopping
      </Link>
    </div>
  );
}
