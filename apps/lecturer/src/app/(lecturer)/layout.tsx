import type { ReactNode } from "react";
import { RequireLecturer } from "@/components/auth/require-lecturer";

export default function LecturerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <RequireLecturer>{children}</RequireLecturer>;
}
