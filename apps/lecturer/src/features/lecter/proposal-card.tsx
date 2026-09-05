"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { Button, useToast } from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import { api } from "@/lib/api";

/**
 * Hộp xác nhận cho một đề xuất ghi của Lecter.
 *
 * Việc ghi do CHÍNH hộp này thi hành, bằng `api.exercises.*` — tức bằng token của người đang ngồi
 * trước màn hình, đi qua đúng guard `@Roles('lecturer')` của exercise-service. ai-service không
 * cầm credential ghi nào; nó chỉ đề xuất.
 */
export interface ProposalCardProps {
  title: string;
  /** Tóm tắt thay đổi, mỗi dòng một ý. Đủ để duyệt mà không phải mở studio. */
  lines: string[];
  children?: ReactNode;
  /** Có thì hộp sẽ tự đọc trạng thái bài để cảnh báo khi bài đã công khai. */
  exerciseId?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<string>;
  onReject: () => void | Promise<void>;
}

export function ProposalCard({
  title,
  lines,
  children,
  exerciseId,
  confirmLabel = "Xác nhận",
  onConfirm,
  onReject,
}: ProposalCardProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [settled, setSettled] = useState<"applied" | "rejected" | null>(null);
  // Bài đã công khai thì học viên đang học nó; sửa là thay đổi thứ người khác đang nhìn thấy.
  // Cờ này đọc từ backend NGAY TRONG hộp, không lấy từ tham số tool: model không đặt được nó.
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    api.exercises
      .get(exerciseId)
      .then((exercise) => !cancelled && setPublished(exercise.status === "published"))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  if (settled) {
    return (
      <p className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
        {settled === "applied" ? (
          <Check aria-hidden="true" className="size-4 text-success" />
        ) : (
          <X aria-hidden="true" className="size-4" />
        )}
        {settled === "applied" ? `Đã áp dụng: ${title}` : `Đã bỏ qua: ${title}`}
      </p>
    );
  }

  const apply = async () => {
    setBusy(true);
    try {
      const message = await onConfirm();
      setSettled("applied");
      toast.success(message);
    } catch (cause) {
      // Thông điệp của backend nói rõ thiếu gì; đừng thay bằng câu chung chung.
      const body = cause instanceof ApiClientError ? (cause.body as { message?: string }) : undefined;
      toast.error(body?.message ?? (cause instanceof Error ? cause.message : "Không áp dụng được"));
      setBusy(false);
    }
  };

  return (
    <section className="my-2 rounded-lg border border-border bg-card p-3.5">
      <h3 className="text-sm font-semibold">{title}</h3>

      {published && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 text-xs">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
          Bài này đang công khai. Học viên sẽ thấy thay đổi ngay khi bạn xác nhận.
        </p>
      )}

      {lines.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      )}

      {children}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          disabled={busy}
          onClick={() => {
            setSettled("rejected");
            void onReject();
          }}
          type="button"
          variant="outline"
        >
          Bỏ qua
        </Button>
        <Button disabled={busy} onClick={() => void apply()} type="button">
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {busy ? "Đang áp dụng…" : confirmLabel}
        </Button>
      </div>
    </section>
  );
}
