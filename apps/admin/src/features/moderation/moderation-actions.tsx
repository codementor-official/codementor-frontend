"use client";

import { useState } from "react";
import { Gavel } from "lucide-react";
import { Button, Modal } from "@codementor/ui";
import { DECISIONS, DECISIONS_FOR } from "@/features/moderation/vocabulary";
import { useModeration } from "@/features/moderation/use-moderation";
import type { ContentKind, ModerationDecision } from "@/lib/api";

export interface ModerationActionsProps {
  kind: ContentKind;
  id: string;
  /** Trạng thái hiện tại quyết định việc nào bấm được — xem `DECISIONS_FOR`. */
  status: string;
  /** Gọi sau khi quyết định thành công: nạp lại danh sách, hoặc quay về hàng chờ. */
  onDone: () => void;
  /**
   * `compact` cho thanh công cụ hẹp (màn giải bài): một nút mở hộp thoại chứa đúng bộ
   * điều khiển của `inline`. Không có ô lý do nào bị cắt đi giữa hai kiểu hiển thị —
   * một nút "Từ chối" không kèm chỗ ghi lý do là nút không bấm được.
   */
  layout?: "inline" | "compact";
  /** Tên nội dung, hiện trên hộp thoại của kiểu `compact`. */
  title?: string;
}

/**
 * Bộ nút quyết định của admin.
 *
 * CHÚ Ý khi dùng trong danh sách: truyền `key={id}` ở chỗ gọi. Component giữ ô lý do và
 * bước xác nhận trong state của nó, mà React giữ nguyên instance khi chỉ có prop đổi —
 * không có `key` thì lý do gõ cho nội dung này còn nằm nguyên đó lúc mở nội dung khác, và
 * nó sẽ được gửi đi cùng quyết định tiếp theo.
 */
export function ModerationActions({
  kind,
  id,
  status,
  onDone,
  layout = "inline",
  title,
}: ModerationActionsProps) {
  const [open, setOpen] = useState(false);
  const available = DECISIONS_FOR[status] ?? [];

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nội dung đang là bản nháp của tác giả — chưa có gì để quyết định.
      </p>
    );
  }

  if (layout === "inline") {
    return <DecisionForm available={available} id={id} kind={kind} onDone={onDone} />;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button">
        <Gavel aria-hidden="true" className="size-3.5" />
        Quyết định
      </Button>
      <Modal
        description={title}
        onClose={() => setOpen(false)}
        open={open}
        title="Quyết định kiểm duyệt"
        width="sm"
      >
        <DecisionForm
          available={available}
          id={id}
          kind={kind}
          onDone={() => {
            setOpen(false);
            onDone();
          }}
        />
      </Modal>
    </>
  );
}

function DecisionForm({
  kind,
  id,
  available,
  onDone,
}: {
  kind: ContentKind;
  id: string;
  available: ModerationDecision[];
  onDone: () => void;
}) {
  const { busy, decide, error, setError } = useModeration(kind, onDone);
  const [reason, setReason] = useState("");
  // Chỉ dùng cho `archive`: gỡ một nội dung đang chạy là thay đổi thấy được ngay ở phía
  // người học, nên nó cần một nhịp dừng mà `approve` không cần.
  const [confirming, setConfirming] = useState<ModerationDecision | null>(null);
  const needsReason = available.some((decision) => DECISIONS[decision].requiresReason);

  const run = async (decision: ModerationDecision) => {
    const meta = DECISIONS[decision];
    if (meta.requiresReason && !reason.trim()) {
      setError(`Phải nêu lý do khi ${meta.label.toLowerCase()}. Tác giả sẽ đọc đúng câu này.`);
      return;
    }
    if (meta.confirm && confirming !== decision) {
      setConfirming(decision);
      setError(null);
      return;
    }
    setConfirming(null);
    await decide(id, decision, meta.requiresReason ? reason : undefined);
  };

  return (
    <div className="grid gap-3">
      {needsReason && (
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor={`reason-${id}`}>
            Lý do
          </label>
          <textarea
            className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
            id={`reason-${id}`}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Bắt buộc khi từ chối, yêu cầu sửa hoặc gỡ. Tác giả sẽ đọc đúng câu này."
            value={reason}
          />
        </div>
      )}

      {error && (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {confirming && (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          {DECISIONS[confirming].hint} Bấm lần nữa để xác nhận.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {available.map((decision) => {
          const meta = DECISIONS[decision];
          const Icon = meta.icon;
          return (
            <Button
              disabled={busy}
              key={decision}
              onClick={() => void run(decision)}
              title={meta.hint}
              type="button"
              variant={meta.variant}
            >
              <Icon aria-hidden="true" className="size-4" />
              {confirming === decision ? `Xác nhận ${meta.label.toLowerCase()}` : meta.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
