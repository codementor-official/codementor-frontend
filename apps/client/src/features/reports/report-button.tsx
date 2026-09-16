"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Modal, useToast } from "@codementor/ui";
import { api } from "@/lib/api";
import type { ReportCategory, ReportTarget } from "@/features/account/types";

const categories: Array<{ value: ReportCategory; label: string }> = [
  { value: "SPAM", label: "Spam hoặc quảng cáo" },
  { value: "MISLEADING", label: "Thông tin sai lệch" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "COPYRIGHT", label: "Vi phạm bản quyền" },
  { value: "OTHER", label: "Lý do khác" },
];

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

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.account.submitReport({ targetType, targetId, targetRef, category, note });
      setOpen(false);
      setNote("");
      toast.success("Báo cáo đã được gửi và đang chờ xử lý.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không gửi được báo cáo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
              disabled={submitting}
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
          <label className="block space-y-1.5 text-sm font-semibold text-navy">
            Lý do
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ReportCategory)}
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm font-medium focus:border-primary"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm font-semibold text-navy">
            Mô tả thêm (không bắt buộc)
            <textarea
              value={note}
              maxLength={1000}
              rows={4}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nêu ngắn gọn vấn đề để việc kiểm duyệt chính xác hơn…"
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm font-normal focus:border-primary"
            />
            <span className="block text-right text-xs font-normal text-text-faint">{note.length}/1000</span>
          </label>
        </div>
      </Modal>
    </>
  );
}
