import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-[min(720px,calc(100%-2rem))] py-24 text-center">
      <h1 className="text-6xl">This piece walked out.</h1>
      <Link href="/shop" className="mt-6 inline-block text-gold">
        Back to the shop →
      </Link>
    </div>
  );
}
