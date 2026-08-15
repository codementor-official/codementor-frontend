"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, ManagePage, SegmentedTabs, Select, StatusBadge } from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
  type ExerciseListItem,
  type ExerciseStatus,
} from "@/features/exercises/types";

type Tab = "mine" | "bank";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ExercisesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [rows, setRows] = useState<ExerciseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: search || undefined, difficulty: difficulty || undefined };
      const page =
        tab === "mine"
          ? await api.exercises.mine({ ...params, status: status || undefined })
          : await api.exercises.bank(params);
      setRows(page.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được danh sách");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, difficulty, status]);

  useEffect(() => {
    // Gõ tới đâu gọi API tới đó thì một từ khoá 10 ký tự là 10 lượt gọi.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? describeApiError(cause)
          : cause instanceof Error
            ? cause.message
            : "Thao tác thất bại",
      );
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<ExerciseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài tập",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.slug}
              {row.original.forkedFromId && " · bản fork"}
            </p>
          </div>
        ),
      },
      ...(tab === "bank"
        ? [
            {
              accessorKey: "authorName",
              header: "Tác giả",
              cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                  {row.original.authorId === user?.id
                    ? "Của bạn"
                    : (row.original.authorName ?? "—")}
                </span>
              ),
            } satisfies ColumnDef<ExerciseListItem, unknown>,
          ]
        : []),
      {
        accessorKey: "difficulty",
        header: "Độ khó",
        cell: ({ row }) => DIFFICULTY_LABELS[row.original.difficulty],
      },
      ...(tab === "mine"
        ? [
            {
              accessorKey: "status",
              header: "Trạng thái",
              cell: ({ row }) => (
                <StatusBadge tone={STATUS_TONES[row.original.status]}>
                  {STATUS_LABELS[row.original.status]}
                </StatusBadge>
              ),
            } satisfies ColumnDef<ExerciseListItem, unknown>,
          ]
        : []),
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
    ],
    [tab, user?.id],
  );

  const create = async () => {
    const exercise = await api.exercises.create({
      title: "Bài tập chưa đặt tên",
      kind: "code",
      difficulty: "easy",
    });
    router.push(`/exercises/${exercise.id}/studio`);
  };

  return (
    <>
      <div className="mb-4">
        <SegmentedTabs
          onChange={(value) => {
            setTab(value as Tab);
            setStatus("");
          }}
          options={[
            { value: "mine", label: "Bài của tôi" },
            { value: "bank", label: "Kho bài chung" },
          ]}
          value={tab}
        />
      </div>

      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo bài code
          </Button>
        }
        activeFilterCount={[difficulty, status].filter(Boolean).length}
        columns={columns}
        description={
          tab === "mine"
            ? "Bài code bạn là tác giả, mọi trạng thái."
            : "Bài đã công khai của mọi giảng viên. Dùng nguyên bản hoặc fork để sửa."
        }
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${DIFFICULTY_LABELS[row.difficulty]} · ${STATUS_LABELS[row.status]}`,
          body: (row) => <ExerciseDrawerBody row={row} />,
          footer: (row) => (
            <ExerciseDrawerActions
              busy={busyId === row.id}
              isMine={row.authorId === user?.id}
              onFork={() => act(row.id, () => api.exercises.fork(row.id))}
              onRemove={() => act(row.id, () => api.exercises.remove(row.id))}
              onSubmit={() => act(row.id, () => api.exercises.submit(row.id))}
              onWithdraw={() => act(row.id, () => api.exercises.withdraw(row.id))}
              row={row}
            />
          ),
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa soạn bài nào." : "Chưa có bài nào được công khai."
        }
        error={error}
        filters={
          <div className="grid gap-3">
            <Select
              label="Độ khó"
              onChange={setDifficulty}
              options={[
                { value: "", label: "Mọi độ khó" },
                ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] })),
              ]}
              value={difficulty}
            />
            {tab === "mine" && (
              <Select
                label="Trạng thái"
                onChange={setStatus}
                options={[
                  { value: "", label: "Mọi trạng thái" },
                  ...STATUSES.map((value) => ({
                    value,
                    label: STATUS_LABELS[value as ExerciseStatus],
                  })),
                ]}
                value={status}
              />
            )}
          </div>
        }
        getRowId={(row) => row.id}
        loading={loading}
        onClearFilters={() => {
          setDifficulty("");
          setStatus("");
        }}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        title="Bài code"
      />
    </>
  );
}

function ExerciseDrawerBody({ row }: { row: ExerciseListItem }) {
  return (
    <dl className="grid gap-3 text-sm">
      <Row label="Slug" value={row.slug} />
      <Row label="Độ khó" value={DIFFICULTY_LABELS[row.difficulty]} />
      <Row label="Trạng thái" value={STATUS_LABELS[row.status]} />
      <Row label="Tác giả" value={row.authorName ?? "—"} />
      <Row
        label="Cập nhật"
        value={dateFormat.format(new Date(row.updatedAt))}
      />
      {row.forkedFromId && <Row label="Nguồn gốc" value="Fork từ một bài khác" />}
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}

function ExerciseDrawerActions({
  row,
  isMine,
  busy,
  onSubmit,
  onWithdraw,
  onFork,
  onRemove,
}: {
  row: ExerciseListItem;
  isMine: boolean;
  busy: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  onFork: () => void;
  onRemove: () => void;
}) {
  const forkable = !isMine && row.status === "published" && row.visibility === "public";

  return (
    <>
      {forkable && (
        <Button disabled={busy} onClick={onFork} type="button" variant="outline">
          Fork & chỉnh sửa
        </Button>
      )}
      {isMine && (
        <>
          {row.status === "pending_review" ? (
            <Button disabled={busy} onClick={onWithdraw} type="button" variant="outline">
              Hủy gửi duyệt
            </Button>
          ) : (
            <Button disabled={busy} onClick={onSubmit} type="button" variant="outline">
              Gửi duyệt
            </Button>
          )}
          {row.status !== "published" && (
            <Button disabled={busy} onClick={onRemove} type="button" variant="ghost">
              Xoá
            </Button>
          )}
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
            href={`/exercises/${row.id}/studio`}
          >
            Mở studio
          </Link>
        </>
      )}
      {!isMine && (
        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium"
          href={`/exercises/${row.id}/solve`}
        >
          Xem & giải thử
        </Link>
      )}
    </>
  );
}

/** Thông điệp của backend nói rõ thiếu gì; giữ nguyên thay vì thay bằng câu chung chung. */
function describeApiError(error: ApiClientError): string {
  const body = error.body as { message?: string } | undefined;
  return body?.message ?? error.message;
}
