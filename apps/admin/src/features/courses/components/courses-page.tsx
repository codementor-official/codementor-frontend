"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, CheckCheck, PencilLine, RotateCcw, Save, Trash2, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, LEVELS, LEVEL_LABELS } from "@codementor/types";
import { Button, ConfirmButton, ManagePage, Select, StatusBadge, useToast, type ViewMode } from "@codementor/ui";
import { ContentPreview } from "@/features/moderation/content-preview";
import { useAdminApi } from "@/features/auth/admin-api";
import { coursesApi, moderationApi, usersApi, type AdminCourseListItem } from "@/lib/api";
import { Field } from "@/features/shared/detail-field";
import { LecturerFilter, useLecturerOptions } from "@/features/shared/lecturer-filter";

const STATUS_OPTIONS = ["pending_review", "changes_requested", "rejected", "published", "archived"] as const;

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

interface CourseDraft {
  id: string;
  title: string;
  description: string;
  level: string;
}

export function CoursesPage() {
  const request = useAdminApi();
  const toast = useToast();
  const lecturers = useLecturerOptions();

  const [rows, setRows] = useState<AdminCourseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [draft, setDraft] = useState<CourseDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await coursesApi.list(request, {
        q: search.trim() || undefined,
        status: status || undefined,
        level: level || undefined,
        authorId: authorId || undefined,
        updatedFrom: updatedFrom || undefined,
        updatedTo: updatedTo || undefined,
        limit: 50,
      });
      setRows(page.items);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, [request, search, status, level, authorId, updatedFrom, updatedTo]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (cause) {
      toast.error(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const loadDraft = useCallback(
    async (id: string) => {
      const detail = await moderationApi.detail<{ title: string; description: string | null; level: string }>(
        request,
        "courses",
        id,
      );
      setDraft({ id, title: detail.title, description: detail.description ?? "", level: detail.level });
    },
    [request],
  );

  const saveDraft = async (id: string) => {
    if (draft?.id !== id) return;
    await coursesApi.update(request, id, {
      title: draft.title.trim() || undefined,
      description: draft.description.trim() || null,
      level: draft.level,
    });
    toast.success("Đã lưu");
  };

  const decide = async (
    id: string,
    decision: "approve" | "request_changes" | "reject" | "archive" | "restore",
  ) => {
    if ((decision === "reject" || decision === "request_changes") && !reason.trim()) {
      toast.error("Phải nêu lý do khi từ chối hoặc yêu cầu sửa.");
      return;
    }
    await act(async () => {
      await moderationApi.decide(request, "courses", id, decision, reason.trim() || undefined);
      setReason("");
    });
  };

  const columns = useMemo<ColumnDef<AdminCourseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Khoá học",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={CONTENT_STATUS_TONES[row.original.status as keyof typeof CONTENT_STATUS_TONES] ?? "neutral"}>
            {CONTENT_STATUS_LABELS[row.original.status as keyof typeof CONTENT_STATUS_LABELS] ?? row.original.status}
          </StatusBadge>
        ),
      },
      { accessorKey: "level", header: "Trình độ", cell: ({ row }) => LEVEL_LABELS[row.original.level as keyof typeof LEVEL_LABELS] ?? row.original.level },
      { accessorKey: "authorName", header: "Giảng viên", cell: ({ row }) => row.original.authorName ?? "—" },
      {
        id: "content",
        header: "Nội dung",
        cell: ({ row }) => `${row.original.totalChapters} chương · ${row.original.totalLessons} bài`,
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{dateFormat.format(new Date(row.original.updatedAt))}</span>
        ),
      },
    ],
    [],
  );

  const activeFilterCount = [status, level, authorId, updatedFrom, updatedTo].filter(Boolean).length;

  return (
    <ManagePage
      activeFilterCount={activeFilterCount}
      columns={columns}
      description="Khoá học đã gửi duyệt trở lên — bản nháp chưa gửi của giảng viên không hiện ở đây."
      drawer={{
        title: (row) => row.title,
        description: (row) =>
          `${CONTENT_STATUS_LABELS[row.status as keyof typeof CONTENT_STATUS_LABELS] ?? row.status} · ${row.authorName ?? "không rõ"}`,
        width: "wide",
        body: (row) => (
          <>
            <CourseEditor draft={draft} onChange={setDraft} onLoad={loadDraft} row={row} />
            {row.status === "pending_review" && (
              <Field hint="Bắt buộc khi từ chối hoặc yêu cầu sửa. Giảng viên sẽ đọc đúng câu này." label="Lý do">
                <textarea
                  className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                  onChange={(event) => setReason(event.target.value)}
                  value={reason}
                />
              </Field>
            )}
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-sm font-medium">Xem trước nội dung</p>
              <ContentPreview item={{ ...row, kind: "courses" }} />
            </div>
          </>
        ),
        footer: (row) => (
          <>
            <Button disabled={busy || draft?.id !== row.id} onClick={() => void act(() => saveDraft(row.id))} variant="outline">
              <Save aria-hidden="true" className="size-4" />
              Lưu
            </Button>
            {row.status !== "published" && (
              <ConfirmButton
                confirmLabel="Xoá khoá học"
                description={`Xoá vĩnh viễn "${row.title}". Chỉ xoá được vì khoá học chưa công khai — nếu đã từng công khai, hãy dùng Gỡ (lưu trữ) thay vì xoá.`}
                onConfirm={() => act(() => coursesApi.remove(request, row.id))}
                title="Xoá khoá học này?"
                variant="outline"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Xoá
              </ConfirmButton>
            )}
            {row.status === "pending_review" && (
              <>
                <Button disabled={busy} onClick={() => void decide(row.id, "request_changes")} variant="outline">
                  <PencilLine aria-hidden="true" className="size-4" />
                  Yêu cầu sửa
                </Button>
                <Button disabled={busy} onClick={() => void decide(row.id, "reject")} variant="ghost">
                  <XCircle aria-hidden="true" className="size-4" />
                  Từ chối
                </Button>
                <Button disabled={busy} onClick={() => void decide(row.id, "approve")}>
                  <CheckCheck aria-hidden="true" className="size-4" />
                  Duyệt
                </Button>
              </>
            )}
            {row.status === "published" && (
              <Button disabled={busy} onClick={() => void decide(row.id, "archive")} variant="ghost">
                <Archive aria-hidden="true" className="size-4" />
                Gỡ xuống
              </Button>
            )}
            {row.status === "archived" && (
              <Button disabled={busy} onClick={() => void decide(row.id, "restore")} variant="outline">
                <RotateCcw aria-hidden="true" className="size-4" />
                Khôi phục
              </Button>
            )}
          </>
        ),
      }}
      emptyMessage="Không có khoá học nào khớp bộ lọc."
      error={error}
      filters={
        <>
          <Select
            label="Trạng thái"
            onChange={setStatus}
            options={[{ value: "", label: "Mọi trạng thái" }, ...STATUS_OPTIONS.map((value) => ({ value, label: CONTENT_STATUS_LABELS[value] }))]}
            value={status}
          />
          <Select
            label="Trình độ"
            onChange={setLevel}
            options={[{ value: "", label: "Mọi trình độ" }, ...LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }))]}
            value={level}
          />
          <LecturerFilter onChange={setAuthorId} options={lecturers} value={authorId} />
          <input
            aria-label="Cập nhật từ ngày"
            className="h-9 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:border-foreground"
            onChange={(event) => setUpdatedFrom(event.target.value)}
            type="date"
            value={updatedFrom}
          />
          <input
            aria-label="Cập nhật đến ngày"
            className="h-9 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:border-foreground"
            onChange={(event) => setUpdatedTo(event.target.value)}
            type="date"
            value={updatedTo}
          />
        </>
      }
      getRowId={(row) => row.id}
      icon={BookOpen}
      loading={loading}
      onClearFilters={() => {
        setStatus("");
        setLevel("");
        setAuthorId("");
        setUpdatedFrom("");
        setUpdatedTo("");
      }}
      onSearchChange={setSearch}
      rows={rows}
      search={search}
      searchPlaceholder="Tìm theo tên hoặc slug…"
      title="Khoá học"
      view={{ mode: view, onModeChange: setView, renderCard: (row) => <CourseCard row={row} /> }}
    />
  );
}

function CourseCard({ row }: { row: AdminCourseListItem }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate font-medium">{row.title}</p>
        <StatusBadge tone={CONTENT_STATUS_TONES[row.status as keyof typeof CONTENT_STATUS_TONES] ?? "neutral"}>
          {CONTENT_STATUS_LABELS[row.status as keyof typeof CONTENT_STATUS_LABELS] ?? row.status}
        </StatusBadge>
      </div>
      <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
      <p className="text-sm text-muted-foreground">{row.authorName ?? "không rõ giảng viên"}</p>
      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>{LEVEL_LABELS[row.level as keyof typeof LEVEL_LABELS] ?? row.level}</span>
        <span>
          {row.totalChapters} chương · {row.totalLessons} bài
        </span>
      </div>
    </div>
  );
}

function CourseEditor({
  row,
  draft,
  onChange,
  onLoad,
}: {
  row: AdminCourseListItem;
  draft: CourseDraft | null;
  onChange: (draft: CourseDraft) => void;
  onLoad: (id: string) => Promise<void>;
}) {
  useEffect(() => {
    if (draft?.id !== row.id) void onLoad(row.id);
  }, [row.id, draft?.id, onLoad]);

  if (draft?.id !== row.id) {
    return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  }

  return (
    <div className="grid gap-4">
      <Field label="Tiêu đề">
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          value={draft.title}
        />
      </Field>
      <Field label="Mô tả">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          value={draft.description}
        />
      </Field>
      <Field label="Trình độ">
        <select
          aria-label="Trình độ"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, level: event.target.value })}
          value={draft.level}
        >
          {LEVELS.map((value) => (
            <option key={value} value={value}>
              {LEVEL_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
