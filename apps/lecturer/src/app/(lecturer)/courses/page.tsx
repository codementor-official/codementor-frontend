"use client";

import { ReviewFlag, ReviewNotice } from "@/components/page/review-notice";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, ListTree, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, Select, StatusBadge } from "@codementor/ui";
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
import { LESSON_TYPE_LABELS, type CourseListItem } from "@/features/courses/types";
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
            <ReviewFlag status={row.original.status} />
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
    <PageBody>
      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo khóa học
          </Button>
        }
        activeFilterCount={[level, status].filter(Boolean).length}
        icon={BookOpen}
        columns={columns}
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${LEVEL_LABELS[row.level]} · ${CONTENT_STATUS_LABELS[row.status]}`,
          body: (row) => <CourseDrawerBody row={row} />,
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
                    <Undo2 aria-hidden="true" className="size-4" /> Hủy gửi duyệt
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => act(() => api.courses.submit(row.id))}
                    type="button"
                    variant="outline"
                  >
                    <Send aria-hidden="true" className="size-4" /> Gửi duyệt
                  </Button>
                )}
                {row.status !== "published" && (
                  <ConfirmButton
                    confirmLabel="Xoá khóa học"
                    description={`Khóa học “${row.title}” sẽ bị xoá cùng toàn bộ chương và bài bên trong. Không hoàn tác được.`}
                    disabled={busy}
                    onConfirm={() => act(() => api.courses.remove(row.id))}
                    title="Xoá khóa học này?"
                  >
                    <Trash2 aria-hidden="true" className="size-4" /> Xoá
                  </ConfirmButton>
                )}
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                  href={`/courses/${row.id}/studio`}
                >
                  <Pencil aria-hidden="true" className="size-4" /> Mở studio
                </Link>
              </>
            ) : null,
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa soạn khóa học nào." : "Chưa có khóa học nào được công khai."
        }
        error={error}
        filters={
          <>
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
          </>
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
        tabs={{
          options: [
            { value: "mine", label: "Khóa học của tôi" },
            { value: "catalogue", label: "Danh mục công khai" },
          ],
          value: tab,
          onChange: (value) => {
            setTab(value as Tab);
            setStatus("");
          },
        }}
        title="Khóa học"
      />
    </PageBody>
  );
}

function CourseDrawerBody({ row }: { row: CourseListItem }) {
  return (
    <DrawerDetail key={row.id} load={() => api.courses.get(row.id)}>
      {(course) => {
        const chapters = course.chapters ?? [];
        return (
          <>
            <ReviewNotice reason={course.rejectionReason} status={course.status} />
            <DetailMeta>
              <DetailRow label="Slug" value={course.slug} />
              <DetailRow label="Trình độ" value={LEVEL_LABELS[course.level]} />
              <DetailRow
                label="Nội dung"
                value={`${course.totalChapters} chương · ${course.totalLessons} bài`}
              />
              <DetailRow
                label="Thời lượng"
                value={course.durationHours ? `${course.durationHours} giờ` : "Chưa có"}
              />
              <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
              <DetailRow label="Cập nhật" value={dateFormat.format(new Date(course.updatedAt))} />
            </DetailMeta>

            {course.description && (
              <DetailSection icon={FileText} title="Mô tả">
                <p className="text-sm leading-relaxed">{course.description}</p>
              </DetailSection>
            )}

            <DetailSection icon={ListTree} title="Chương trình học">
              {chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Khóa học này chưa có chương nào.</p>
              ) : (
                <ol className="grid gap-2">
                  {chapters.map((chapter, index) => (
                    <li className="rounded-md border" key={chapter.id ?? index}>
                      <div className="flex items-baseline gap-2 border-b px-3 py-2">
                        <span className="text-sm font-medium">
                          {index + 1}. {chapter.title}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {chapter.lessons?.length ?? 0} bài
                        </span>
                      </div>
                      {(chapter.lessons?.length ?? 0) > 0 && (
                        <ul className="grid gap-1 px-3 py-2">
                          {chapter.lessons?.map((lesson) => (
                            <li
                              className="flex items-baseline gap-2 text-xs"
                              key={lesson.id ?? lesson.title}
                            >
                              <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                              <span className="shrink-0 text-muted-foreground">
                                {LESSON_TYPE_LABELS[lesson.type]}
                                {lesson.durationMinutes ? ` · ${lesson.durationMinutes}′` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
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
