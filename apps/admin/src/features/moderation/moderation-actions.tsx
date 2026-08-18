"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button, Modal, useToast } from "@codementor/ui";
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
  /** Tên nội dung, nhắc lại trong hộp xác nhận để thấy mình đang xử lý đúng thứ định xử lý. */
  title?: string;
  size?: "sm" | "md";
  /** Nút phụ đứng trước hàng quyết định — chỗ cho liên kết "Mở trang kiểm tra". */
  before?: React.ReactNode;
}

/**
 * Bộ nút quyết định của admin.
 *
 * Việc nào có hậu quả — từ chối, yêu cầu sửa, gỡ khỏi công khai — đi qua một hộp xác nhận
 * mang theo ô lý do, chứ không phải một ô lý do luôn nằm trong drawer cộng một dòng cảnh
 * báo hiện lên chỗ khác. Hộp thoại nói rõ chuyện gì sắp xảy ra ngay tại chỗ người dùng
 * đang nhìn, và đóng nó lại là huỷ — không để lại nửa thao tác nào trên màn hình.
 *
 * Duyệt và khôi phục chạy thẳng: chúng mở nội dung ra hoặc trả nó về nháp, và cả hai đều
 * lùi lại được bằng đúng bộ nút này.
 */
export function ModerationActions({
  kind,
  id,
  status,
  onDone,
  title,
  size = "md",
  before,
}: ModerationActionsProps) {
  const toast = useToast();
  const { busy, decide } = useModeration(kind, onDone);
  const [asking, setAsking] = useState<ModerationDecision | null>(null);
  const available = DECISIONS_FOR[status] ?? [];

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nội dung đang là bản nháp của tác giả — chưa có gì để quyết định.
      </p>
    );
  }

  const run = async (decision: ModerationDecision, reason?: string) => {
    const ok = await decide(id, decision, reason);
    if (ok) {
      toast.success(`${DECISIONS[decision].done}${title ? `: ${title}` : ""}`);
      setAsking(null);
    }
  };

  return (
    <>
      {before}
      {available.map((decision) => {
        const meta = DECISIONS[decision];
        const Icon = meta.icon;
        return (
          <Button
            disabled={busy}
            key={decision}
            onClick={() => (meta.asks ? setAsking(decision) : void run(decision))}
            size={size}
            title={meta.hint}
            type="button"
            variant={meta.variant}
          >
            <Icon aria-hidden="true" className={size === "sm" ? "size-3.5" : "size-4"} />
            {meta.label}
          </Button>
        );
      })}

      {asking && (
        <DecisionDialog
          busy={busy}
          decision={asking}
          onCancel={() => setAsking(null)}
          onConfirm={(reason) => void run(asking, reason)}
          title={title}
        />
      )}
    </>
  );
}

function DecisionDialog({
  decision,
  title,
  busy,
  onCancel,
  onConfirm,
}: {
  decision: ModerationDecision;
  title?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const meta = DECISIONS[decision];
  const [reason, setReason] = useState("");
  const [missing, setMissing] = useState(false);

  const confirm = () => {
    if (meta.requiresReason && !reason.trim()) {
      setMissing(true);
      return;
    }
    onConfirm(meta.requiresReason ? reason.trim() : undefined);
  };

  return (
    <Modal
      description={title}
      footer={
        <>
          <Button disabled={busy} onClick={onCancel} type="button" variant="outline">
            Huỷ
          </Button>
          <Button disabled={busy} onClick={confirm} type="button" variant={meta.variant === "danger" ? "danger" : "default"}>
            {busy ? "Đang xử lý…" : meta.label}
          </Button>
        </>
      }
      onClose={() => !busy && onCancel()}
      open
      title={meta.question}
      width="sm"
    >
      <p className="text-sm text-muted-foreground">{meta.consequence}</p>

      {meta.requiresReason && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="moderation-reason">
            Lý do
          </label>
          <textarea
            autoFocus
            className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
            id="moderation-reason"
            onChange={(event) => {
              setReason(event.target.value);
              setMissing(false);
            }}
            placeholder="Tác giả sẽ đọc đúng câu này. Nói rõ chỗ nào chưa đạt và cần sửa gì."
            value={reason}
          />
          {/* Lỗi nhập liệu ở lại cạnh ô nhập, không thành toast: nó nói về thứ người dùng
              đang gõ dở, và biến mất sau bốn giây là biến mất trước khi sửa xong. */}
          {missing && (
            <p className="mt-1.5 text-xs text-destructive">
              Chưa có lý do. Không có nó thì tác giả không biết phải sửa gì.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Nút phụ dùng chung ở drawer: mở trang xem nội dung đầy đủ của bản ghi đang chọn. */
export function ReviewLink({ href, size = "sm" }: { href: string; size?: "sm" | "md" }) {
  return (
    <Link
      className={`mr-auto inline-flex items-center gap-1.5 rounded-md border bg-background font-medium text-foreground transition-colors hover:bg-muted ${
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm"
      }`}
      href={href}
    >
      <ExternalLink aria-hidden="true" className="size-3.5" />
      Mở trang kiểm tra
    </Link>
  );
}
