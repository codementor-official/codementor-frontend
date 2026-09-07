"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Flag,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Select, useToast } from "@codementor/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/download-csv";
import { messageOf, toLocalInput } from "../exercise-authoring";
import type { ExerciseSummary } from "@/types/catalogue";
import type {
  WorkspaceAssignment,
  WorkspaceContentPage,
  WorkspaceDetail,
  WorkspaceDocument,
  WorkspaceExercise,
  WorkspaceExerciseDetail,
  WorkspaceMember,
  WorkspaceSubmission,
} from "../types";
import { WorkspaceMemberSelector } from "./workspace-member-selector";

const EMPTY_PAGE = <T,>(): WorkspaceContentPage<T> => ({
  items: [],
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
});
const inputClass =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy";

export function WorkspaceDocumentsTab({ detail }: { detail: WorkspaceDetail }) {
  const toast = useToast();
  const [data, setData] = useState(EMPTY_PAGE<WorkspaceDocument>());
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [removing, setRemoving] = useState<WorkspaceDocument | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [moderating, setModerating] = useState<{ document: WorkspaceDocument; status: string } | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [editing, setEditing] = useState<WorkspaceDocument | null>(null);
  const [previewing, setPreviewing] = useState<WorkspaceDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [reporting, setReporting] = useState<WorkspaceDocument | null>(null);
  const canUpload =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.upload_doc;
  const canDeleteAny =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.delete_doc;
  const canApprove =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.approve_doc;
  const canViewUnpublished = canApprove || canDeleteAny;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await api.workspaces.documents(detail.slug, {
          page,
          limit: 12,
          q: q || undefined,
          status: status || undefined,
        }),
      );
      if (canApprove) {
        const pending = await api.workspaces.pendingDocumentCount(detail.slug);
        setPendingCount(pending.count);
      }
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [detail.slug, page, q, status, canApprove, toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const config = await api.workspaces.documentUploadConfig(detail.slug);
      if (!config.enabled) throw new Error("Storage chưa được cấu hình");
      if (
        !config.acceptedTypes.includes(file.type) ||
        file.size > config.maxBytes
      )
        throw new Error("Định dạng hoặc dung lượng tệp không hợp lệ");
      const signed = await api.workspaces.documentUploadUrl(detail.slug, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      await putFile(signed.uploadUrl, signed.headers, file, setProgress);
      await api.workspaces.createDocument(detail.slug, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        title: file.name.replace(/\.[^.]+$/, ""),
        docType: extension(file.name),
        storageKey: signed.objectKey,
        url: signed.publicUrl,
      });
      toast.success(
        detail.currentMembership.role === "owner"
          ? "Đã tải và xuất bản tài liệu"
          : "Đã tải tài liệu; nội dung đang chờ Chủ nhóm duyệt",
      );
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  const remove = async () => {
    if (!removing) return;
    if (!removeReason.trim()) {
      toast.error("Vui lòng nhập lý do xóa tài liệu");
      return;
    }
    try {
      await api.workspaces.deleteDocument(detail.slug, removing.id, removeReason.trim());
      toast.success("Đã chuyển tài liệu vào mục đã xóa");
      setRemoving(null);
      setRemoveReason("");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const restore = async (doc: WorkspaceDocument) => {
    try {
      await api.workspaces.restoreDocument(detail.slug, doc.id);
      toast.success("Đã khôi phục tài liệu");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const purge = async (doc: WorkspaceDocument) => {
    try {
      await api.workspaces.purgeDocument(detail.slug, doc.id);
      toast.success("Đã xóa vĩnh viễn tài liệu và tệp lưu trữ");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const changeStatus = async (doc: WorkspaceDocument, next: string, reason?: string) => {
    if (["hidden", "rejected", "changes"].includes(next) && !reason?.trim()) {
      setModerating({ document: doc, status: next });
      setModerationReason("");
      return;
    }
    try {
      await api.workspaces.updateDocument(detail.slug, doc.id, {
        status: next,
        reason: reason?.trim(),
      });
      setModerating(null);
      setModerationReason("");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const preview = async (doc: WorkspaceDocument) => {
    setPreviewing(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const signed = await api.workspaces.documentDownload(
        detail.slug,
        doc.id,
        true,
      );
      if (!signed.url) throw new Error("Tài liệu chưa có đường dẫn tải");
      setPreviewUrl(signed.url);
    } catch (e) {
      toast.error(messageOf(e));
      setPreviewing(null);
    } finally {
      setPreviewLoading(false);
    }
  };
  const download = async (doc: WorkspaceDocument) => {
    try {
      const signed = await api.workspaces.documentDownload(detail.slug, doc.id);
      if (!signed.url) throw new Error("Tài liệu chưa có đường dẫn tải");
      window.open(signed.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  return (
    <div className="space-y-4">
      {canApprove && pendingCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <Clock3 className="h-4 w-4 text-primary" />
          <p className="min-w-0 flex-1 text-sm font-medium text-navy">
            Có {pendingCount} tài liệu đang chờ duyệt.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setStatus("pending");
              setPage(1);
            }}
          >
            Duyệt ngay
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${inputClass} min-w-56 flex-1`}
          placeholder="Tìm tài liệu..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        {canViewUnpublished && (
          <Select
            label="Trạng thái"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả" },
              { value: "published", label: "Đã duyệt" },
              { value: "recent", label: "Vừa duyệt trong 24 giờ" },
              { value: "pending", label: "Chờ duyệt" },
              { value: "changes", label: "Cần chỉnh sửa" },
              { value: "rejected", label: "Đã từ chối" },
              { value: "hidden", label: "Đã ẩn" },
              { value: "removed", label: "Đã xóa" },
            ]}
          />
        )}
        {canUpload && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-ink">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? `Đang tải ${progress}%` : "Tải tài liệu"}
            <input
              type="file"
              className="sr-only"
              disabled={uploading}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.json,.js,.ts,.tsx,.css,.html,.png,.jpg,.jpeg,.webp,.mp4,.webm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {detail.currentMembership.role !== "owner" && canUpload && (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-text-muted">
          Tài liệu do thành viên tải lên sẽ hiển thị sau khi Chủ nhóm duyệt.
        </p>
      )}
      {loading ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty icon={FileText} title="Chưa có tài liệu" />
      ) : (
        <div className="grid gap-3">
          {data.items.map((doc) => (
            <Card
              key={doc.id}
              className="flex cursor-pointer flex-wrap items-center gap-3 p-4 transition hover:border-primary/40"
              onClick={() => void preview(doc)}
            >
              <FileText className="h-5 w-5 text-text-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {doc.title}
                </p>
                <p className="text-xs text-text-faint">
                  {doc.docType.toUpperCase()} · {formatBytes(doc.sizeBytes)} ·{" "}
                  {doc.uploaderName ?? "Không rõ"} ·{" "}
                  {formatDate(doc.uploadedAt)}
                </p>
              </div>
              {canViewUnpublished && doc.status !== "removed" && (
                <span className="text-xs font-medium text-text-muted">
                  {statusLabel(doc.status)}
                </span>
              )}
              {(doc.url || doc.storageKey) && (
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    void preview(doc);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Xem
                </Button>
              )}
              {doc.canEdit && doc.status !== "removed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(doc);
                  }}
                >
                  Sửa
                </Button>
              )}
              {doc.canApprove && doc.status !== "removed" && (
                <div onClick={(event) => event.stopPropagation()}>
                  <Select
                    label="Thao tác với tài liệu"
                    value=""
                    onChange={(v) => { if (v) void changeStatus(doc, v); }}
                    options={documentStatusOptions(doc.status)}
                  />
                </div>
              )}
              {doc.canDelete && doc.status !== "removed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRemoving(doc);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </Button>
              )}
              {!canViewUnpublished && doc.status === "published" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    setReporting(doc);
                  }}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Báo cáo
                </Button>
              )}
              {canDeleteAny && doc.status === "removed" && (
                <>
                  <div className="w-full text-2xs text-text-muted sm:w-auto">
                    {doc.deleteReason ? `Lý do: ${doc.deleteReason} · ` : ""}{retentionLabel(doc.deletedAt)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canPurge(doc.deletedAt)}
                    title={canPurge(doc.deletedAt) ? "Xóa vĩnh viễn" : "Chỉ có thể xóa vĩnh viễn sau 30 ngày"}
                    onClick={(event) => {
                      event.stopPropagation();
                      void restore(doc);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Khôi phục
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      void purge(doc);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa vĩnh viễn
                  </Button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageCount={data.totalPages}
        onChange={setPage}
        label="Phân trang tài liệu"
      />
      {previewing && (
        <DocumentPreviewDialog
          document={previewing}
          url={previewUrl}
          loading={previewLoading}
          onClose={() => {
            setPreviewing(null);
            setPreviewUrl(null);
          }}
          onDownload={() => void download(previewing)}
        />
      )}
      {editing && (
        <DocumentEditDialog
          document={editing}
          slug={detail.slug}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => { setRemoving(null); setRemoveReason(""); }}
        onConfirm={() => void remove()}
        title="Chuyển tài liệu vào mục đã xóa?"
        confirmLabel="Xóa"
        message={`Tài liệu “${removing?.title ?? ""}” sẽ được ẩn khỏi danh sách. Tệp trên storage chỉ bị xóa khi xóa vĩnh viễn.`}
      >
        <label className="grid gap-1.5 text-xs font-semibold text-navy">Lý do xóa <span className="font-normal text-danger">Bắt buộc</span><textarea autoFocus rows={3} maxLength={500} value={removeReason} onChange={(event) => setRemoveReason(event.target.value)} placeholder="Nêu rõ lý do để chủ tài liệu nhận được thông báo…" className={`${inputClass} resize-none font-normal`} /></label>
      </ConfirmDialog>
      <ConfirmDialog
        open={moderating !== null}
        onClose={() => { setModerating(null); setModerationReason(""); }}
        onConfirm={() => {
          if (!moderationReason.trim()) { toast.error("Vui lòng nhập lý do xử lý tài liệu"); return; }
          if (moderating) void changeStatus(moderating.document, moderating.status, moderationReason);
        }}
        title="Xác nhận xử lý tài liệu"
        confirmLabel="Xác nhận"
        message={`Hành động “${moderating ? statusLabel(moderating.status) : ""}” sẽ được thông báo cho chủ tài liệu.`}
      >
        <label className="grid gap-1.5 text-xs font-semibold text-navy">Lý do <span className="font-normal text-danger">Bắt buộc</span><textarea autoFocus rows={3} maxLength={500} value={moderationReason} onChange={(event) => setModerationReason(event.target.value)} placeholder="Nêu rõ nội dung cần chỉnh sửa hoặc lý do không hiển thị…" className={`${inputClass} resize-none font-normal`} /></label>
      </ConfirmDialog>
      {reporting && (
        <DocumentReportDialog
          document={reporting}
          slug={detail.slug}
          onClose={() => setReporting(null)}
        />
      )}
    </div>
  );
}

function DocumentEditDialog({
  document,
  slug,
  onClose,
  onSaved,
}: {
  document: WorkspaceDocument;
  slug: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(document.title);
  const [topic, setTopic] = useState(document.topic ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("Tên tài liệu không được để trống");
      return;
    }
    setBusy(true);
    try {
      await api.workspaces.updateDocument(slug, document.id, {
        title: nextTitle,
        topic: topic.trim() || null,
      });
      await onSaved();
      toast.success("Đã cập nhật tài liệu");
      onClose();
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/35 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Sửa tài liệu ${document.title}`}
    >
      <Card className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden p-0">
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-border-soft bg-surface px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-navy">Sửa tài liệu</h2>
            <p className="mt-1 text-xs text-text-faint">
              Chỉ cập nhật thông tin hiển thị, tệp gốc được giữ nguyên.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded p-1 text-text-muted hover:bg-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block text-xs font-medium text-text-muted">
            Tên tài liệu
            <input
              className={`${inputClass} mt-1 w-full`}
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            Chủ đề
            <input
              className={`${inputClass} mt-1 w-full`}
              value={topic}
              maxLength={100}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Ví dụ: Cây và đồ thị"
            />
          </label>
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-soft bg-surface p-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={() => void save()} disabled={busy || !title.trim()}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu thay đổi
          </Button>
        </footer>
      </Card>
    </div>
  );
}

function DocumentPreviewDialog({
  document,
  url,
  loading,
  onClose,
  onDownload,
}: {
  document: WorkspaceDocument;
  url: string | null;
  loading: boolean;
  onClose: () => void;
  onDownload: () => void;
}) {
  const kind = previewKind(document.docType);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/35 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem tài liệu ${document.title}`}
    >
      <Card className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex shrink-0 flex-wrap items-start gap-3 border-b border-border-soft bg-surface p-4">
          <FileText className="mt-0.5 h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-navy">
              {document.title}
            </h2>
            <p className="mt-1 text-xs text-text-faint">
              {document.docType.toUpperCase()} ·{" "}
              {formatBytes(document.sizeBytes)} · tải bởi{" "}
              {document.uploaderName ?? "Không rõ"} ·{" "}
              {formatDate(document.uploadedAt)}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="h-3.5 w-3.5" />
            Tải xuống
          </Button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước"
            className="rounded p-1 text-text-muted hover:bg-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-[60vh] flex-1 overflow-auto bg-bg p-3 sm:min-h-[70vh]">
          {loading ? (
            <Loading />
          ) : !url ? (
            <Empty icon={FileText} title="Không có đường dẫn xem trước" />
          ) : kind === "image" ? (
            <img
              src={url}
              alt={document.title}
              className="mx-auto max-h-[70vh] max-w-full rounded object-contain"
            />
          ) : kind === "video" ? (
            <video
              src={url}
              controls
              preload="metadata"
              className="mx-auto max-h-[70vh] w-full max-w-5xl rounded bg-navy"
            >
              Trình duyệt không hỗ trợ video.
            </video>
          ) : kind === "frame" || kind === "office" ? (
            <iframe
              src={
                kind === "office"
                  ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
                  : url
              }
              title={document.title}
              className="h-[70vh] w-full rounded border border-border bg-surface"
            />
          ) : (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
              <FileText className="mb-3 h-10 w-10 text-text-faint" />
              <p className="text-sm font-semibold text-navy">
                Định dạng này chưa hỗ trợ xem trực tiếp
              </p>
              <p className="mt-1 max-w-md text-xs text-text-faint">
                Bạn vẫn có thể tải tệp về để mở bằng ứng dụng phù hợp.
              </p>
              <Button className="mt-4" size="sm" onClick={onDownload}>
                <Download className="h-3.5 w-3.5" />
                Tải xuống
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function DocumentReportDialog({
  document,
  slug,
  onClose,
}: {
  document: WorkspaceDocument;
  slug: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [category, setCategory] = useState("irrelevant");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.workspaces.reportDocument(slug, document.id, {
        category,
        note: note.trim() || undefined,
      });
      toast.success("Đã gửi báo cáo để quản trị viên xem xét");
      onClose();
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/35 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-label="Báo cáo tài liệu"
    >
      <Card className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden p-0">
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-border-soft bg-surface px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-navy">Báo cáo tài liệu</h2>
            <p className="mt-1 text-xs text-text-muted">{document.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded p-1 text-text-muted hover:bg-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <Select
            label="Lý do"
            value={category}
            onChange={setCategory}
            options={[
              { value: "spam", label: "Spam" },
              { value: "inappropriate", label: "Nội dung không phù hợp" },
              { value: "copyright", label: "Vi phạm bản quyền" },
              { value: "harmful", label: "Nội dung có hại" },
              { value: "irrelevant", label: "Không liên quan Workspace" },
              { value: "other", label: "Lý do khác" },
            ]}
          />
          <label className="block text-xs font-medium text-text-muted">
            Ghi chú (không bắt buộc)
            <textarea
              className={`${inputClass} mt-1 min-h-24 w-full resize-y`}
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mô tả ngắn để quản trị viên kiểm tra chính xác hơn..."
            />
          </label>
          <p className="text-xs text-text-faint">
            Vui lòng chỉ báo cáo nội dung thực sự vi phạm. Báo cáo trùng lặp sẽ
            bị từ chối.
          </p>
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-soft bg-surface p-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Gửi báo cáo
          </Button>
        </footer>
      </Card>
    </div>
  );
}

export function WorkspaceExercisesTab({
  detail,
  members,
  initialExerciseId,
}: {
  detail: WorkspaceDetail;
  members: WorkspaceMember[];
  initialExerciseId?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState(EMPTY_PAGE<WorkspaceExercise>());
  const [bank, setBank] = useState<ExerciseSummary[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [scope, setScope] = useState<"all" | "assigned" | "public">("all");
  const [exerciseStatus, setExerciseStatus] = useState("");
  const [selected, setSelected] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [reminders, setReminders] = useState<WorkspaceExercise[]>([]);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceExercise | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(() =>
    initialExerciseId && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(initialExerciseId)
      ? initialExerciseId : null,
  );
  const assignable = members.filter((m) => m.role !== "owner");
  const [memberIds, setMemberIds] = useState<string[]>(
    assignable.map((m) => m.id),
  );
  const canCreate =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.create_exercise;
  const canDeleteAny =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.delete_exercise;
  const canEditAny =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.edit_exercise;
  const canAssign =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.assign_exercise;
  const load = useCallback(async () => {
    try {
      const main = await api.workspaces.workspaceExercises(detail.slug, {
        page,
        limit: 10,
        q: q || undefined,
        difficulty: difficulty || undefined,
        scope,
        status: exerciseStatus || undefined,
      });
      setData(main);
      if (!canEditAny && !canAssign) {
        const [overdue, dueSoon] = await Promise.all([
          api.workspaces.workspaceExercises(detail.slug, {
            limit: 5,
            scope: "assigned",
            status: "overdue",
          }),
          api.workspaces.workspaceExercises(detail.slug, {
            limit: 5,
            scope: "assigned",
            status: "due_soon",
          }),
        ]);
        setReminders(
          [
            ...overdue.items,
            ...dueSoon.items.filter(
              (item) =>
                !overdue.items.some(
                  (overdueItem) => overdueItem.id === item.id,
                ),
            ),
          ].slice(0, 6),
        );
      }
    } catch (e) {
      toast.error(messageOf(e));
    }
  }, [detail.slug, page, q, difficulty, scope, exerciseStatus, canEditAny, canAssign, toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (canAssign)
      void api.exercises
        .bank({ limit: 50 })
        .then((r) => setBank(r.items))
        .catch(() => setBank([]));
  }, [canAssign]);
  const attach = async () => {
    if (!selected || memberIds.length === 0) return;
    setBusy(true);
    try {
      await api.workspaces.attachExercise(detail.slug, {
        exerciseId: selected,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        memberIds,
      });
      toast.success("Đã thêm và phân công bài tập");
      setSelected("");
      setDueAt("");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!removing) return;
    if (!removeReason.trim()) {
      toast.error("Vui lòng nhập lý do gỡ bài tập");
      return;
    }
    try {
      await api.workspaces.deleteWorkspaceExercise(detail.slug, removing.id, removeReason.trim());
      setRemoving(null);
      setRemoveReason("");
      toast.success("Đã chuyển bài tập vào mục đã xóa");
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const exportExercises = async () => {
    try {
      const response = await api.workspaces.workspaceExercises(detail.slug, {
        page: 1,
        limit: 100,
        q: q || undefined,
        difficulty: difficulty || undefined,
        scope,
        status: exerciseStatus || undefined,
      });
      downloadCsv(
        `workspace-exercises-${todayForFile()}.csv`,
        [
          "Bài tập",
          "Độ khó",
          "Trạng thái",
          "Số thành viên được giao",
          "Hạn nộp",
        ],
        response.items.map((item) => [
          item.title,
          difficultyLabel(item.difficulty),
          item.publicationStatus,
          item.assignedCount,
          item.dueAt ? formatDate(item.dueAt) : "Không giới hạn",
        ]),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể xuất danh sách bài tập."));
    }
  };
  return (
    <div className="space-y-4">
      {(canCreate || canAssign) && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-navy">Quản lý bài tập</h2>
              {canAssign && (
                <p className="mt-1 text-xs text-text-faint">
                  {memberIds.length} thành viên đang được chọn để phân công
                </p>
              )}
            </div>
            {canCreate && (
              <Button
                size="sm"
                href={`/workspace/${encodeURIComponent(detail.slug)}/exercises/new`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tạo bài mới
              </Button>
            )}
          </div>
          {canAssign && (
            <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_220px_200px_160px]">
              <div className="min-w-0">
                <Select
                  label="Chọn bài tập"
                  value={selected}
                  onChange={setSelected}
                  className="w-full"
                  options={[
                    { value: "", label: "Chọn bài tập" },
                    ...bank.map((x) => ({ value: x.id, label: x.title })),
                  ]}
                />
              </div>
              <label className="grid gap-1 text-xs font-medium text-text-muted">
                <span>Hạn nộp</span>
                <input
                  type="datetime-local"
                  className={`${inputClass} h-9 w-full py-0 text-xs`}
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                className="h-9 whitespace-nowrap"
                aria-expanded={assignmentOpen}
                aria-controls="workspace-assignment-options"
                onClick={() => setAssignmentOpen((value) => !value)}
              >
                <Users className="h-3.5 w-3.5" />
                {assignmentOpen
                  ? `Đã chọn ${memberIds.length}`
                  : "Chọn người được giao"}
              </Button>
              <Button
                size="sm"
                className="h-9 whitespace-nowrap"
                disabled={!selected || !memberIds.length || busy}
                onClick={() => void attach()}
              >
                <Plus className="h-3.5 w-3.5" />
                Xác nhận giao
              </Button>
            </div>
          )}
          {canAssign && assignmentOpen && (
            <WorkspaceMemberSelector
              id="workspace-assignment-options"
              members={assignable}
              selectedIds={memberIds}
              onChange={setMemberIds}
            />
          )}
        </Card>
      )}
      {!canEditAny && !canAssign && reminders.length > 0 && (
        <Card className="border-primary/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-navy">Cần hoàn thành</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {reminders.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {reminders.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDetailId(item.id)}
                className="flex items-center gap-3 rounded-md border border-border-soft p-3 text-left hover:border-primary/40"
              >
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 ${isOverdue(item.dueAt) ? "text-danger" : "text-primary"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-navy">
                    {item.title}
                  </span>
                  <span className="text-2xs text-text-faint">
                    {isOverdue(item.dueAt)
                      ? "Đã quá hạn"
                      : `Hạn ${formatDate(item.dueAt!)}`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
      <div
        className={`grid gap-2 md:grid-cols-2 ${canEditAny ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
      >
        <input
          className={`${inputClass} xl:col-span-2`}
          placeholder="Tìm bài tập..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Độ khó"
          className="w-full"
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Tất cả" },
            { value: "easy", label: "Cơ bản" },
            { value: "medium", label: "Trung bình" },
            { value: "hard", label: "Nâng cao" },
          ]}
        />
        {!canEditAny && (
          <>
            <Select
              label="Phạm vi"
              className="w-full"
              value={scope}
              onChange={(value) => {
                setScope(value as "all" | "assigned" | "public");
                setPage(1);
              }}
              options={[
                { value: "all", label: "Tất cả bài trong nhóm" },
                { value: "assigned", label: "Được giao cho tôi" },
                { value: "public", label: "Bài công khai" },
              ]}
            />
            <Select
              label="Tiến độ"
              className="w-full"
              value={exerciseStatus}
              onChange={(value) => {
                setExerciseStatus(value);
                setPage(1);
              }}
              options={[
                { value: "", label: "Mọi trạng thái" },
                { value: "not_started", label: "Chưa bắt đầu" },
                { value: "in_progress", label: "Đang làm" },
                { value: "not_passed", label: "Chưa đạt" },
                { value: "completed", label: "Đã hoàn thành" },
                { value: "due_soon", label: "Sắp đến hạn" },
                { value: "overdue", label: "Quá hạn" },
              ]}
            />
          </>
        )}
        {(canEditAny || canDeleteAny) && (
          <Select
            label="Trạng thái"
            className="w-full"
            value={exerciseStatus}
            onChange={(value) => {
              setExerciseStatus(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả đang hoạt động" },
              { value: "published", label: "Đang hiển thị" },
              { value: "hidden", label: "Đã ẩn" },
              ...(canDeleteAny
                ? [{ value: "removed", label: "Đã xóa" }]
                : []),
            ]}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-faint">
        <span>{data.total} bài tập phù hợp</span>
        <div className="flex items-center gap-3">
          <span>
            Trang {data.page} / {Math.max(data.totalPages, 1)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void exportExercises()}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>
      {data.items.length === 0 ? (
        <Empty icon={Plus} title="Chưa có bài tập" />
      ) : (
        <div className="grid gap-3">
          {data.items.map((ex) => (
            <Card
              key={ex.id}
              className="flex cursor-pointer flex-wrap items-center gap-3 p-4 transition hover:border-primary/40"
              onClick={() => setDetailId(ex.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy">{ex.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${ex.isAssignedToMe ? "bg-primary/10 text-primary" : "bg-border-soft text-text-muted"}`}
                  >
                    {canEditAny || canAssign
                      ? `${ex.assignedCount} người được giao`
                      : ex.isAssignedToMe
                        ? "Được giao cho tôi"
                        : "Bài công khai"}
                  </span>
                  {ex.myAssignment && (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-2xs text-text-muted">
                      {assignmentLabel(ex.myAssignment.status)}
                    </span>
                  )}
                  {(canEditAny || canDeleteAny) && <span className="rounded-full bg-border-soft px-2 py-0.5 text-2xs font-semibold text-text-muted">{ex.publicationStatus === "published" ? "Đang hiển thị" : "Đã ẩn"}</span>}
                </div>
                <p className="text-xs text-text-faint">
                  {difficultyLabel(ex.difficulty)} · {ex.completedCount}/
                  {ex.assignedCount} hoàn thành ·{" "}
                  {ex.dueAt
                    ? `${isOverdue(ex.dueAt) && ex.myAssignment?.status !== "done" ? "Quá hạn " : "Hạn "}${formatDate(ex.dueAt)}`
                    : "Không hạn"}
                  {ex.myAssignment
                    ? ` · ${ex.myAssignment.submissionCount} lượt nộp`
                    : ""}
                </p>
              </div>
              <Button
                href={workspaceSolveHref(
                  detail.slug,
                  ex.exerciseId,
                  ex.id,
                  ex.myAssignment?.id,
                )}
                size="sm"
                variant="outline"
                onClick={(event: MouseEvent) => event.stopPropagation()}
              >
                Mở bài
              </Button>
              {(ex.canEdit || ex.canDelete || ex.canRestore || canCreate) && (
                <>
                  {ex.deletedAt ? (
                    <>
                      <div className="w-full text-2xs text-text-muted sm:w-auto">{ex.deleteReason ? `Lý do: ${ex.deleteReason} · ` : ""}{retentionLabel(ex.deletedAt)}</div>
                      {ex.canRestore && <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          void api.workspaces
                            .restoreWorkspaceExercise(detail.slug, ex.id)
                            .then(() => load())
                            .catch((error) => toast.error(messageOf(error)));
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Khôi phục
                      </Button>}
                      {canDeleteAny && <Button size="sm" variant="outline" disabled={!canPurge(ex.deletedAt)} title={canPurge(ex.deletedAt) ? "Xóa vĩnh viễn" : "Chỉ có thể xóa vĩnh viễn sau 30 ngày"} onClick={(event) => { event.stopPropagation(); void api.workspaces.purgeWorkspaceExercise(detail.slug, ex.id).then(() => load()).catch((error) => toast.error(messageOf(error))); }}><Trash2 className="h-3.5 w-3.5" />Xóa vĩnh viễn</Button>}
                    </>
                  ) : (
                    <>
                      {canCreate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            void api.workspaces
                              .duplicateWorkspaceExercise(detail.slug, ex.id)
                              .then(() => {
                                toast.success("Đã nhân bản bài tập");
                                return load();
                              })
                              .catch((error) => toast.error(messageOf(error)));
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Nhân bản
                        </Button>
                      )}
                      {ex.canDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRemoving(ex);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Gỡ
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageCount={data.totalPages}
        onChange={setPage}
        label="Phân trang bài tập"
      />
      {detailId && (
        <ExerciseDetailDialog
          slug={detail.slug}
          id={detailId}
          members={assignable}
          onClose={() => setDetailId(null)}
          onUpdated={load}
          onOpenStudio={(exercise) => {
            setDetailId(null);
            router.push(
              `/workspace/${encodeURIComponent(detail.slug)}/exercises/${exercise.id}/studio`,
            );
          }}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => { setRemoving(null); setRemoveReason(""); }}
        onConfirm={() => void remove()}
        title="Chuyển bài tập vào mục đã xóa?"
        confirmLabel="Gỡ"
        message={`Bài “${removing?.title ?? ""}” sẽ được ẩn khỏi thành viên và vẫn có thể khôi phục.`}
      ><label className="grid gap-1.5 text-xs font-semibold text-navy">Lý do gỡ bài <span className="font-normal text-danger">Bắt buộc</span><textarea autoFocus rows={3} maxLength={500} value={removeReason} onChange={(event) => setRemoveReason(event.target.value)} placeholder="Nêu rõ lý do để tác giả nhận được thông báo…" className={`${inputClass} resize-none font-normal`} /></label></ConfirmDialog>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="min-w-0 text-xs font-medium text-text-muted">
      {label}
      <input
        className={`${inputClass} mt-1 block w-full`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-text-muted">
      {label}
      <textarea
        className={`${inputClass} mt-1 min-h-24 w-full resize-y`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ExerciseDetailDialog({
  slug,
  id,
  members,
  onClose,
  onUpdated,
  onOpenStudio,
}: {
  slug: string;
  id: string;
  members: WorkspaceMember[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
  onOpenStudio: (exercise: WorkspaceExerciseDetail) => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<WorkspaceExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<WorkspaceAssignment | null>(null);
  const [submissions, setSubmissions] = useState<WorkspaceSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [assignments, setAssignments] =
    useState(EMPTY_PAGE<WorkspaceAssignment>());
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [attemptLimit, setAttemptLimit] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [publicationStatus, setPublicationStatus] = useState<
    "published" | "hidden"
  >("published");
  const [publicationReason, setPublicationReason] = useState("");
  const [statement, setStatement] = useState("");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const selectedSubmission =
    submissions.find((item) => item.id === selectedSubmissionId) ??
    submissions[0];
  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.workspaces.workspaceExerciseDetail(slug, id);
      setData(next);
      setDueAt(next.dueAt ? toLocalInput(next.dueAt) : "");
      setAttemptLimit(next.attemptLimit?.toString() ?? "");
      setTitle(next.title);
      setSummary(next.summary ?? "");
      setDifficulty(next.difficulty);
      setPublicationStatus(next.publicationStatus);
      setPublicationReason("");
      setStatement(String(next.content?.statement ?? ""));
      setAssigned(
        next.assignedMemberIds ??
          next.assignments?.map((assignment) => assignment.memberId) ??
          [],
      );
    } catch (e) {
      toast.error(messageOf(e));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [slug, id, toast, onClose]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);
  const loadAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      setAssignments(
        await api.workspaces.assignments(slug, {
          page: assignmentPage,
          limit: 10,
          q: assignmentSearch.trim() || undefined,
          groupExerciseId: id,
        }),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể tải danh sách thành viên."));
    } finally {
      setAssignmentsLoading(false);
    }
  }, [assignmentPage, assignmentSearch, id, slug, toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadAssignments(), 200);
    return () => window.clearTimeout(timer);
  }, [loadAssignments]);
  const openHistory = async (assignment: WorkspaceAssignment) => {
    setSelectedAssignment(assignment);
    setHistoryLoading(true);
    setSubmissions([]);
    setSelectedSubmissionId("");
    try {
      const response = await api.workspaces.submissionHistory(
        slug,
        assignment.id,
      );
      setSubmissions(response.items);
      setSelectedSubmissionId(response.items[0]?.id ?? "");
    } catch (e) {
      toast.error(messageOf(e));
      setSubmissions([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  const exportSubmissionHistory = () => {
    if (!selectedAssignment) return;
    downloadCsv(
      `workspace-submissions-${todayForFile()}.csv`,
      [
        "Thành viên",
        "Lần nộp",
        "Kết quả",
        "Điểm",
        "Test đạt",
        "Tổng test",
        "Runtime (ms)",
        "Memory (KB)",
        "Ngôn ngữ",
        "Nộp trễ",
        "Thời gian",
      ],
      submissions.map((submission) => [
        selectedAssignment.memberName,
        submission.attemptNumber,
        verdictLabel(submission.verdict),
        submission.score ?? "",
        submission.passedTests ?? 0,
        submission.totalTests ?? 0,
        submission.runtimeMs ?? "",
        submission.memoryKb ?? "",
        submission.language,
        submission.isLate ? "Có" : "Không",
        formatDate(submission.submittedAt),
      ]),
    );
  };
  const save = async () => {
    if (!data) return;
    if (data.canPublish && publicationStatus === "hidden" && data.publicationStatus !== "hidden" && !publicationReason.trim()) {
      toast.error("Vui lòng nhập lý do ẩn bài tập");
      return;
    }
    setBusy(true);
    try {
      await api.workspaces.updateWorkspaceExercise(slug, id, {
        ...(data.canAssign
          ? {
              dueAt: dueAt ? new Date(dueAt).toISOString() : null,
              attemptLimit: attemptLimit ? Number(attemptLimit) : null,
              memberIds: assigned,
            }
          : {}),
        ...(data.canEdit
          ? {
              title: title.trim(),
              summary: summary.trim() || null,
              difficulty,
              content: data.content
                ? { ...data.content, statement: statement.trim() }
                : { statement: statement.trim(), ioMode: "stdin_stdout" },
            }
          : {}),
        ...(data.canPublish ? { publicationStatus, reason: publicationReason.trim() || undefined } : {}),
      });
      toast.success(
        data.canEdit && data.canAssign
          ? "Đã cập nhật bài tập và phân công"
          : data.canAssign
            ? "Đã cập nhật phân công"
            : "Đã cập nhật bài tập",
      );
      await loadDetail();
      await onUpdated();
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/35 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
    >
      <Card className="flex max-h-[92dvh] w-full max-w-7xl flex-col overflow-hidden p-0 shadow-2xl">
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-border-soft bg-surface px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {data?.title ?? "Chi tiết bài tập"}
            </h2>
            <p className="text-xs text-text-faint">
              Phân công, tiến độ và lịch sử từng lần nộp nằm chung tại đây.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data?.canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onOpenStudio(data)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Mở Studio
              </Button>
            )}
            <button type="button" onClick={onClose} aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5">
          {loading ? (
            <Loading />
          ) : (
            data && (
              <div className="space-y-5">
                {(data.canEdit || data.canAssign) && (
                  <Card className="space-y-3 bg-bg p-4">
                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {data.canEdit && (
                        <>
                          <Field
                            label="Tiêu đề"
                            value={title}
                            onChange={setTitle}
                          />
                          <Field
                            label="Tóm tắt"
                            value={summary}
                            onChange={setSummary}
                          />
                          <div className="min-w-0 text-xs font-medium text-text-muted">
                            <span>Độ khó</span>
                            <Select
                              label="Độ khó"
                              className="w-full"
                              containerClassName="mt-1"
                              value={difficulty}
                              onChange={(value) =>
                                setDifficulty(value as typeof difficulty)
                              }
                              options={[
                                { value: "easy", label: "Cơ bản" },
                                { value: "medium", label: "Trung bình" },
                                { value: "hard", label: "Nâng cao" },
                              ]}
                            />
                          </div>
                        </>
                      )}
                      {data.canPublish && (
                        <div className="min-w-0 text-xs font-medium text-text-muted">
                          <span>Trạng thái hiện tại</span>
                          <div className="mt-1 flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-surface px-3"><span className="text-xs font-semibold text-navy">{publicationStatus === "published" ? "Đang hiển thị" : "Đã ẩn"}</span><button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => { setPublicationStatus((value) => value === "published" ? "hidden" : "published"); setPublicationReason(""); }}>{publicationStatus === "published" ? "Ẩn bài tập" : "Hiển thị lại bài tập"}</button></div>
                        </div>
                      )}
                    </div>
                    {data.canPublish && publicationStatus === "hidden" && data.publicationStatus !== "hidden" && <label className="grid gap-1.5 text-xs font-semibold text-navy">Lý do ẩn bài <span className="font-normal text-danger">Bắt buộc</span><textarea rows={3} maxLength={500} value={publicationReason} onChange={(event) => setPublicationReason(event.target.value)} placeholder="Lý do này sẽ được gửi cho tác giả bài tập…" className={`${inputClass} resize-none font-normal`} /></label>}
                    {data.canEdit && (
                      <TextArea
                        label="Nội dung đề bài"
                        value={statement}
                        onChange={setStatement}
                      />
                    )}
                    {data.canAssign && (
                      <>
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="text-xs font-medium">
                            Hạn nộp
                            <input
                              type="datetime-local"
                              className={`mt-1 block ${inputClass}`}
                              value={dueAt}
                              onChange={(e) => setDueAt(e.target.value)}
                            />
                          </label>
                          <label className="text-xs font-medium">
                            Số lần tối đa
                            <input
                              type="number"
                              min={1}
                              max={100}
                              className={`mt-1 block w-28 ${inputClass}`}
                              value={attemptLimit}
                              onChange={(e) => setAttemptLimit(e.target.value)}
                            />
                          </label>
                        </div>
                        <WorkspaceMemberSelector
                          members={members}
                          selectedIds={assigned}
                          onChange={setAssigned}
                        />
                      </>
                    )}
                  </Card>
                )}
                <div
                  className={`grid items-start gap-4 transition-[grid-template-columns] duration-300 ${
                    selectedAssignment
                      ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]"
                      : "lg:grid-cols-[minmax(0,1fr)]"
                  }`}
                >
                  <div className="col-span-full flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-navy">
                        Thành viên được giao
                      </h3>
                      <p className="text-xs text-text-faint">
                        {data.canReview
                          ? "Tìm một thành viên và chọn để xem lịch sử nộp ở bên phải."
                          : "Tìm và kiểm tra danh sách thành viên đang được giao bài."}
                      </p>
                    </div>
                    {selectedAssignment && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={historyLoading || submissions.length === 0}
                          onClick={exportSubmissionHistory}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export CSV
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAssignment(null)}
                        >
                          Ẩn lịch sử nộp
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-full flex flex-wrap items-center gap-2">
                    <input
                      className={`${inputClass} h-9 min-w-56 flex-1 py-1.5 text-xs`}
                      value={assignmentSearch}
                      onChange={(event) => {
                        setAssignmentSearch(event.target.value);
                        setAssignmentPage(1);
                      }}
                      placeholder="Tìm thành viên được giao..."
                    />
                    <span className="text-xs text-text-faint">
                      {assignments.total} thành viên
                    </span>
                  </div>
                  {assignmentsLoading ? (
                    <div className="min-w-0 lg:col-start-1 lg:row-start-3">
                      <Loading />
                    </div>
                  ) : assignments.items.length === 0 ? (
                    <Card className="border-dashed p-6 text-center text-xs text-text-faint lg:col-start-1 lg:row-start-3">
                      Bài công khai này chưa được giao cho bạn. Bạn vẫn có thể
                      mở bài để luyện tập.
                    </Card>
                  ) : (
                    <div className="min-w-0 overflow-x-auto rounded-lg border border-border-soft lg:col-start-1 lg:row-start-3">
                      <table className="w-full min-w-[660px] text-left text-xs">
                        <thead className="bg-bg text-text-faint">
                          <tr>
                            <th className="p-3">Thành viên</th>
                            <th className="p-3">Trạng thái</th>
                            {data.canReview && (
                              <>
                                <th className="p-3">Lượt nộp</th>
                                <th className="p-3">Kết quả gần nhất</th>
                                <th className="p-3">Điểm</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-soft">
                          {assignments.items.map((item) => (
                            <tr
                              key={item.id}
                              aria-selected={selectedAssignment?.id === item.id}
                              className={`${data.canReview ? "cursor-pointer hover:bg-bg" : ""} transition-colors duration-150 ${selectedAssignment?.id === item.id ? "bg-primary/5" : ""}`}
                              onClick={() => {
                                if (data.canReview) void openHistory(item);
                              }}
                            >
                              <td className="p-3 font-semibold text-navy">
                                {item.memberName}
                              </td>
                              <td className="p-3">
                                {assignmentLabel(item.status)}
                              </td>
                              {data.canReview && (
                                <>
                                  <td className="p-3">{item.submissionCount}</td>
                                  <td className="p-3">
                                    {item.latestVerdict
                                      ? verdictLabel(item.latestVerdict)
                                      : "Chưa nộp"}
                                  </td>
                                  <td className="p-3">
                                    {item.latestScore ?? "–"}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="min-w-0 lg:col-start-1 lg:row-start-4">
                    <Pagination
                      page={assignmentPage}
                      pageCount={assignments.totalPages}
                      onChange={setAssignmentPage}
                      label="Phân trang thành viên được giao"
                    />
                  </div>
                  {selectedAssignment && (
                    <aside
                      className="min-w-0 overflow-hidden transition-all duration-300 lg:col-start-2 lg:row-span-2 lg:row-start-3"
                      aria-label={`Lịch sử nộp của ${selectedAssignment.memberName}`}
                    >
                      <Card className="max-h-[560px] min-w-[360px] overflow-y-auto p-4">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-soft bg-surface pb-3">
                          <div>
                            <h3 className="text-sm font-bold text-navy">
                              Lịch sử nộp
                            </h3>
                            <p className="mt-0.5 text-xs text-text-faint">
                              {selectedAssignment.memberName}
                            </p>
                          </div>
                        </div>
                        {historyLoading ? (
                          <div className="py-8">
                            <Loading />
                          </div>
                        ) : submissions.length === 0 ? (
                          <p className="mt-3 text-xs text-text-faint">
                            Chưa có lần nộp.
                          </p>
                        ) : selectedSubmission ? (
                          <div className="mt-3 space-y-3">
                            <Select
                              label="Lần nộp"
                              className="w-full"
                              value={selectedSubmission.id}
                              onChange={setSelectedSubmissionId}
                              options={submissions.map((submission) => ({
                                value: submission.id,
                                label: `Lần #${submission.attemptNumber} · ${verdictLabel(submission.verdict)} · ${submission.score ?? 0}/100${submission.isLate ? " · Trễ" : ""}`,
                              }))}
                            />
                            <div className="rounded border border-border-soft p-3">
                              <p className="text-xs font-semibold text-navy">
                                Lần #{selectedSubmission.attemptNumber} ·{" "}
                                {verdictLabel(selectedSubmission.verdict)} ·{" "}
                                {formatDate(selectedSubmission.submittedAt)}
                              </p>
                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <span>
                                  Test: {selectedSubmission.passedTests ?? 0}/
                                  {selectedSubmission.totalTests ?? 0}
                                </span>
                                <span>
                                  Runtime: {selectedSubmission.runtimeMs ?? "–"}{" "}
                                  ms
                                </span>
                                <span>
                                  Memory: {selectedSubmission.memoryKb ?? "–"}{" "}
                                  KB
                                </span>
                                <span>
                                  Ngôn ngữ: {selectedSubmission.language}
                                </span>
                              </div>
                              <pre className="mt-3 max-h-72 overflow-auto rounded bg-navy p-3 text-xs text-on-ink">
                                <code>{selectedSubmission.sourceCode}</code>
                              </pre>
                              {selectedSubmission.runDetail?.compile
                                ?.stderr && (
                                <pre className="mt-2 overflow-auto rounded bg-danger/10 p-2 text-xs text-danger">
                                  {selectedSubmission.runDetail.compile.stderr}
                                </pre>
                              )}
                              {selectedSubmission.runDetail?.cases?.length ? (
                                <div className="mt-3 overflow-x-auto rounded border border-border-soft">
                                  <table className="w-full min-w-[680px] text-left text-xs">
                                    <thead className="bg-bg text-text-faint">
                                      <tr>
                                        <th className="p-2">Test</th>
                                        <th className="p-2">Input</th>
                                        <th className="p-2">Expected</th>
                                        <th className="p-2">Actual</th>
                                        <th className="p-2">Kết quả</th>
                                        <th className="p-2">Thời gian</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-soft">
                                      {selectedSubmission.runDetail.cases.map(
                                        (testCase) => (
                                          <tr key={testCase.order}>
                                            <td className="p-2 font-semibold">
                                              #{testCase.order}
                                            </td>
                                            <td className="max-w-40 truncate p-2 font-mono">
                                              {testCase.input ?? "–"}
                                            </td>
                                            <td className="max-w-32 truncate p-2 font-mono">
                                              {testCase.expected ?? "–"}
                                            </td>
                                            <td className="max-w-32 truncate p-2 font-mono">
                                              {testCase.actual ?? "–"}
                                            </td>
                                            <td
                                              className={`p-2 font-semibold ${testCase.passed ? "text-success" : "text-danger"}`}
                                            >
                                              {testCase.passed
                                                ? "Đạt"
                                                : verdictLabel(
                                                    testCase.verdict ??
                                                      "wrong_answer",
                                                  )}
                                            </td>
                                            <td className="p-2">
                                              {testCase.runtimeMs ?? "–"} ms
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </Card>
                    </aside>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-soft bg-surface px-5 py-3">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {(data?.canEdit || data?.canAssign) && (
            <Button
              type="button"
              size="sm"
              disabled={busy || (data.canAssign && assigned.length === 0)}
              onClick={() => void save()}
            >
              <Check className="h-3.5 w-3.5" />
              Lưu thay đổi
            </Button>
          )}
        </footer>
      </Card>
    </div>
  );
}

export function WorkspaceAssignmentsTab({
  detail,
}: {
  detail: WorkspaceDetail;
}) {
  const toast = useToast();
  const [data, setData] = useState(EMPTY_PAGE<WorkspaceAssignment>());
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const canReview =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.review_submission;
  const load = useCallback(async () => {
    try {
      setData(
        await api.workspaces.assignments(detail.slug, {
          page,
          limit: 12,
          q: q || undefined,
          status: status || undefined,
        }),
      );
    } catch (e) {
      toast.error(messageOf(e));
    }
  }, [detail.slug, page, q, status, toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);
  const update = async (
    item: WorkspaceAssignment,
    body: { status?: string; reviewStatus?: string },
  ) => {
    try {
      await api.workspaces.updateAssignment(detail.slug, item.id, body);
      await load();
    } catch (e) {
      toast.error(messageOf(e));
    }
  };
  const exportAssignments = async () => {
    try {
      const response = await api.workspaces.assignments(detail.slug, {
        page: 1,
        limit: 100,
        q: q || undefined,
        status: status || undefined,
      });
      downloadCsv(
        `workspace-assignments-${todayForFile()}.csv`,
        [
          "Bài tập",
          "Thành viên",
          "Tiến độ",
          "Lượt nộp",
          "Kết quả gần nhất",
          "Điểm",
          "Nộp trễ",
          "Cập nhật",
        ],
        response.items.map((item) => [
          item.exerciseTitle,
          item.memberName,
          assignmentLabel(item.status),
          item.submissionCount,
          item.latestVerdict ? verdictLabel(item.latestVerdict) : "Chưa nộp",
          item.latestScore ?? "",
          item.latestIsLate ? "Có" : "Không",
          formatDate(item.updatedAt),
        ]),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể xuất danh sách phân công."));
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} min-w-56 flex-1`}
          placeholder="Tìm bài hoặc thành viên..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Trạng thái"
          className="w-full sm:w-44"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Tất cả" },
            { value: "notstarted", label: "Chưa bắt đầu" },
            { value: "inprogress", label: "Đang làm" },
            { value: "done", label: "Đã xong" },
            { value: "late", label: "Trễ hạn" },
          ]}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void exportAssignments()}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      {data.items.length === 0 ? (
        <Empty icon={FileText} title="Chưa có bài được giao" />
      ) : (
        <div className="grid gap-3">
          {data.items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-wrap items-center gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">{item.exerciseTitle}</p>
                <p className="text-xs text-text-faint">
                  {item.memberName} · {assignmentLabel(item.status)} ·{" "}
                  {item.submissionCount} lượt nộp
                  {item.latestAttemptNumber
                    ? ` · lần gần nhất #${item.latestAttemptNumber}`
                    : ""}
                </p>
                {item.latestVerdict && (
                  <p className="mt-1 text-xs text-text-muted">
                    {verdictLabel(item.latestVerdict)}
                    {item.latestScore !== null
                      ? ` · ${item.latestScore}/100 điểm`
                      : ""}
                    {item.latestIsLate ? " · nộp trễ" : ""}
                    {item.latestSubmittedAt
                      ? ` · ${formatDate(item.latestSubmittedAt)}`
                      : ""}
                  </p>
                )}
              </div>
              <Link
                className="text-xs font-semibold text-primary"
                href={workspaceSolveHref(
                  detail.slug,
                  item.exerciseId,
                  item.groupExerciseId,
                  canReview ? undefined : item.id,
                )}
              >
                {canReview ? "Xem đề" : "Làm bài"}
              </Link>
              {canReview ? (
                <Select
                  label="Duyệt"
                  value={item.reviewStatus}
                  onChange={(v) => void update(item, { reviewStatus: v })}
                  options={[
                    { value: "pending", label: "Chờ duyệt" },
                    { value: "approved", label: "Đạt" },
                    { value: "needsfix", label: "Cần sửa" },
                  ]}
                />
              ) : item.status === "done" || item.status === "late" ? (
                <span className="text-xs font-semibold text-success">
                  Cập nhật từ bài nộp
                </span>
              ) : (
                <Select
                  label="Tiến độ"
                  value={item.status}
                  onChange={(v) => void update(item, { status: v })}
                  options={[
                    { value: "notstarted", label: "Chưa bắt đầu" },
                    { value: "inprogress", label: "Đang làm" },
                  ]}
                />
              )}
            </Card>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageCount={data.totalPages}
        onChange={setPage}
        label="Phân trang bài nộp"
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center p-10">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
function workspaceSolveHref(
  slug: string,
  exerciseId: string,
  groupExerciseId: string,
  assignmentId?: string,
) {
  const params = new URLSearchParams({
    workspaceSlug: slug,
    groupExerciseId,
    returnTo: `/workspace/${slug}?tab=exercises`,
  });
  if (assignmentId) params.set("assignmentId", assignmentId);
  return `/solve/${exerciseId}?${params.toString()}`;
}

function Empty({
  icon: Icon,
  title,
}: {
  icon: typeof FileText;
  title: string;
}) {
  return (
    <Card className="border-dashed p-8 text-center">
      <Icon className="mx-auto h-6 w-6 text-text-faint" />
      <p className="mt-2 text-sm font-semibold text-navy">{title}</p>
    </Card>
  );
}



function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function todayForFile() {
  return new Date().toISOString().slice(0, 10);
}
function extension(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}
function previewKind(
  type: string,
): "image" | "video" | "frame" | "office" | "unsupported" {
  const value = type.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(value)) return "image";
  if (["mp4", "webm", "mov"].includes(value)) return "video";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(value))
    return "office";
  if (
    [
      "pdf",
      "txt",
      "md",
      "csv",
      "json",
      "js",
      "ts",
      "tsx",
      "css",
      "html",
    ].includes(value)
  )
    return "frame";
  return "unsupported";
}
function formatBytes(value: string | number | null) {
  const bytes = Number(value ?? 0);
  if (!bytes) return "Không rõ dung lượng";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
function isOverdue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}
function statusLabel(value: string) {
  return (
    (
      {
        published: "Đã duyệt",
        pending: "Chờ duyệt",
        hidden: "Đã ẩn",
        rejected: "Từ chối",
        changes: "Cần sửa",
      } as Record<string, string>
    )[value] ?? value
  );
}
function documentStatusOptions(current: WorkspaceDocument["status"]) {
  const labels: Record<string, string> = { published: "Duyệt và hiển thị", pending: "Đưa về chờ duyệt", hidden: "Ẩn tài liệu", rejected: "Từ chối tài liệu", changes: "Yêu cầu chỉnh sửa" };
  const transitions: Record<string, string[]> = {
    pending: ["published", "changes", "rejected"],
    published: ["hidden"],
    hidden: ["published"],
    rejected: ["pending", "published"],
    changes: ["pending", "published", "rejected"],
  };
  return [{ value: "", label: "Chọn thao tác" }, ...(transitions[current] ?? []).map((value) => ({ value, label: current === "hidden" && value === "published" ? "Hiển thị lại tài liệu" : labels[value] ?? value }))];
}
function canPurge(deletedAt: string | null) {
  return Boolean(deletedAt && Date.now() - new Date(deletedAt).getTime() >= 30 * 24 * 60 * 60 * 1000);
}
function retentionLabel(deletedAt: string | null) {
  if (!deletedAt) return "";
  const remaining = Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000)));
  return remaining ? `Còn ${remaining} ngày để khôi phục` : "Đã đủ 30 ngày, có thể xóa vĩnh viễn";
}
function difficultyLabel(value: string) {
  return (
    (
      { easy: "Cơ bản", medium: "Trung bình", hard: "Nâng cao" } as Record<
        string,
        string
      >
    )[value] ?? value
  );
}
function assignmentLabel(value: string) {
  return (
    (
      {
        notstarted: "Chưa bắt đầu",
        inprogress: "Đang làm",
        done: "Đã xong",
        late: "Trễ hạn",
      } as Record<string, string>
    )[value] ?? value
  );
}
function verdictLabel(value: string) {
  return (
    (
      {
        accepted: "Đạt",
        wrong_answer: "Sai kết quả",
        compile_error: "Lỗi biên dịch",
        runtime_error: "Lỗi thực thi",
        timeout: "Quá thời gian",
        memory_exceeded: "Quá bộ nhớ",
        pending: "Đang chấm",
      } as Record<string, string>
    )[value] ?? value
  );
}

function putFile(
  url: string,
  headers: Record<string, string>,
  file: File,
  progress: (value: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    Object.entries(headers).forEach(([key, value]) =>
      request.setRequestHeader(key, value),
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Storage trả ${request.status}`));
    request.onerror = () => reject(new Error("Không kết nối được storage"));
    request.send(file);
  });
}
