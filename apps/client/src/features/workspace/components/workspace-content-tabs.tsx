"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { ApiClientError } from "@codementor/api-client";
import { Select, useToast } from "@codementor/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/download-csv";
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
  const [previewing, setPreviewing] = useState<WorkspaceDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [reporting, setReporting] = useState<WorkspaceDocument | null>(null);
  const canUpload =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.upload_doc;
  const canManage =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.manage_doc ||
    detail.currentMembership.permissions.delete_doc;
  const canApprove =
    canManage || detail.currentMembership.permissions.approve_doc;
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
    try {
      await api.workspaces.deleteDocument(detail.slug, removing.id);
      toast.success("Đã chuyển tài liệu vào mục đã xóa");
      setRemoving(null);
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
  const changeStatus = async (doc: WorkspaceDocument, next: string) => {
    try {
      await api.workspaces.updateDocument(detail.slug, doc.id, {
        status: next,
      });
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
        {canApprove && (
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
              { value: "pending", label: "Chờ duyệt" },
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
      {!canManage && canUpload && (
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
              {canApprove && doc.status !== "removed" && (
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
              {doc.canDelete && doc.status !== "removed" && (
                <>
                  <Select
                    label="Duyệt"
                    value={doc.status}
                    onChange={(v) => void changeStatus(doc, v)}
                    options={[
                      { value: "published", label: "Đã duyệt" },
                      { value: "pending", label: "Chờ duyệt" },
                      { value: "hidden", label: "Ẩn" },
                      { value: "rejected", label: "Từ chối" },
                    ]}
                  />
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
                </>
              )}
              {!canManage && doc.status === "published" && (
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
              {canManage && doc.status === "removed" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
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
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Chuyển tài liệu vào mục đã xóa?"
        confirmLabel="Xóa"
        message={`Tài liệu “${removing?.title ?? ""}” sẽ được ẩn khỏi danh sách. Tệp trên storage chỉ bị xóa khi xóa vĩnh viễn.`}
      />
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
        <div className="flex flex-wrap items-start gap-3 border-b border-border-soft p-4">
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
      <Card className="w-full max-w-lg space-y-4 p-5">
        <div>
          <h2 className="text-base font-bold text-navy">Báo cáo tài liệu</h2>
          <p className="mt-1 text-xs text-text-muted">{document.title}</p>
        </div>
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
          Vui lòng chỉ báo cáo nội dung thực sự vi phạm. Báo cáo trùng lặp sẽ bị
          từ chối.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Gửi báo cáo
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function WorkspaceExercisesTab({
  detail,
  members,
}: {
  detail: WorkspaceDetail;
  members: WorkspaceMember[];
}) {
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [authoringOpen, setAuthoringOpen] = useState(false);
  const assignable = members.filter((m) => m.role !== "owner");
  const [memberIds, setMemberIds] = useState<string[]>(
    assignable.map((m) => m.id),
  );
  const canCreate =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.create_exercise;
  const canEdit =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.manage_exercise ||
    detail.currentMembership.permissions.edit_exercise;
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
      if (!canEdit) {
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
  }, [detail.slug, page, q, difficulty, scope, exerciseStatus, canEdit, toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (canCreate)
      void api.exercises
        .bank({ limit: 50 })
        .then((r) => setBank(r.items))
        .catch(() => setBank([]));
  }, [canCreate]);
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
    try {
      await api.workspaces.deleteWorkspaceExercise(detail.slug, removing.id);
      setRemoving(null);
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
      {canCreate && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-navy">
                Thêm và phân công bài tập
              </h2>
              <p className="mt-1 text-xs text-text-faint">
                {memberIds.length} thành viên đang được chọn
              </p>
            </div>
            <Button size="sm" onClick={() => setAuthoringOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" />
              Tạo bài mới
            </Button>
          </div>
          <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_220px_auto_auto]">
            <div className="min-w-0">
              <Select
                label="1. Chọn bài tập"
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
              <span>2. Hạn nộp</span>
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
              aria-expanded={assignmentOpen}
              aria-controls="workspace-assignment-options"
              onClick={() => setAssignmentOpen((value) => !value)}
            >
              <Users className="h-3.5 w-3.5" />
              {assignmentOpen
                ? `3. Đã chọn ${memberIds.length}`
                : "3. Chọn người được giao"}
            </Button>
            <Button
              size="sm"
              disabled={!selected || !memberIds.length || busy}
              onClick={() => void attach()}
            >
              <Plus className="h-3.5 w-3.5" />
              4. Xác nhận giao
            </Button>
          </div>
          {assignmentOpen && (
            <WorkspaceMemberSelector
              id="workspace-assignment-options"
              members={assignable}
              selectedIds={memberIds}
              onChange={setMemberIds}
            />
          )}
        </Card>
      )}
      {!canEdit && reminders.length > 0 && (
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
        className={`grid gap-2 md:grid-cols-2 ${canEdit ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
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
        {!canEdit && (
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
        {canEdit && (
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
              { value: "removed", label: "Đã xóa" },
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
                    {canEdit
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
                href={`/solve/${ex.exerciseId}`}
                size="sm"
                variant="outline"
                onClick={(event) => event.stopPropagation()}
              >
                Mở bài
              </Button>
              {(ex.canEdit || ex.canDelete || canCreate) && (
                <>
                  {ex.deletedAt ? (
                    <Button
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
                    </Button>
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
        />
      )}
      {authoringOpen && (
        <ExerciseAuthoringDialog
          slug={detail.slug}
          members={assignable}
          initialMemberIds={memberIds}
          onClose={() => setAuthoringOpen(false)}
          onCreated={load}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Chuyển bài tập vào mục đã xóa?"
        confirmLabel="Gỡ"
        message={`Bài “${removing?.title ?? ""}” sẽ được ẩn khỏi thành viên và vẫn có thể khôi phục.`}
      />
    </div>
  );
}

function ExerciseAuthoringDialog({
  slug,
  members,
  initialMemberIds,
  onClose,
  onCreated,
}: {
  slug: string;
  members: WorkspaceMember[];
  initialMemberIds: string[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<"manual" | "import" | "ai">("manual");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [statement, setStatement] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples] = useState("");
  const [testCases, setTestCases] = useState("");
  const [tags, setTags] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [rawImport, setRawImport] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedByAi, setGeneratedByAi] = useState(false);
  const [memberIds, setMemberIds] = useState(initialMemberIds);
  const [busy, setBusy] = useState(false);

  const importText = () => {
    setGeneratedByAi(false);
    const parsed = parseProblemText(rawImport);
    setTitle(parsed.title);
    setSummary(parsed.summary);
    setStatement(parsed.statement);
    setInputFormat(parsed.inputFormat);
    setOutputFormat(parsed.outputFormat);
    setConstraints(parsed.constraints);
    setExamples(parsed.examples);
    toast.success("Đã chuyển nội dung sang form; hãy rà soát trước khi lưu");
  };
  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const draft = await api.workspaces.generateWorkspaceExerciseDraft(slug, {
        prompt: aiPrompt.trim(),
        difficulty,
      });
      setTitle(draft.title);
      setSummary(draft.summary);
      setDifficulty(draft.difficulty);
      setStatement(String(draft.content.statement ?? ""));
      setGeneratedByAi(true);
      setConstraints(
        Array.isArray(draft.content.constraints)
          ? draft.content.constraints.join("\n")
          : "",
      );
      toast.success(
        `Đã tạo bản nháp từ ${draft.sourceDocuments.length} tài liệu đã duyệt`,
      );
      setMode("manual");
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!title.trim() || !statement.trim()) {
      toast.error("Vui lòng nhập tiêu đề và đề bài");
      return;
    }
    setBusy(true);
    try {
      const statementWithFormats = [
        statement.trim(),
        inputFormat.trim() ? `## Đầu vào\n${inputFormat.trim()}` : "",
        outputFormat.trim() ? `## Đầu ra\n${outputFormat.trim()}` : "",
        tags.trim() ? `## Tags\n${tags.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      await api.workspaces.createWorkspaceExercise(slug, {
        title: title.trim(),
        summary: summary.trim() || undefined,
        difficulty,
        source: generatedByAi ? "ai" : "manual",
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        memberIds,
        content: {
          statement: statementWithFormats,
          ioMode: "stdin_stdout",
          constraints: splitLines(constraints),
          examples: parseInputOutputPairs(examples).map((item) => ({
            input: item.input,
            output: item.output,
          })),
          testCases: parseInputOutputPairs(testCases).map((item, index) => ({
            order: index + 1,
            input: item.input,
            expected: item.output,
            visibility: index === 0 ? "public" : "hidden",
          })),
          languages: [],
          evaluation: { checker: "trimmed", stopOnFirstFailure: false },
        },
      });
      toast.success("Đã tạo và phân công bài tập");
      await onCreated();
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
      aria-label="Tạo bài tập Workspace"
    >
      <Card className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border-soft p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-navy">
              Tạo bài tập Workspace
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Nội dung luôn được lưu thành bản có thể chỉnh sửa trước khi giao.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-bg"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["manual", "Nhập thủ công"],
                ["import", "Import đề bài"],
                ["ai", "Tạo từ tài liệu"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${mode === value ? "border-primary bg-primary/5 text-primary" : "border-border text-text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "import" && (
            <Card className="space-y-3 p-4">
              <p className="text-xs text-text-muted">
                Hỗ trợ các mục phổ biến: Description, Input, Output,
                Constraints, Example.
              </p>
              <textarea
                className={`${inputClass} min-h-48 w-full resize-y font-mono`}
                value={rawImport}
                onChange={(event) => setRawImport(event.target.value)}
                placeholder="Dán đề bài theo format LeetCode..."
              />
              <Button
                size="sm"
                onClick={importText}
                disabled={!rawImport.trim()}
              >
                Chuyển sang form
              </Button>
            </Card>
          )}
          {mode === "ai" && (
            <Card className="space-y-3 p-4">
              <p className="text-xs text-text-muted">
                Hệ thống chỉ đọc tài liệu đã duyệt của Workspace và trả về bản
                nháp để bạn rà soát.
              </p>
              <textarea
                className={`${inputClass} min-h-28 w-full resize-y`}
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ví dụ: Tạo bài tập BFS tìm đường đi ngắn nhất..."
              />
              <Button
                size="sm"
                onClick={() => void generate()}
                disabled={busy || !aiPrompt.trim()}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Tạo bản nháp
              </Button>
            </Card>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tiêu đề" value={title} onChange={setTitle} />
            <Select
              label="Độ khó"
              value={difficulty}
              onChange={(value) => setDifficulty(value as typeof difficulty)}
              options={[
                { value: "easy", label: "Cơ bản" },
                { value: "medium", label: "Trung bình" },
                { value: "hard", label: "Nâng cao" },
              ]}
            />
            <Field label="Tóm tắt" value={summary} onChange={setSummary} />
            <label className="text-xs font-medium text-text-muted">
              Hạn nộp
              <input
                type="datetime-local"
                className={`${inputClass} mt-1 block w-full`}
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>
          </div>
          <TextArea label="Đề bài" value={statement} onChange={setStatement} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextArea
              label="Định dạng đầu vào"
              value={inputFormat}
              onChange={setInputFormat}
            />
            <TextArea
              label="Định dạng đầu ra"
              value={outputFormat}
              onChange={setOutputFormat}
            />
            <TextArea
              label="Ràng buộc (mỗi dòng một mục)"
              value={constraints}
              onChange={setConstraints}
            />
            <TextArea label="Tags" value={tags} onChange={setTags} />
            <TextArea
              label="Ví dụ (input => output)"
              value={examples}
              onChange={setExamples}
            />
            <TextArea
              label="Test case (input => output)"
              value={testCases}
              onChange={setTestCases}
            />
          </div>
          <fieldset className="rounded-lg border border-border-soft p-3">
            <legend className="px-1 text-xs font-semibold text-navy">
              Phân công ({memberIds.length}/{members.length})
            </legend>
            <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-4">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 rounded border border-border-soft px-2 py-1.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={memberIds.includes(member.id)}
                    onChange={() =>
                      setMemberIds((current) =>
                        current.includes(member.id)
                          ? current.filter((id) => id !== member.id)
                          : [...current, member.id],
                      )
                    }
                  />
                  <span className="truncate">{member.user.displayName}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end gap-2 border-t border-border-soft p-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu bài tập
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({
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
      <input
        className={`${inputClass} mt-1 block w-full`}
        value={value}
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
}: {
  slug: string;
  id: string;
  members: WorkspaceMember[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const toast = useToast();
  const [data, setData] = useState<WorkspaceExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<WorkspaceAssignment | null>(null);
  const [submissions, setSubmissions] = useState<WorkspaceSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
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
      setStatement(String(next.content?.statement ?? ""));
      setAssigned(next.assignments.map((item) => item.memberId));
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
    setBusy(true);
    try {
      await api.workspaces.updateWorkspaceExercise(slug, id, {
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        attemptLimit: attemptLimit ? Number(attemptLimit) : null,
        memberIds: assigned,
        title: title.trim(),
        summary: summary.trim() || null,
        difficulty,
        publicationStatus,
        content: data.content
          ? { ...data.content, statement: statement.trim() }
          : { statement: statement.trim(), ioMode: "stdin_stdout" },
      });
      toast.success("Đã cập nhật bài tập và phân công");
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
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-soft bg-surface px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {data?.title ?? "Chi tiết bài tập"}
            </h2>
            <p className="text-xs text-text-faint">
              Phân công, tiến độ và lịch sử từng lần nộp nằm chung tại đây.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5">
          {loading ? (
            <Loading />
          ) : (
            data && (
              <div className="space-y-5">
                {data.canManage && (
                  <Card className="space-y-3 bg-bg p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                      <Select
                        label="Độ khó"
                        className="w-full"
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
                      <Select
                        label="Hiển thị"
                        className="w-full"
                        value={publicationStatus}
                        onChange={(value) =>
                          setPublicationStatus(
                            value as typeof publicationStatus,
                          )
                        }
                        options={[
                          { value: "published", label: "Đang hiển thị" },
                          { value: "hidden", label: "Đã ẩn" },
                        ]}
                      />
                    </div>
                    <TextArea
                      label="Nội dung đề bài"
                      value={statement}
                      onChange={setStatement}
                    />
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
                        Chọn một thành viên để xem lịch sử nộp ở bên phải.
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
                  {data.assignments.length === 0 ? (
                    <Card className="border-dashed p-6 text-center text-xs text-text-faint">
                      Bài công khai này chưa được giao cho bạn. Bạn vẫn có thể
                      mở bài để luyện tập.
                    </Card>
                  ) : (
                    <div className="min-w-0 overflow-x-auto rounded-lg border border-border-soft">
                      <table className="w-full min-w-[660px] text-left text-xs">
                        <thead className="bg-bg text-text-faint">
                          <tr>
                            <th className="p-3">Thành viên</th>
                            <th className="p-3">Trạng thái</th>
                            <th className="p-3">Lượt nộp</th>
                            <th className="p-3">Kết quả gần nhất</th>
                            <th className="p-3">Điểm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-soft">
                          {data.assignments.map((item) => (
                            <tr
                              key={item.id}
                              aria-selected={selectedAssignment?.id === item.id}
                              className={`cursor-pointer transition-colors duration-150 hover:bg-bg ${selectedAssignment?.id === item.id ? "bg-primary/5" : ""}`}
                              onClick={() => void openHistory(item)}
                            >
                              <td className="p-3 font-semibold text-navy">
                                {item.memberName}
                              </td>
                              <td className="p-3">
                                {assignmentLabel(item.status)}
                              </td>
                              <td className="p-3">{item.submissionCount}</td>
                              <td className="p-3">
                                {item.latestVerdict
                                  ? verdictLabel(item.latestVerdict)
                                  : "Chưa nộp"}
                              </td>
                              <td className="p-3">{item.latestScore ?? "–"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {selectedAssignment && (
                    <aside
                      className="min-w-0 overflow-hidden"
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
          {data?.canManage && (
            <Button
              type="button"
              size="sm"
              disabled={busy || assigned.length === 0}
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
                href={
                  canReview
                    ? `/solve/${item.exerciseId}`
                    : `/solve/${item.exerciseId}?assignmentId=${item.id}`
                }
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
function messageOf(error: unknown, fallback = "Có lỗi xảy ra") {
  return error instanceof ApiClientError
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseInputOutputPairs(value: string) {
  return splitLines(value).flatMap((line) => {
    const separator = line.includes("=>")
      ? "=>"
      : line.includes("→")
        ? "→"
        : null;
    if (!separator) return [];
    const [input, ...output] = line.split(separator);
    return input.trim() && output.join(separator).trim()
      ? [{ input: input.trim(), output: output.join(separator).trim() }]
      : [];
  });
}

function parseProblemText(raw: string) {
  const text = raw.replace(/\r/g, "").trim();
  const title =
    text
      .split("\n")
      .find((line) => line.trim())
      ?.replace(/^#+\s*/, "") ?? "";
  const section = (names: string[]) => {
    const escaped = names
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const headings =
      "Description|Problem|Input(?: Format)?|Output(?: Format)?|Constraints?|Examples?";
    const match = text.match(
      new RegExp(
        `(?:^|\\n)(?:#+\\s*)?(?:${escaped})\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n(?:#+\\s*)?(?:${headings})\\s*:?|$)`,
        "i",
      ),
    );
    return match?.[1]?.trim() ?? "";
  };
  const statement = section(["Description", "Problem", "Mô tả", "Đề bài"]);
  return {
    title,
    summary: statement.split("\n")[0]?.slice(0, 500) ?? "",
    statement: statement || text,
    inputFormat: section(["Input", "Input Format", "Đầu vào"]),
    outputFormat: section(["Output", "Output Format", "Đầu ra"]),
    constraints: section(["Constraint", "Constraints", "Ràng buộc"]),
    examples: section(["Example", "Examples", "Ví dụ"]),
  };
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
function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
