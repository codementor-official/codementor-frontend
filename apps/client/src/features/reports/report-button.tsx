"use client";

import { useState } from "react";
import { ApiClientError } from "@codementor/api-client";
import { Flag, Loader2 } from "lucide-react";
import { CharCount, FieldError, fieldA11y, Modal, useFieldErrors, useToast } from "@codementor/ui";
import { length } from "@codementor/utils";
import { api } from "@/lib/api";
import type { ReportCategory, ReportTarget } from "@/features/account/types";

/** Dùng chung cho mọi loại báo cáo, kể cả tài liệu nhóm — cùng đổ vào `content_reports`. */
export const REPORT_CATEGORIES: Array<{ value: ReportCategory; label: string }> = [
  { value: "SPAM", label: "Spam hoặc quảng cáo" },
  { value: "MISLEADING", label: "Thông tin sai lệch" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "COPYRIGHT", label: "Vi phạm bản quyền" },
  { value: "OTHER", label: "Lý do khác" },
];

// Khớp `REPORT_COOLDOWN_SECONDS` ở core-service. Server mới là nơi chặn thật; bản ghi ở trình
// duyệt chỉ để báo trước thay vì để người dùng viết xong mới bị từ chối.
const COOLDOWN_MS = 10 * 60 * 1000;
const LAST_REPORT_KEY = "codementor:last-report-at";

function readLastReport(): number {
  try {
    return Number(localStorage.getItem(LAST_REPORT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function minutesLeft(until: number) {
  return Math.max(0, Math.ceil((until - Date.now()) / 60_000));
}

export function ReportButton({
  targetType,
  targetId,
  targetRef,
  compact = false,
}: {
  targetType: ReportTarget;
  targetId: string;
  targetRef?: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("INAPPROPRIATE");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Số phút còn phải chờ, tính lúc mở hộp thoại hoặc lúc server từ chối; 0 là gửi được.
  const [blockedMinutes, setBlockedMinutes] = useState(0);
  const blocked = blockedMinutes > 0;

  const openDialog = () => {
    const last = readLastReport();
    setBlockedMinutes(minutesLeft(last + COOLDOWN_MS));
    setOpen(true);
  };
  // `CreateContentReportDto.note` không bắt buộc, ≤ 1000.
  const form = useFieldErrors({ note }, { note: length(note, "Mô tả thêm", { max: 1000 }) });

  const submit = async () => {
    if (!form.validate()) return;
    setSubmitting(true);
    try {
      await api.account.submitReport({ targetType, targetId, targetRef, category, note: note.trim() });
      setOpen(false);
      setNote("");
      try {
        localStorage.setItem(LAST_REPORT_KEY, String(Date.now()));
      } catch {
        // Không lưu được thì server vẫn chặn; chỉ mất phần báo trước.
      }
      toast.success("Báo cáo đã được gửi và đang chờ xử lý.");
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 429) {
        const details = (cause.body as { details?: { retryAfterSeconds?: number } } | undefined)?.details;
        setBlockedMinutes(Math.max(1, Math.ceil((details?.retryAfterSeconds ?? COOLDOWN_MS / 1000) / 60)));
        return;
      }
      toast.error(cause instanceof Error ? cause.message : "Không gửi được báo cáo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label="Báo cáo nội dung"
        className={
          compact
            ? "rounded-md p-2 text-text-faint transition-colors hover:bg-bg hover:text-danger"
            : "inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-navy transition-colors hover:border-danger/30 hover:bg-danger/5 hover:text-danger"
        }
      >
        <Flag className="h-4 w-4" />
        {!compact && "Báo cáo"}
      </button>
      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Báo cáo nội dung"
        description="Báo cáo được lưu ở trạng thái chờ để đội ngũ kiểm duyệt xem xét."
        width="sm"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setOpen(false)}
              className="h-9 rounded-md border border-border px-4 text-sm font-semibold text-navy hover:bg-bg disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting || blocked}
              onClick={() => void submit()}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-ink hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {blocked && (
            <p role="alert" className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-text">
              Bạn vừa gửi một báo cáo. Mỗi tài khoản chỉ gửi được một báo cáo trong 10 phút — vui lòng thử lại sau{" "}
              {blockedMinutes} phút.
            </p>
          )}
          <label className="block space-y-1.5 text-sm font-semibold text-navy">
            Lý do
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ReportCategory)}
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm font-medium focus:border-primary"
            >
              {REPORT_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm font-semibold text-navy">
            Mô tả thêm (không bắt buộc)
            <textarea
              {...fieldA11y(`report-note-${targetId}`, form.errors.note)}
              value={note}
              rows={4}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nêu ngắn gọn vấn đề để việc kiểm duyệt chính xác hơn…"
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm font-normal focus:border-primary"
            />
            <span className="flex items-start justify-between gap-3 font-normal">
              <FieldError error={form.errors.note} htmlFor={`report-note-${targetId}`} />
              <span className="ml-auto"><CharCount value={note} max={1000} /></span>
            </span>
          </label>
        </div>
      </Modal>
    </>
  );
}
