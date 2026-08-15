import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminAuthBoundary } from "@/features/auth/admin-auth-boundary";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AdminAuthBoundary>
      <AdminShell>{children}</AdminShell>
    </AdminAuthBoundary>
  );
}
