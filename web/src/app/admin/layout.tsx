import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/guard";

export const metadata: Metadata = {
  title: "BMS Fashionz | Admin",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
