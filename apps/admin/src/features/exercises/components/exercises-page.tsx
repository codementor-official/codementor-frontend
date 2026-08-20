"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Braces, CheckCheck, RotateCcw, Trash2, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { DIFFICULTIES, DIFFICULTY_LABELS, STATUS_LABELS, STATUS_TONES } from "@codementor/solve";
import { Button, ConfirmButton, ManagePage, ReasonButton, RejectDialogButton, Select, StatusBadge, useToast, type ViewMode } from "@codementor/ui";
import { ContentPreview } from "@/features/moderation/content-preview";
import { useAdminApi } from "@/features/auth/admin-api";
import { exercisesApi, moderationApi, type AdminExerciseListItem } from "@/lib/api";
import type { ModerationDecision } from "@/features/moderation/types";
import { LecturerFilter, useLecturerOptions } from "@/features/shared/lecturer-filter";

const STATUS_OPTIONS = ["pending_review", "changes_requested", "rejected", "published", "archived"] as const;

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function ExercisesPage() {
  const request = useAdminApi();
  const toast = useToast();
  const lecturers = useLecturerOptions();

  const [rows, setRows] = useState<AdminExerciseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await exercisesApi.list(request, {
        q: search.trim() || undefined,
        status: status || undefined,
        difficulty: difficulty || undefined,
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
  }, [request, search, status, difficulty, authorId, updatedFrom, updatedTo]);

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

  const decide = (id: string, decision: ModerationDecision, reason?: string) =>
    act(() => moderationApi.decide(request, "exercises", id, decision, reason));

  const columns = useMemo<ColumnDef<AdminExerciseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài code",
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
          <StatusBadge tone={STATUS_TONES[row.original.status as keyof typeof STATUS_TONES] ?? "neutral"}>
            {STATUS_LABELS[row.original.status as keyof typeof STATUS_LABELS] ?? row.original.status}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "difficulty",
        header: "Độ khó",
        cell: ({ row }) => DIFFICULTY_LABELS[row.original.difficulty as keyof typeof DIFFICULTY_LABELS] ?? row.original.difficulty,
      },
      { accessorKey: "authorName", header: "Tác giả", cell: ({ row }) => row.original.authorName ?? "—" },
      { accessorKey: "kind", header: "Dạng" },
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

  const activeFilterCount = [status, difficulty, authorId, updatedFrom, updatedTo].filter(Boolean).length;

  return (
    <ManagePage
      activeFilterCount={activeFilterCount}
      columns={columns}
      description="Bài code đã gửi duyệt trở lên — bản nháp chưa gửi của giảng viên không hiện ở đây."
      drawer={{
        title: (row) => row.title,
        description: (row) =>
          `${STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ?? row.status} · ${row.authorName ?? "không rõ"}`,
        width: "wide",
        body: (row) => <ContentPreview item={{ ...row, kind: "exercises" }} />,
        footer: (row) => (
          <>
            {row.status !== "published" && (
              <ConfirmButton
                confirmLabel="Xoá bài code"
                description={`Xoá vĩnh viễn "${row.title}". Chỉ xoá được vì bài chưa công khai — nếu đã từng công khai, hãy dùng Thu hồi thay vì xoá.`}
                onConfirm={() => act(() => exercisesApi.remove(request, row.id))}
                title="Xoá bài code này?"
                variant="outline"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Xoá
              </ConfirmButton>
            )}
            {row.status === "pending_review" && (
              <>
                <RejectDialogButton
                  decisions={[
                    { value: "request_changes", label: "Yêu cầu sửa" },
                    { value: "reject", label: "Từ chối" },
                  ]}
                  description="Tác giả sẽ nhận được đúng lý do này."
                  disabled={busy}
                  onConfirm={(decision, reason) => decide(row.id, decision as ModerationDecision, reason)}
                  placeholder="Vì sao cần sửa hoặc từ chối?"
                  title="Từ chối / yêu cầu sửa bài code"
                  variant="ghost"
                >
                  <XCircle aria-hidden="true" className="size-4" />
                  Từ chối / Yêu cầu sửa
                </RejectDialogButton>
                <Button disabled={busy} onClick={() => void decide(row.id, "approve")}>
                  <CheckCheck aria-hidden="true" className="size-4" />
                  Duyệt
                </Button>
              </>
            )}
            {row.status === "published" && (
              <ReasonButton
                confirmLabel="Thu hồi"
                description="Bài code sẽ rời khỏi kho công khai. Tác giả sẽ nhận được đúng lý do này."
                disabled={busy}
                onConfirm={(reason) => decide(row.id, "archive", reason)}
                placeholder="Vì sao thu hồi bài code đang công khai này?"
                title="Thu hồi bài code đang công khai?"
                variant="ghost"
              >
                <Archive aria-hidden="true" className="size-4" />
                Thu hồi
              </ReasonButton>
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
      emptyMessage="Không có bài code nào khớp bộ lọc."
      error={error}
      filters={
        <>
          <Select
            label="Trạng thái"
            onChange={setStatus}
            options={[{ value: "", label: "Mọi trạng thái" }, ...STATUS_OPTIONS.map((value) => ({ value, label: STATUS_LABELS[value] }))]}
            value={status}
          />
          <Select
            label="Độ khó"
            onChange={setDifficulty}
            options={[{ value: "", label: "Mọi độ khó" }, ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] }))]}
            value={difficulty}
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
      icon={Braces}
      loading={loading}
      onClearFilters={() => {
        setStatus("");
        setDifficulty("");
        setAuthorId("");
        setUpdatedFrom("");
        setUpdatedTo("");
      }}
      onRefresh={load}
      onSearchChange={setSearch}
      rows={rows}
      search={search}
      searchPlaceholder="Tìm theo tên hoặc slug…"
      title="Bài code"
      view={{ mode: view, onModeChange: setView, renderCard: (row) => <ExerciseCard row={row} /> }}
    />
  );
}

function ExerciseCard({ row }: { row: AdminExerciseListItem }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate font-medium">{row.title}</p>
        <StatusBadge tone={STATUS_TONES[row.status as keyof typeof STATUS_TONES] ?? "neutral"}>
          {STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ?? row.status}
        </StatusBadge>
      </div>
      <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
      <p className="text-sm text-muted-foreground">{row.authorName ?? "không rõ tác giả"}</p>
      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>{DIFFICULTY_LABELS[row.difficulty as keyof typeof DIFFICULTY_LABELS] ?? row.difficulty}</span>
        <span>{row.kind}</span>
      </div>
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
