"use client";

export function QrBill({ orderId, size = 220 }: { orderId: string; size?: number }) {
  const origin = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;
  const billUrl = `${origin}/bill/${orderId}`;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(billUrl)}`;

  return (
    <figure className="grid justify-items-center gap-3">
      <img src={src} alt={`QR bill ${orderId}`} width={size} height={size} className="rounded-2xl bg-white p-3" />
      <figcaption className="text-center text-xs text-muted">
        Scan to open the bill · {orderId}
      </figcaption>
    </figure>
  );
}
