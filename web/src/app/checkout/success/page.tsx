import { Suspense } from "react";
import { SuccessClient } from "./success-client";

export default function SuccessPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-muted">Preparing your bill…</p>}>
      <SuccessClient />
    </Suspense>
  );
}
