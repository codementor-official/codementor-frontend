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
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  FIELDS,
  FIELD_LABELS,
  LEVEL_LABELS,
  type RoadmapListItem,
} from "@/features/roadmaps/types";

type Tab = "mine" | "catalogue";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function RoadmapsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [rows, setRows] = useState<RoadmapListItem[]>([]);
  const [search, setSearch] = useState("");
  const [field, setField] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: search || undefined, field: field || undefined };
      const page =
        tab === "mine"
          ? await api.roadmaps.mine({ ...params, status: status || undefined })
          : await api.roadmaps.catalogue(params);
      setRows(page.items);
    } catch (cause) {
      setError(describe(cause));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, field, status]);

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

  const columns = useMemo<ColumnDef<RoadmapListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Lộ trình",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "field",
        header: "Lĩnh vực",
        cell: ({ row }) => FIELD_LABELS[row.original.field],
      },
      {
        accessorKey: "courseCount",
        header: "Khóa học",
        cell: ({ row }) => `${row.original.courseCount}`,
      },
      {
        accessorKey: "estimatedHours",
        header: "Thời lượng",
        cell: ({ row }) =>
          row.original.estimatedHours ? `${row.original.estimatedHours} giờ` : "—",
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
            } satisfies ColumnDef<RoadmapListItem, unknown>,
          ]
        : [
            {
              accessorKey: "authorName",
              header: "Tác giả",
              cell: ({ row }) =>
                row.original.createdBy === user?.id
                  ? "Của bạn"
                  : (row.original.authorName ?? "—"),
            } satisfies ColumnDef<RoadmapListItem, unknown>,
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
    const roadmap = await api.roadmaps.create({
      title: "Lộ trình chưa đặt tên",
      field: "backend",
      level: "basic",
    });
    router.push(`/roadmaps/${roadmap.id}/studio`);
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
            { value: "mine", label: "Lộ trình của tôi" },
            { value: "catalogue", label: "Danh mục công khai" },
          ]}
          value={tab}
        />
      </div>

      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo lộ trình
          </Button>
        }
        activeFilterCount={[field, status].filter(Boolean).length}
        columns={columns}
        description={
          tab === "mine"
            ? "Lộ trình bạn tạo. Thời lượng là tổng của các khóa học thành phần."
            : "Lộ trình đã công khai của mọi giảng viên."
        }
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${FIELD_LABELS[row.field]} · ${LEVEL_LABELS[row.level]} · ${CONTENT_STATUS_LABELS[row.status]}`,
          body: (row) => (
            <dl className="grid gap-3 text-sm">
              <Row label="Slug" value={row.slug} />
              <Row label="Số khóa học" value={`${row.courseCount}`} />
              <Row
                label="Thời lượng"
                value={row.estimatedHours ? `${row.estimatedHours} giờ` : "Chưa có"}
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
                    onClick={() => act(() => api.roadmaps.withdraw(row.id))}
                    type="button"
                    variant="outline"
                  >
                    Hủy gửi duyệt
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.roadmaps.submit(row.id))}
                    type="button"
                    variant="outline"
                  >
                    Gửi duyệt
                  </Button>
                )}
                {row.status !== "published" && (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.roadmaps.remove(row.id))}
                    type="button"
                    variant="ghost"
                  >
                    Xoá
                  </Button>
                )}
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                  href={`/roadmaps/${row.id}/studio`}
                >
                  Mở studio
                </Link>
              </>
            ) : null,
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa tạo lộ trình nào." : "Chưa có lộ trình nào được công khai."
        }
        error={error}
        filters={
          <div className="grid gap-3">
            <Select
              label="Lĩnh vực"
              onChange={setField}
              options={[
                { value: "", label: "Mọi lĩnh vực" },
                ...FIELDS.map((value) => ({ value, label: FIELD_LABELS[value] })),
              ]}
              value={field}
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
          setField("");
          setStatus("");
        }}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        title="Lộ trình"
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
