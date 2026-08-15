"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, SegmentedTabs, Select, StatusBadge } from "@codementor/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { CourseListItem } from "@/features/courses/types";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  LEVELS,
  LEVEL_LABELS,
} from "@/features/roadmaps/types";

type Tab = "mine" | "catalogue";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [rows, setRows] = useState<CourseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: search || undefined, level: level || undefined };
      const page =
        tab === "mine"
          ? await api.courses.mine({ ...params, status: status || undefined })
          : await api.courses.catalogue(params);
      setRows(page.items);
    } catch (cause) {
      setError(describe(cause));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, level, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<CourseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Khóa học",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "level",
        header: "Trình độ",
        cell: ({ row }) => LEVEL_LABELS[row.original.level],
      },
      {
        accessorKey: "totalChapters",
        header: "Nội dung",
        cell: ({ row }) => `${row.original.totalChapters} chương · ${row.original.totalLessons} bài`,
      },
      {
        accessorKey: "durationHours",
        header: "Thời lượng",
        cell: ({ row }) => (row.original.durationHours ? `${row.original.durationHours} giờ` : "—"),
      },
      ...(tab === "mine"
        ? [
            {
              accessorKey: "status",
              header: "Trạng thái",
              cell: ({ row }) => (
                <StatusBadge tone={CONTENT_STATUS_TONES[row.original.status]}>
                  {CONTENT_STATUS_LABELS[row.original.status]}
                </StatusBadge>
              ),
            } satisfies ColumnDef<CourseListItem, unknown>,
          ]
        : [
            {
              accessorKey: "authorName",
              header: "Tác giả",
              cell: ({ row }) =>
                row.original.createdBy === user?.id ? "Của bạn" : (row.original.authorName ?? "—"),
            } satisfies ColumnDef<CourseListItem, unknown>,
          ]),
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
    const course = await api.courses.create({ title: "Khóa học chưa đặt tên", level: "basic" });
    router.push(`/courses/${course.id}/studio`);
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
            { value: "mine", label: "Khóa học của tôi" },
            { value: "catalogue", label: "Danh mục công khai" },
          ]}
          value={tab}
        />
      </div>

      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo khóa học
          </Button>
        }
        activeFilterCount={[level, status].filter(Boolean).length}
        columns={columns}
        description={
          tab === "mine"
            ? "Khóa học bạn soạn. Thời lượng là tổng thời lượng các bài."
            : "Khóa học đã công khai của mọi giảng viên."
        }
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${LEVEL_LABELS[row.level]} · ${CONTENT_STATUS_LABELS[row.status]}`,
          body: (row) => (
            <dl className="grid gap-3 text-sm">
              <Row label="Slug" value={row.slug} />
              <Row label="Nội dung" value={`${row.totalChapters} chương · ${row.totalLessons} bài`} />
              <Row
                label="Thời lượng"
                value={row.durationHours ? `${row.durationHours} giờ` : "Chưa có"}
              />
              <Row label="Tác giả" value={row.authorName ?? "—"} />
              <Row label="Cập nhật" value={dateFormat.format(new Date(row.updatedAt))} />
            </dl>
          ),
          footer: (row) =>
            row.createdBy === user?.id ? (
              <>
                {row.status === "pending_review" ? (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.courses.withdraw(row.id))}
                    type="button"
                    variant="outline"
                  >
                    Hủy gửi duyệt
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.courses.submit(row.id))}
                    type="button"
                    variant="outline"
                  >
                    Gửi duyệt
                  </Button>
                )}
                {row.status !== "published" && (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.courses.remove(row.id))}
                    type="button"
                    variant="ghost"
                  >
                    Xoá
                  </Button>
                )}
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                  href={`/courses/${row.id}/studio`}
                >
                  Mở studio
                </Link>
              </>
            ) : null,
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa soạn khóa học nào." : "Chưa có khóa học nào được công khai."
        }
        error={error}
        filters={
          <div className="grid gap-3">
            <Select
              label="Trình độ"
              onChange={setLevel}
              options={[
                { value: "", label: "Mọi trình độ" },
                ...LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] })),
              ]}
              value={level}
            />
            {tab === "mine" && (
              <Select
                label="Trạng thái"
                onChange={setStatus}
                options={[
                  { value: "", label: "Mọi trạng thái" },
                  ...CONTENT_STATUSES.map((value) => ({
                    value,
                    label: CONTENT_STATUS_LABELS[value],
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
          setLevel("");
          setStatus("");
        }}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        title="Khóa học"
      />
    </>
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

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
