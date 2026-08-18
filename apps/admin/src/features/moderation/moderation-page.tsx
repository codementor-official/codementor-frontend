"use client";

import { useMemo, useState } from "react";
import { CheckCheck, PencilLine, ShieldCheck, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi } from "@/lib/api";
import { ContentPreview } from "./content-preview";
import { useModerationQueue } from "./queue-provider";
import { CONTENT_KINDS, KINDS, type ContentKind, type ModerationDecision, type QueueItem } from "./types";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Quá số ngày này thì một mục đang chờ không còn là "đang xử lý" nữa, nó là bị bỏ quên.
 * Người gửi không có cách nào biết điều đó, nên hàng chờ phải tự nói ra.
 */
const STALE_DAYS = 3;

export function ModerationPage() {
  const request = useAdminApi();
  const { items, countByKind, total, loading, failed, refresh } = useModerationQueue();

  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [search, setSearch] = useState("");
  const [onlyStale, setOnlyStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // Đọc đồng hồ MỘT lần, trong initializer của state chứ không giữa thân render: `Date.now()`
  // lúc render là hàm không thuần — hai lần render liền nhau cho hai mốc khác nhau, và
  // "mục này chờ quá lâu chưa" sẽ đổi câu trả lời giữa chừng mà không có gì thay đổi thật.
  const [staleBefore] = useState(() => Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (onlyStale && new Date(item.updatedAt).getTime() > staleBefore) return false;
      if (!needle) return true;
      // Tìm cả theo tác giả, không chỉ tiêu đề: câu hỏi hay gặp nhất khi mở hàng chờ là
      // "người này gửi những gì", chứ không phải "bài tên gì".
      return (
        item.title.toLowerCase().includes(needle) ||
        item.slug.toLowerCase().includes(needle) ||
        (item.authorName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, kind, onlyStale, search, staleBefore]);

  const decide = async (item: QueueItem, decision: ModerationDecision) => {
    if ((decision === "reject" || decision === "request_changes") && !reason.trim()) {
      setError("Phải nêu lý do khi từ chối hoặc yêu cầu sửa — tác giả sẽ đọc đúng câu này.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await moderationApi.decide(request, item.kind, item.id, decision, reason.trim() || undefined);
      setReason("");
      await refresh();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<QueueItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Nội dung",
        cell: ({ row }) => {
          const Icon = KINDS[row.original.kind].icon;
          return (
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "kind",
        header: "Loại",
        cell: ({ row }) => KINDS[row.original.kind].label,
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
          const waited = Date.now() - new Date(row.original.updatedAt).getTime();
          const days = Math.floor(waited / (24 * 60 * 60 * 1000));
          return (
            <div>
              <p className="text-sm">{dateFormat.format(new Date(row.original.updatedAt))}</p>
              {/* Con số quan trọng ở hàng chờ không phải "lúc nào" mà là "bao lâu rồi". */}
              <p
                className={`text-xs ${days >= STALE_DAYS ? "font-medium text-destructive" : "text-muted-foreground"}`}
              >
                {days === 0 ? "hôm nay" : `${days} ngày`}
              </p>
            </div>
          );
        },
      },
    ],
    [],
  );

  const staleCount = items.filter(
    (item) => new Date(item.updatedAt).getTime() <= staleBefore,
  ).length;

  return (
    <ManagePage
      activeFilterCount={onlyStale ? 1 : 0}
      columns={columns}
      description={
        total === 0
          ? "Không còn gì chờ bạn xem."
          : `${total} mục đang chờ, cũ trước. Mở một mục ra để xem trước nội dung rồi quyết.`
      }
      drawer={{
        title: (row) => row.title,
        description: (row) =>
          `${KINDS[row.kind].label} · ${row.authorName ?? "không rõ tác giả"} · gửi lúc ${dateFormat.format(new Date(row.updatedAt))}`,
        width: "wide",
        body: (row) => (
          <div className="grid gap-4">
            <ContentPreview item={row} />

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="reason">
                Lý do
              </label>
              <textarea
                className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                id="reason"
                onChange={(event) => setReason(event.target.value)}
                placeholder="Bắt buộc khi từ chối hoặc yêu cầu sửa. Tác giả sẽ đọc đúng câu này trong thông báo."
                value={reason}
              />
            </div>
          </div>
        ),
        footer: (row) => (
          <>
            <Button
              disabled={busy}
              onClick={() => void decide(row, "request_changes")}
              type="button"
              variant="outline"
            >
              <PencilLine aria-hidden="true" className="size-4" />
              Yêu cầu sửa
            </Button>
            <Button disabled={busy} onClick={() => void decide(row, "reject")} type="button" variant="ghost">
              <XCircle aria-hidden="true" className="size-4" />
              Từ chối
            </Button>
            <Button disabled={busy} onClick={() => void decide(row, "approve")} type="button">
              <CheckCheck aria-hidden="true" className="size-4" />
              Duyệt
            </Button>
          </>
        ),
      }}
      emptyMessage={
        items.length > 0
          ? "Không có mục nào khớp bộ lọc."
          : "Không có nội dung nào đang chờ duyệt."
      }
      error={
        error ??
        (failed.length > 0 ? `Không tải được hàng chờ: ${failed.join(", ")}` : null)
      }
      filters={
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={onlyStale}
            className="size-4 accent-primary"
            onChange={(event) => setOnlyStale(event.target.checked)}
            type="checkbox"
          />
          Chỉ mục chờ quá {STALE_DAYS} ngày
          {staleCount > 0 && (
            <StatusBadge tone="danger">{staleCount}</StatusBadge>
          )}
        </label>
      }
      getRowId={(row) => `${row.kind}:${row.id}`}
      icon={ShieldCheck}
      loading={loading}
      onClearFilters={() => setOnlyStale(false)}
      onSearchChange={setSearch}
      rows={filtered}
      search={search}
      searchPlaceholder="Tìm theo tiêu đề, slug hoặc tác giả…"
      tabs={{
        value: kind,
        onChange: (value) => setKind(value as ContentKind | "all"),
        // Số ngay trên tab: nếu không có nó, người dùng phải bấm qua từng loại mới biết
        // loại nào đang có việc.
        options: [
          { value: "all", label: total > 0 ? `Tất cả (${total})` : "Tất cả" },
          ...CONTENT_KINDS.map((each) => ({
            value: each,
            label: countByKind[each] > 0 ? `${KINDS[each].label} (${countByKind[each]})` : KINDS[each].label,
          })),
        ],
      }}
      title="Hàng chờ duyệt"
    />
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
