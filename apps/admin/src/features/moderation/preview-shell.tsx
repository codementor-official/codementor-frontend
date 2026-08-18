"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";
import { StatusBadge } from "@codementor/ui";
import { STATUS_LABELS, STATUS_TONES, type ExerciseStatus } from "@codementor/solve";
import { ModerationActions } from "@/features/moderation/moderation-actions";
import { KIND_LABELS, KIND_ROUTES } from "@/features/moderation/vocabulary";
import type { ContentKind } from "@/lib/api";

/**
 * Khung chung của hai trang xem nội dung (khóa học, lộ trình).
 *
 * Bộ nút quyết định nằm ngay trên trang xem chứ không chỉ ở danh sách: bắt admin đọc xong
 * rồi quay ra bảng mới bấm được là mời họ bấm mà không đọc.
 */
export function PreviewShell({
  kind,
  id,
  status,
  title,
  subtitle,
  rejectionReason,
  children,
}: {
  kind: ContentKind;
  id: string;
  status: string;
  title: string;
  subtitle?: string;
  /** Lý do của lần quyết định trước. Đọc nó trước khi quyết định lần này. */
  rejectionReason?: string | null;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          href={KIND_ROUTES[kind]}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {KIND_LABELS[kind]}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <StatusBadge tone={STATUS_TONES[status as ExerciseStatus] ?? "neutral"}>
            {STATUS_LABELS[status as ExerciseStatus] ?? status}
          </StatusBadge>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {rejectionReason && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium text-warning">Lý do của lần quyết định trước</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground">{rejectionReason}</p>
        </div>
      )}

      {children}

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Quyết định</h2>
        <ModerationActions
          id={id}
          kind={kind}
          // Về lại danh sách sau khi quyết định: trang này vẽ một trạng thái vừa hết đúng,
          // và hàng chờ là nơi có việc tiếp theo.
          onDone={() => router.push(KIND_ROUTES[kind])}
          status={status}
        />
      </div>
    </div>
  );
}

export interface CheckItem {
  ok: boolean;
  text: string;
}

/**
 * Những thứ hay hỏng, kiểm sẵn một lượt.
 *
 * Không thay việc đọc nội dung, mà bắt lấy đúng các lỗi không nhìn thấy khi cuộn trang:
 * một chương rỗng, một bài chưa có thân, một khóa học trong lộ trình chưa được công khai.
 * Toàn dấu tích xanh KHÔNG có nghĩa là duyệt được.
 */
export function ReviewChecklist({ items }: { items: CheckItem[] }) {
  const problems = items.filter((item) => !item.ok);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">
        Kiểm nhanh
        {problems.length > 0 && (
          <span className="ml-2 text-xs font-normal text-warning">
            {problems.length} điểm cần xem
          </span>
        )}
      </h2>
      <ul className="grid gap-2 text-sm">
        {items.map((item) => (
          <li className="flex items-start gap-2" key={item.text}>
            {item.ok ? (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <span className={item.ok ? "text-muted-foreground" : "text-foreground"}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
