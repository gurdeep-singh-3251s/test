import type { Metadata } from "next";
import { StaffGuard } from "@/components/staff/guard";

export const metadata: Metadata = {
  title: "BMS Fashionz | Create bills",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffGuard>{children}</StaffGuard>;
}
