"use client";

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
}: {
  doc: GroupDocument | null;
  onClose: () => void;
  canManage: boolean;
  onApprove: (doc: GroupDocument) => void;
  onHide: (doc: GroupDocument) => void;
}) {
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
    </Modal>
  );
}
