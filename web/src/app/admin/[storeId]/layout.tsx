import { AdminShell } from "@/components/admin/shell";

export default async function StoreAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return <AdminShell storeId={storeId}>{children}</AdminShell>;
}
