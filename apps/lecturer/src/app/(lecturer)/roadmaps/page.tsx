"use client";

import { ReviewFlag, ReviewNotice } from "@/components/page/review-notice";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Pencil, Plus, Route, Send, Trash2, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, Select, StatusBadge, useUndoableDelete } from "@codementor/ui";
import { ConfirmButton } from "@/components/page/confirm-button";
import { PageBody } from "@/components/page/page-body";
import {
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
} from "@/components/page/drawer-detail";
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
  const { pendingIds, scheduleDelete } = useUndoableDelete();

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
            <ReviewFlag status={row.original.status} />
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
    <PageBody>
      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo lộ trình
          </Button>
        }
        activeFilterCount={[field, status].filter(Boolean).length}
        icon={Route}
        columns={columns}
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${FIELD_LABELS[row.field]} · ${LEVEL_LABELS[row.level]} · ${CONTENT_STATUS_LABELS[row.status]}`,
          body: (row) => <RoadmapDrawerBody row={row} />,
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
                    <Undo2 aria-hidden="true" className="size-4" /> Hủy gửi duyệt
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.roadmaps.submit(row.id))}
                    type="button"
                    variant="outline"
                  >
                    <Send aria-hidden="true" className="size-4" /> Gửi duyệt
                  </Button>
                )}
                {row.status !== "published" && (
                  <ConfirmButton
                    confirmLabel="Xoá lộ trình"
                    description={`Lộ trình “${row.title}” sẽ bị xoá cùng danh sách khóa học bên trong. Bản thân các khóa học vẫn còn. Có vài giây để hoàn tác sau khi xác nhận.`}
                    disabled={busy}
                    onConfirm={() =>
                      scheduleDelete({
                        id: row.id,
                        message: `Đã xoá lộ trình "${row.title}".`,
                        commit: () => api.roadmaps.remove(row.id),
                      })
                    }
                    title="Xoá lộ trình này?"
                  >
                    <Trash2 aria-hidden="true" className="size-4" /> Xoá
                  </ConfirmButton>
                )}
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                  href={`/roadmaps/${row.id}/studio`}
                >
                  <Pencil aria-hidden="true" className="size-4" /> Mở studio
                </Link>
              </>
            ) : null,
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa tạo lộ trình nào." : "Chưa có lộ trình nào được công khai."
        }
        error={error}
        filters={
          <>
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
          </>
        }
        getRowId={(row) => row.id}
        loading={loading}
        onClearFilters={() => {
          setField("");
          setStatus("");
        }}
        onSearchChange={setSearch}
        rows={rows.filter((row) => !pendingIds.has(row.id))}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        tabs={{
          options: [
            { value: "mine", label: "Lộ trình của tôi" },
            { value: "catalogue", label: "Danh mục công khai" },
          ],
          value: tab,
          onChange: (value) => {
            setTab(value as Tab);
            setStatus("");
          },
        }}
        title="Lộ trình"
      />
    </PageBody>
  );
}

function RoadmapDrawerBody({ row }: { row: RoadmapListItem }) {
  return (
    <DrawerDetail key={row.id} load={() => api.roadmaps.get(row.id)}>
      {(roadmap) => {
        const courses = roadmap.courses ?? [];
        // Submission is refused while any component course is unpublished, so the blocker
        // belongs on screen next to the courses causing it.
        const blocking = courses.filter((course) => course.status !== "published").length;

        return (
          <>
            <ReviewNotice reason={roadmap.rejectionReason} status={roadmap.status} />
            <DetailMeta>
              <DetailRow label="Slug" value={roadmap.slug} />
              <DetailRow label="Lĩnh vực" value={FIELD_LABELS[roadmap.field]} />
              <DetailRow label="Trình độ" value={LEVEL_LABELS[roadmap.level]} />
              <DetailRow
                label="Thời lượng"
                value={roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "Chưa có"}
              />
              <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
              <DetailRow label="Cập nhật" value={dateFormat.format(new Date(roadmap.updatedAt))} />
            </DetailMeta>

            {roadmap.description && (
              <DetailSection icon={FileText} title="Mô tả">
                <p className="text-sm leading-relaxed">{roadmap.description}</p>
              </DetailSection>
            )}

            <DetailSection icon={BookOpen} title={`Khóa học (${courses.length})`}>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Lộ trình này chưa có khóa học nào.</p>
              ) : (
                <>
                  <ol className="grid gap-2">
                    {courses.map((course, index) => (
                      <li
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                        key={course.courseId}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {index + 1}. {course.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"}
                            {course.isOptional ? " · tùy chọn" : ""}
                          </span>
                        </span>
                        <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
                          {CONTENT_STATUS_LABELS[course.status]}
                        </StatusBadge>
                      </li>
                    ))}
                  </ol>
                  {blocking > 0 && (
                    <p className="mt-2 text-xs text-warning">
                      {blocking} khóa học chưa công khai — gửi duyệt lộ trình sẽ bị từ chối.
                    </p>
                  )}
                </>
              )}
            </DetailSection>
          </>
        );
      }}
    </DrawerDetail>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
