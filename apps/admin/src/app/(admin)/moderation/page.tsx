"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, PencilLine, ShieldCheck, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, SegmentedTabs } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import {
  moderationApi,
  type ContentKind,
  type ModerationDecision,
  type QueueItem,
} from "@/lib/api";

const KINDS: { value: ContentKind | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "exercises", label: "Bài code" },
  { value: "courses", label: "Khóa học" },
  { value: "roadmaps", label: "Lộ trình" },
];

const KIND_LABELS: Record<ContentKind, string> = {
  exercises: "Bài code",
  courses: "Khóa học",
  roadmaps: "Lộ trình",
};

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ModerationPage() {
  // Client của BFF: baseUrl là `/api/backend`, token do route handler gắn phía server
  // nên trình duyệt không bao giờ cầm nó.
  const request = useAdminApi();
  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

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
    const wanted: ContentKind[] = kind === "all" ? ["exercises", "courses", "roadmaps"] : [kind];

    const results = await Promise.allSettled(wanted.map((each) => moderationApi.queue(request, each)));
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

  const decide = async (item: QueueItem, decision: ModerationDecision) => {
    if ((decision === "reject" || decision === "request_changes") && !reason.trim()) {
      setError("Phải nêu lý do khi từ chối hoặc yêu cầu sửa.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await moderationApi.decide(request, item.kind!, item.id, decision, reason.trim() || undefined);
      setReason("");
      await load();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

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
      },
      {
        accessorKey: "authorName",
        header: "Tác giả",
        cell: ({ row }) => row.original.authorName ?? "—",
      },
      {
        accessorKey: "updatedAt",
        header: "Chờ từ",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-4">
        <SegmentedTabs
          onChange={(value) => setKind(value as ContentKind | "all")}
          options={KINDS}
          value={kind}
        />
      </div>

      <ManagePage
        columns={columns}
        description="Nội dung giảng viên đã gửi, cũ trước. Từ chối hoặc yêu cầu sửa thì bắt buộc nêu lý do."
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${row.kind ? KIND_LABELS[row.kind] : ""} · ${row.authorName ?? "không rõ tác giả"}`,
          body: (row) => (
            <>
              <dl className="mb-5 grid gap-3 text-sm">
                <Row label="Slug" value={row.slug} />
                <Row label="Loại" value={row.kind ? KIND_LABELS[row.kind] : "—"} />
                <Row label="Tác giả" value={row.authorName ?? "—"} />
                <Row label="Chờ từ" value={dateFormat.format(new Date(row.updatedAt))} />
              </dl>

              <label className="mb-1.5 block text-sm font-medium" htmlFor="reason">
                Lý do
              </label>
              <textarea
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                id="reason"
                onChange={(event) => setReason(event.target.value)}
                placeholder="Bắt buộc khi từ chối hoặc yêu cầu sửa. Tác giả sẽ đọc đúng câu này."
                value={reason}
              />
            </>
          ),
          footer: (row) => (
            <>
              <Button
                disabled={busy}
                onClick={() => decide(row, "request_changes")}
                type="button"
                variant="outline"
              >
                <PencilLine aria-hidden="true" className="size-4" />
                Yêu cầu sửa
              </Button>
              <Button disabled={busy} onClick={() => decide(row, "reject")} type="button" variant="ghost">
                <XCircle aria-hidden="true" className="size-4" />
                Từ chối
              </Button>
              <Button disabled={busy} onClick={() => decide(row, "approve")} type="button">
                <CheckCheck aria-hidden="true" className="size-4" />
                Duyệt
              </Button>
            </>
          ),
        }}
        emptyMessage="Không có nội dung nào đang chờ duyệt."
        error={error}
        getRowId={(row) => `${row.kind}:${row.id}`}
        loading={loading}
        onSearchChange={setSearch}
        rows={filtered}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề…"
        icon={ShieldCheck}
        title="Kiểm duyệt"
      />
    </>
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

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
