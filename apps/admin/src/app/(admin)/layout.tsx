import type { ReactNode } from "react";
import { RequireAdmin } from "@/components/auth/require-admin";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
