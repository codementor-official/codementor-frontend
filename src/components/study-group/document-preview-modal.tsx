"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ExternalLink, FileText, Play, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DOCUMENT_STATUS_META, DOCUMENT_VERDICT_META } from "@/lib/study-group/group-detail-meta";
import type { GroupDocument } from "@/types/study-group-detail";

/** Formats that carry readable text we can actually render. */
const TEXT_FORMATS = new Set(["Markdown", "PDF", "Slide", "DOCX"]);

function PreviewBody({ doc }: { doc: GroupDocument }) {
  if (doc.type === "Link") {
    return (
      <div className="rounded-md border border-border bg-bg p-5 text-center">
        <ExternalLink className="mx-auto mb-2 h-5 w-5 text-text-faint" />
        <p className="mb-1 text-sm text-text-muted">Tài liệu này là liên kết ngoài.</p>
        <p className="mb-3 font-mono text-xs break-all text-navy">{doc.url ?? "(chưa có liên kết)"}</p>
        {doc.url && (
          <Button size="sm" variant="outline" href={doc.url} target="_blank" rel="noopener noreferrer">
            Mở liên kết <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  if (doc.type === "Video") {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md bg-navy">
        <div className="text-center">
          <Play className="mx-auto mb-2 h-8 w-8 text-white/70" />
          <p className="text-xs text-white/70">Bản xem trước video · {doc.sizeLabel}</p>
        </div>
      </div>
    );
  }

  if (doc.type === "Bảng tính") {
    return (
      <div className="rounded-md border border-border bg-bg p-8 text-center">
        <Table2 className="mx-auto mb-2 h-6 w-6 text-text-faint" />
        <p className="text-sm text-text-muted">
          Bảng tính chưa hỗ trợ xem trước trong trình duyệt. Tải xuống để mở bằng Excel hoặc Google Sheets.
        </p>
      </div>
    );
  }

  if (TEXT_FORMATS.has(doc.type) && doc.previewText) {
    return (
      <div className="max-h-96 overflow-y-auto rounded-md border border-border bg-surface p-5">
        <div className="prose-sm flex flex-col gap-2 text-sm leading-relaxed text-text [&_code]:rounded-sm [&_code]:bg-border-soft [&_code]:px-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-navy [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-navy [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-navy">
          <ReactMarkdown>{doc.previewText}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg p-8 text-center">
      <FileText className="mx-auto mb-2 h-6 w-6 text-text-faint" />
      <p className="text-sm text-text-muted">
        Chưa có bản xem trước cho định dạng {doc.type}. Tải xuống để xem đầy đủ.
      </p>
    </div>
  );
}

export function DocumentPreviewModal({
  doc,
  onClose,
  canManage,
  onApprove,
  onHide,
  onReject,
}: {
  doc: GroupDocument | null;
  onClose: () => void;
  canManage: boolean;
  onApprove: (doc: GroupDocument) => void;
  onHide: (doc: GroupDocument) => void;
  /** Reject with a reason the uploader will see; optionally delete outright. */
  onReject: (doc: GroupDocument, reason: string, alsoDelete: boolean) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [alsoDelete, setAlsoDelete] = useState(false);

  useEffect(() => {
    setRejecting(false);
    setReason("");
    setAlsoDelete(false);
  }, [doc?.id]);

  if (!doc) return null;
  const statusMeta = DOCUMENT_STATUS_META[doc.status];
  const verdictMeta = DOCUMENT_VERDICT_META[doc.verdict];
  const needsApproval = doc.status !== "published";

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={doc.title}
      description={`${doc.type} · ${doc.sizeLabel} · ${doc.uploaderName} · ${doc.uploadedAt}`}
      footer={
        canManage ? (
          <>
            {needsApproval && (
              <Button size="sm" onClick={() => onApprove(doc)}>
                Duyệt tài liệu
              </Button>
            )}
            {doc.status !== "rejected" && (
              <Button size="sm" variant="outline" onClick={() => setRejecting((v) => !v)}>
                Từ chối duyệt
              </Button>
            )}
            {doc.status !== "hidden" && (
              <Button size="sm" variant="outline" onClick={() => onHide(doc)}>
                Ẩn với thành viên
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        )
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        <span className="text-xs text-text-muted">
          AI kiểm tra:{" "}
          <span className={verdictMeta.tone === "primary" ? "font-semibold text-primary" : "text-text"}>
            {verdictMeta.label}
          </span>
        </span>
      </div>
      <PreviewBody doc={doc} />

      {canManage && rejecting && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) return;
            onReject(doc, reason.trim(), alsoDelete);
          }}
          className="mt-4 rounded-md border border-primary bg-primary-tint p-4"
        >
          <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-semibold text-navy">
            Lý do từ chối
          </label>
          <p className="mb-2 text-xs text-text-muted">
            Lý do này được gửi cho người tải lên, nên hãy nói rõ cần sửa gì.
          </p>
          <textarea
            id="reject-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: tài liệu chứa thông tin cá nhân, cần che trước khi tải lại..."
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={alsoDelete}
              onChange={(e) => setAlsoDelete(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Xóa tài liệu sau khi từ chối
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!reason.trim()}>
              Gửi từ chối
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setRejecting(false)}>
              Hủy
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
