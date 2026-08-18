"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Braces, ExternalLink, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ManagePage, StatusBadge } from "@codementor/ui";
import { DIFFICULTY_LABELS, STATUS_LABELS, STATUS_TONES, type Difficulty, type ExerciseStatus } from "@codementor/solve";
import { FIELD_LABELS, LEVEL_LABELS, type Field, type Level } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { ModerationActions } from "@/features/moderation/moderation-actions";
import { describeError } from "@/features/moderation/use-moderation";
import {
  dateTimeFormat,
  daysWaiting,
  KIND_LABELS,
  KIND_ROUTES,
  STATUS_TABS,
} from "@/features/moderation/vocabulary";
import { moderationApi, type ContentKind, type QueueItem } from "@/lib/api";

const ICONS: Record<ContentKind, LucideIcon> = {
  exercises: Braces,
  courses: BookOpen,
  roadmaps: Route,
};

const DESCRIPTIONS: Record<ContentKind, string> = {
  exercises:
    "Bài code giảng viên gửi lên. Mở trang giải thử để chạy đề qua judge trước khi quyết định — đề sai testcase trông y hệt đề đúng.",
  courses:
    "Khóa học giảng viên gửi lên. Mở trang kiểm tra để xem cây chương trình, nội dung từng bài và trạng thái bài code được nhúng.",
  roadmaps:
    "Lộ trình giảng viên gửi lên. Mở trang kiểm tra để xem thứ tự khóa học và khóa nào chưa công khai.",
};

/**
 * Màn quản lý một loại nội dung, gồm cả những thứ đã quyết định rồi.
 *
 * Tab trạng thái là phần chính: hàng chờ chỉ trả lời "còn gì phải xem", còn hai tình huống
 * hay gặp nhất của một admin lại nằm ngoài nó — lỡ duyệt một bài không hợp lệ (tìm ở "Đã
 * công khai" rồi gỡ), và từ chối xong nghĩ lại (tìm ở "Đã từ chối" rồi duyệt). Không có
 * tab thì hai việc đó không có chỗ nào để bắt đầu.
 */
export function ModerationQueuePage({ kind }: { kind: ContentKind }) {
  const request = useAdminApi();
  const [status, setStatus] = useState<string>("pending_review");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Lọc ở server: danh sách này dài ra theo nội dung thật, và lọc mảng đã tải chỉ đúng
      // chừng nào mọi thứ còn nằm trong trang đầu.
      const page = await moderationApi.queue(request, kind, {
        status,
        q: search.trim() || undefined,
        limit: 50,
      });
      setRows(page.items.map((item) => ({ ...item, kind })));
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setLoading(false);
    }
  }, [kind, request, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const columns = useMemo<ColumnDef<QueueItem, unknown>[]>(() => {
    const title: ColumnDef<QueueItem, unknown> = {
      accessorKey: "title",
      header: "Nội dung",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    };

    const specific: ColumnDef<QueueItem, unknown>[] =
      kind === "exercises"
        ? [
            {
              accessorKey: "difficulty",
              header: "Độ khó",
              cell: ({ row }) =>
                DIFFICULTY_LABELS[row.original.difficulty as Difficulty] ?? row.original.difficulty ?? "—",
            },
          ]
        : kind === "courses"
          ? [
              {
                accessorKey: "level",
                header: "Cấp độ",
                cell: ({ row }) => LEVEL_LABELS[row.original.level as Level] ?? row.original.level ?? "—",
              },
              {
                id: "size",
                header: "Quy mô",
                cell: ({ row }) => `${row.original.totalChapters ?? 0} chương · ${row.original.totalLessons ?? 0} bài`,
                meta: {
                  exportValue: (row: QueueItem) =>
                    `${row.totalChapters ?? 0} chương, ${row.totalLessons ?? 0} bài`,
                },
              },
            ]
          : [
              {
                accessorKey: "field",
                header: "Lĩnh vực",
                cell: ({ row }) => FIELD_LABELS[row.original.field as Field] ?? row.original.field ?? "—",
              },
              {
                accessorKey: "courseCount",
                header: "Số khóa",
                cell: ({ row }) => row.original.courseCount ?? 0,
              },
            ];

    return [
      title,
      ...specific,
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONES[row.original.status as ExerciseStatus] ?? "neutral"}>
            {STATUS_LABELS[row.original.status as ExerciseStatus] ?? row.original.status}
          </StatusBadge>
        ),
        meta: {
          exportValue: (row: QueueItem) => STATUS_LABELS[row.status as ExerciseStatus] ?? row.status,
        },
      },
      {
        accessorKey: "authorName",
        header: "Tác giả",
        cell: ({ row }) => row.original.authorName ?? "—",
      },
      {
        accessorKey: "updatedAt",
        header: status === "pending_review" ? "Chờ từ" : "Cập nhật",
        cell: ({ row }) => {
          const days = daysWaiting(row.original.updatedAt);
          return (
            <span className="text-sm text-muted-foreground">
              {dateTimeFormat.format(new Date(row.original.updatedAt))}
              {status === "pending_review" && days >= 3 && (
                <span className="ml-2 text-warning">chờ {days} ngày</span>
              )}
            </span>
          );
        },
        meta: {
          exportValue: (row: QueueItem) => dateTimeFormat.format(new Date(row.updatedAt)),
        },
      },
    ];
  }, [kind, status]);

  return (
    <ManagePage
      columns={columns}
      description={DESCRIPTIONS[kind]}
      drawer={{
        title: (row) => row.title,
        description: (row) => `${row.slug} · ${row.authorName ?? "không rõ tác giả"}`,
        body: (row) => (
          <>
            <dl className="mb-4 grid gap-3 text-sm">
              <Field label="Trạng thái">
                <StatusBadge tone={STATUS_TONES[row.status as ExerciseStatus] ?? "neutral"}>
                  {STATUS_LABELS[row.status as ExerciseStatus] ?? row.status}
                </StatusBadge>
              </Field>
              <Field label="Tác giả">{row.authorName ?? "—"}</Field>
              <Field label="Cập nhật">{dateTimeFormat.format(new Date(row.updatedAt))}</Field>
              {kind === "exercises" && (
                <Field label="Độ khó">
                  {DIFFICULTY_LABELS[row.difficulty as Difficulty] ?? row.difficulty ?? "—"}
                </Field>
              )}
              {kind === "courses" && (
                <Field label="Quy mô">
                  {row.totalChapters ?? 0} chương · {row.totalLessons ?? 0} bài
                </Field>
              )}
              {kind === "roadmaps" && <Field label="Số khóa">{row.courseCount ?? 0}</Field>}
            </dl>

            {/* Danh sách không mang theo nội dung, nên quyết định dựa vào riêng nó là quyết
                định dựa trên tiêu đề. Đường dẫn này là chỗ xem thứ tác giả thực sự gửi. */}
            <Link
              className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm hover:bg-muted"
              href={`${KIND_ROUTES[kind]}/${row.id}`}
            >
              <span>
                <span className="font-medium">Mở trang kiểm tra</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {kind === "exercises"
                    ? "Đọc đề, xem testcase và chạy thử qua judge."
                    : kind === "courses"
                      ? "Xem cây chương trình và nội dung từng bài học."
                      : "Xem thứ tự khóa học và trạng thái từng khóa."}
                </span>
              </span>
              <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </Link>

            <ModerationActions
              id={row.id}
              key={row.id}
              kind={kind}
              onDone={() => void load()}
              status={row.status}
            />
          </>
        ),
      }}
      emptyMessage={
        status === "pending_review"
          ? `Không có ${KIND_LABELS[kind].toLowerCase()} nào đang chờ duyệt.`
          : "Không có nội dung nào ở trạng thái này."
      }
      error={error}
      getRowId={(row) => row.id}
      icon={ICONS[kind]}
      loading={loading}
      onSearchChange={setSearch}
      rows={rows}
      search={search}
      searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
      tabs={{ options: [...STATUS_TABS], value: status, onChange: setStatus }}
      title={KIND_LABELS[kind]}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}
