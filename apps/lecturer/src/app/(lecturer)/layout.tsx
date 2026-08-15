import type { ReactNode } from "react";
import { RequireLecturer } from "@/components/auth/require-lecturer";
import { LecturerShell } from "@/components/layout/lecturer-shell";

export default function LecturerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <RequireLecturer>
      <LecturerShell>{children}</LecturerShell>
    </RequireLecturer>
  );
}
