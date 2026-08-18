import type { ReactNode } from "react";
import { UndoToastProvider } from "@codementor/ui";
import { RequireLecturer } from "@/components/auth/require-lecturer";
import { LecturerShell } from "@/components/layout/lecturer-shell";

export default function LecturerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <RequireLecturer>
      {/* Ở gốc layout, không phải trong từng trang: xoá một khoá học từ Studio rồi điều
        * hướng về danh sách vẫn phải giữ được hộp "Hoàn tác" qua cú chuyển trang — một
        * provider sống trong chính trang Studio sẽ biến mất cùng nó. */}
      <UndoToastProvider>
        <LecturerShell>{children}</LecturerShell>
      </UndoToastProvider>
    </RequireLecturer>
  );
}
