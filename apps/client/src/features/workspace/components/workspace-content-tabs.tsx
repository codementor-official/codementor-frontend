"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
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
  const canUpload =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.upload_doc;
  const canManage =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.delete_doc;
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
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [detail.slug, page, q, status, toast]);
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
      toast.success("Đã xóa tài liệu");
      setRemoving(null);
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
        {canManage && (
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
              {canManage && (
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
              {canManage && (
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
        title="Xóa tài liệu?"
        confirmLabel="Xóa"
        message={`Tệp “${removing?.title ?? ""}” sẽ bị xóa khỏi database và storage.`}
      />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/55 p-3"
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
  const [memberSearch, setMemberSearch] = useState("");
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [reminders, setReminders] = useState<WorkspaceExercise[]>([]);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceExercise | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const assignable = members.filter((m) => m.role !== "owner");
  const [memberIds, setMemberIds] = useState<string[]>(
    assignable.map((m) => m.id),
  );
  const canCreate =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.create_exercise;
  const canEdit =
    detail.currentMembership.role === "owner" ||
    detail.currentMembership.permissions.edit_exercise;
  const visibleAssignable = assignable.filter((member) =>
    `${member.user.displayName} ${member.user.email ?? ""}`
      .toLocaleLowerCase("vi")
      .includes(memberSearch.trim().toLocaleLowerCase("vi")),
  );
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
  const toggleMember = (id: string) =>
    setMemberIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignmentOpen((value) => !value)}
            >
              {assignmentOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {assignmentOpen ? "Thu gọn" : "Mở bảng phân công"}
            </Button>
          </div>
          {assignmentOpen && (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <Select
                  label="Bài tập từ kho công khai"
                  value={selected}
                  onChange={setSelected}
                  options={[
                    { value: "", label: "Chọn bài tập" },
                    ...bank.map((x) => ({ value: x.id, label: x.title })),
                  ]}
                />
                <label className="text-xs font-medium text-text-muted">
                  Hạn nộp
                  <input
                    type="datetime-local"
                    className={`mt-1 block ${inputClass}`}
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                  />
                </label>
                <Button
                  size="sm"
                  disabled={!selected || !memberIds.length || busy}
                  onClick={() => void attach()}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm và giao ({memberIds.length})
                </Button>
              </div>
              <fieldset className="rounded-lg border border-border-soft p-3">
                <legend className="px-1 text-xs font-semibold text-navy">
                  Phân công cho thành viên
                </legend>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-xs"
                    onClick={() => setMemberIds(assignable.map((m) => m.id))}
                  >
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    Toàn bộ Workspace
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-xs"
                    onClick={() => setMemberIds([])}
                  >
                    Xóa lựa chọn
                  </button>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    Đã chọn {memberIds.length}/{assignable.length}
                  </span>
                  <label className="relative ml-auto min-w-52 flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-text-faint" />
                    <input
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Tìm thành viên..."
                      className={`${inputClass} w-full pl-8`}
                    />
                  </label>
                </div>
                <div className="mt-3 grid max-h-64 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
                  {visibleAssignable.map((member) => (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-xs ${memberIds.includes(member.id) ? "border-primary bg-primary/5" : "border-border-soft"}`}
                    >
                      <input
                        type="checkbox"
                        checked={memberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-navy">
                          {member.user.displayName}
                        </span>
                        <span className="block truncate text-2xs text-text-faint">
                          {member.role === "deputy" ? "Phó nhóm" : "Thành viên"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
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
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-faint">
        <span>{data.total} bài tập phù hợp</span>
        <span>
          Trang {data.page} / {Math.max(data.totalPages, 1)}
        </span>
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
              {canEdit && (
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
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Gỡ bài tập khỏi nhóm?"
        confirmLabel="Gỡ"
        message={`Các assignment chưa có bài nộp của “${removing?.title ?? ""}” sẽ bị xóa.`}
      />
    </div>
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [attemptLimit, setAttemptLimit] = useState("");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const visibleMembers = members.filter((member) =>
    `${member.user.displayName} ${member.user.email ?? ""}`
      .toLocaleLowerCase("vi")
      .includes(assignmentSearch.trim().toLocaleLowerCase("vi")),
  );
  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.workspaces.workspaceExerciseDetail(slug, id);
      setData(next);
      setDueAt(next.dueAt ? toLocalInput(next.dueAt) : "");
      setAttemptLimit(next.attemptLimit?.toString() ?? "");
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
    try {
      setSubmissions(
        (await api.workspaces.submissionHistory(slug, assignment.id)).items,
      );
    } catch (e) {
      toast.error(messageOf(e));
      setSubmissions([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  const save = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await api.workspaces.updateWorkspaceExercise(slug, id, {
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        attemptLimit: attemptLimit ? Number(attemptLimit) : null,
        memberIds: assigned,
      });
      toast.success("Đã cập nhật phân công bài tập");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 p-3"
      role="dialog"
      aria-modal="true"
    >
      <Card className="max-h-[92vh] w-full max-w-7xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
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
        </div>
        {loading ? (
          <Loading />
        ) : (
          data && (
            <div className="mt-5 space-y-5">
              {data.canManage && (
                <Card className="space-y-3 bg-bg p-4">
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
                    <Button
                      size="sm"
                      disabled={busy || assigned.length === 0}
                      onClick={() => void save()}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Lưu phân công
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() =>
                        setAssigned(members.map((member) => member.id))
                      }
                    >
                      Chọn toàn bộ
                    </button>
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() => setAssigned([])}
                    >
                      Xóa lựa chọn
                    </button>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      Đã chọn {assigned.length}/{members.length}
                    </span>
                    <label className="relative ml-auto min-w-48">
                      <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-text-faint" />
                      <input
                        className={`${inputClass} w-full pl-8`}
                        placeholder="Tìm thành viên..."
                        value={assignmentSearch}
                        onChange={(event) =>
                          setAssignmentSearch(event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="grid max-h-48 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleMembers.map((member) => (
                      <label
                        key={member.id}
                        className={`flex cursor-pointer items-center gap-1.5 rounded border px-2 py-2 text-xs ${assigned.includes(member.id) ? "border-primary bg-primary/5" : "border-border-soft bg-surface"}`}
                      >
                        <input
                          type="checkbox"
                          checked={assigned.includes(member.id)}
                          onChange={() =>
                            setAssigned((current) =>
                              current.includes(member.id)
                                ? current.filter((item) => item !== member.id)
                                : [...current, member.id],
                            )
                          }
                        />
                        {member.user.displayName}
                      </label>
                    ))}
                  </div>
                </Card>
              )}
              <div
                className={`grid items-start gap-4 transition-[grid-template-columns] duration-300 ${
                  selectedAssignment
                    ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]"
                    : "lg:grid-cols-[minmax(0,1fr)]"
                }`}
              >
                {data.assignments.length === 0 ? (
                  <Card className="border-dashed p-6 text-center text-xs text-text-faint">
                    Bài công khai này chưa được giao cho bạn. Bạn vẫn có thể mở
                    bài để luyện tập.
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
                        <button
                          type="button"
                          onClick={() => setSelectedAssignment(null)}
                          aria-label="Đóng lịch sử nộp"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {historyLoading ? (
                        <div className="py-8">
                          <Loading />
                        </div>
                      ) : submissions.length === 0 ? (
                        <p className="mt-3 text-xs text-text-faint">
                          Chưa có lần nộp.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {submissions.map((submission) => (
                            <details
                              key={submission.id}
                              className="rounded border border-border-soft p-3"
                            >
                              <summary className="cursor-pointer text-xs font-semibold text-navy">
                                Lần #{submission.attemptNumber} ·{" "}
                                {verdictLabel(submission.verdict)} ·{" "}
                                {submission.score ?? 0}/100 ·{" "}
                                {formatDate(submission.submittedAt)}
                                {submission.isLate ? " · Trễ" : ""}
                              </summary>
                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <span>
                                  Test: {submission.passedTests ?? 0}/
                                  {submission.totalTests ?? 0}
                                </span>
                                <span>
                                  Runtime: {submission.runtimeMs ?? "–"} ms
                                </span>
                                <span>
                                  Memory: {submission.memoryKb ?? "–"} KB
                                </span>
                                <span>Ngôn ngữ: {submission.language}</span>
                              </div>
                              <pre className="mt-3 max-h-72 overflow-auto rounded bg-navy p-3 text-xs text-on-ink">
                                <code>{submission.sourceCode}</code>
                              </pre>
                              {submission.runDetail?.compile?.stderr && (
                                <pre className="mt-2 overflow-auto rounded bg-danger/10 p-2 text-xs text-danger">
                                  {submission.runDetail.compile.stderr}
                                </pre>
                              )}
                              {submission.runDetail?.cases?.length ? (
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
                                      {submission.runDetail.cases.map(
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
                            </details>
                          ))}
                        </div>
                      )}
                    </Card>
                  </aside>
                )}
              </div>
            </div>
          )
        )}
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
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder="Tìm bài hoặc thành viên..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Trạng thái"
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
function messageOf(error: unknown) {
  return error instanceof ApiClientError
    ? error.message
    : error instanceof Error
      ? error.message
      : "Có lỗi xảy ra";
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
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
