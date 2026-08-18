"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ManagePage } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { ModerationActions } from "@/features/moderation/moderation-actions";
import { describeError } from "@/features/moderation/use-moderation";
import { dateTimeFormat, daysWaiting, KIND_LABELS, KIND_ROUTES } from "@/features/moderation/vocabulary";
import { moderationApi, type ContentKind, type QueueItem } from "@/lib/api";

const KINDS: ContentKind[] = ["exercises", "courses", "roadmaps"];

/**
 * Hàng chờ gộp: mọi thứ đang đợi một quyết định, cũ trước.
 *
 * Đây là màn "còn gì phải làm hôm nay". Thao tác trên một nội dung cụ thể — gỡ bài đã lỡ
 * duyệt, duyệt lại bài đã từ chối — nằm ở màn quản lý của từng loại, vì chúng bắt đầu bằng
 * việc TÌM một nội dung không còn nằm trong hàng chờ nữa.
 */
export default function ModerationPage() {
  // Client của BFF: baseUrl là `/api/backend`, token do route handler gắn phía server
  // nên trình duyệt không bao giờ cầm nó.
  const request = useAdminApi();
  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ba hàng chờ, ba service, gộp ở đây.
   *
   * Không có endpoint gộp ở backend: một endpoint như thế buộc một service đọc bảng của
   * service khác. `Promise.allSettled` chứ không `all` — một service chết thì hai hàng
   * chờ còn lại vẫn phải xem được.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const wanted: ContentKind[] = kind === "all" ? KINDS : [kind];

    const results = await Promise.allSettled(
      wanted.map((each) => moderationApi.queue(request, each, { status: "pending_review" })),
    );
    const items: QueueItem[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        items.push(...result.value.items.map((item) => ({ ...item, kind: wanted[index] })));
      } else {
        failed.push(KIND_LABELS[wanted[index]]);
      }
    });

    // Cũ trước, giống thứ tự từng hàng chờ trả về — gộp xong vẫn phải là hàng chờ.
    items.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    setRows(items);
    if (failed.length > 0) setError(`Không tải được hàng chờ: ${failed.join(", ")}`);
    setLoading(false);
  }, [kind, request]);

  useEffect(() => {
    // Hoãn một nhịp: gọi thẳng `load()` là setState đồng bộ ngay trong thân effect, và
    // nó cũng cho phép huỷ nếu người dùng đổi tab trước khi ba hàng chờ trả về.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(
    () =>
      search.trim()
        ? rows.filter((row) => row.title.toLowerCase().includes(search.trim().toLowerCase()))
        : rows,
    [rows, search],
  );

  const columns = useMemo<ColumnDef<QueueItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Nội dung",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "kind",
        header: "Loại",
        cell: ({ row }) => (row.original.kind ? KIND_LABELS[row.original.kind] : "—"),
        meta: { exportValue: (row: QueueItem) => (row.kind ? KIND_LABELS[row.kind] : "") },
      },
      {
        accessorKey: "authorName",
        header: "Tác giả",
        cell: ({ row }) => row.original.authorName ?? "—",
      },
      {
        accessorKey: "updatedAt",
        header: "Chờ từ",
        cell: ({ row }) => {
          const days = daysWaiting(row.original.updatedAt);
          return (
            <span className="text-sm text-muted-foreground">
              {dateTimeFormat.format(new Date(row.original.updatedAt))}
              {/* Ba ngày là ngưỡng nhắc, không phải luật: nó chỉ nói "cái này bị bỏ quên". */}
              {days >= 3 && <span className="ml-2 text-warning">chờ {days} ngày</span>}
            </span>
          );
        },
        meta: { exportValue: (row: QueueItem) => dateTimeFormat.format(new Date(row.updatedAt)) },
      },
    ],
    [],
  );

  return (
    <ManagePage
      columns={columns}
      description="Nội dung giảng viên đã gửi, cũ trước. Mở trang kiểm tra để xem thứ tác giả thực sự gửi trước khi quyết định — từ chối hoặc yêu cầu sửa thì bắt buộc nêu lý do."
      drawer={{
        title: (row) => row.title,
        description: (row) =>
          `${row.kind ? KIND_LABELS[row.kind] : ""} · ${row.authorName ?? "không rõ tác giả"}`,
        body: (row) => (
          <>
            <dl className="mb-4 grid gap-3 text-sm">
              <Row label="Slug" value={row.slug} />
              <Row label="Loại" value={row.kind ? KIND_LABELS[row.kind] : "—"} />
              <Row label="Tác giả" value={row.authorName ?? "—"} />
              <Row label="Chờ từ" value={dateTimeFormat.format(new Date(row.updatedAt))} />
            </dl>

            {row.kind && (
              <Link
                className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm hover:bg-muted"
                href={`${KIND_ROUTES[row.kind]}/${row.id}`}
              >
                <span>
                  <span className="font-medium">Mở trang kiểm tra</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Đọc nội dung thật trước khi duyệt hoặc từ chối.
                  </span>
                </span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            )}

            {/* `key` theo id: ô lý do và bước xác nhận nằm trong state của component này, và
                không có `key` thì lý do gõ cho nội dung trước còn nguyên khi mở nội dung sau. */}
            {row.kind && (
              <ModerationActions
                id={row.id}
                key={`${row.kind}:${row.id}`}
                kind={row.kind}
                onDone={() => void load()}
                status={row.status}
              />
            )}
          </>
        ),
      }}
      emptyMessage="Không có nội dung nào đang chờ duyệt."
      error={error}
      getRowId={(row) => `${row.kind}:${row.id}`}
      icon={ShieldCheck}
      loading={loading}
      onSearchChange={setSearch}
      rows={filtered}
      search={search}
      searchPlaceholder="Tìm theo tiêu đề…"
      tabs={{
        onChange: (value) => setKind(value as ContentKind | "all"),
        options: [
          { value: "all", label: "Tất cả", count: kind === "all" ? rows.length : undefined },
          ...KINDS.map((each) => ({
            value: each,
            label: KIND_LABELS[each],
            // Chỉ đếm được khi đang xem tất cả; ở tab riêng thì hai hàng chờ kia chưa tải.
            count: kind === "all" ? rows.filter((row) => row.kind === each).length : undefined,
          })),
        ],
        value: kind,
      }}
      title="Hàng chờ duyệt"
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}
