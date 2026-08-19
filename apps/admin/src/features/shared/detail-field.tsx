import type { ReactNode } from "react";

/** Nhãn + gợi ý + ô nhập — cùng hình dạng field mà `ArticleEditor` dùng, tách ra vì giờ
 * ba trang quản lý nội dung (khoá học, lộ trình, bài code) đều cần nó. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
