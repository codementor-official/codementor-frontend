"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCheck, ShieldCheck, Undo2, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ConfirmButton, ManagePage, RejectDialogButton, Select, StatusBadge } from "@codementor/ui";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, type ContentStatus } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi } from "@/lib/api";
import { ContentPreview } from "./content-preview";
import { ModerationHistory } from "./moderation-history";
import { useModerationQueue } from "./queue-provider";
import {
  CONTENT_KINDS,
  KINDS,
  MODERATION_TRAYS,
  TRAY_META,
  type ContentKind,
  type ModerationDecision,
  type ModerationTray,
  type QueueItem,
} from "./types";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Quá số ngày này thì một mục đang chờ không còn là "đang xử lý" nữa, nó là bị bỏ quên.
 * Người gửi không có cách nào biết điều đó, nên hàng chờ phải tự nói ra.
 */
const STALE_DAYS = 3;

export function ModerationPage() {
  const request = useAdminApi();
  const { pendingByKind, pendingTotal, refreshPending } = useModerationQueue();

  const [tray, setTray] = useState<ModerationTray>("pending");
  const [kind, setKind] = useState<ContentKind | "">("");
  const [search, setSearch] = useState("");
  const [onlyStale, setOnlyStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<QueueItem[]>([]);
  /** Đếm riêng cho badge khay "Xin gỡ" — phải đúng cả khi đang đứng ở khay khác. */
  const [removalCount, setRemovalCount] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Bốn loại nội dung × các trạng thái của khay đang chọn, gộp ở đây.
   *
   * Không có endpoint gộp ở backend: một endpoint như thế buộc một service đọc bảng của
   * service khác. `allSettled` chứ không `all` — một service chết thì phần còn lại vẫn
   * phải xem được, và tên hàng chờ hỏng phải hiện ra chứ không lặng lẽ thành "trống".
   */
  const load = useCallback(async () => {
    setLoading(true);
    const jobs = CONTENT_KINDS.flatMap((each) =>
      TRAY_META[tray].statuses.map((status) => ({
        kind: each,
        // Khay "Đang chờ" gọi không kèm `status`: đó là hành vi mặc định của cả bốn
        // endpoint, và nó cũng là đường duy nhất hoạt động trước khi có màn này.
        status: tray === "pending" ? undefined : status,
      })),
    );

    const results = await Promise.allSettled(
      jobs.map((job) => moderationApi.queue(request, job.kind, job.status)),
    );

    const collected: QueueItem[] = [];
    const broken = new Set<string>();
    results.forEach((result, index) => {
      const job = jobs[index];
      if (result.status === "fulfilled") {
        collected.push(...result.value.items.map((item) => ({ ...item, kind: job.kind })));
      } else {
        broken.add(KINDS[job.kind].label);
      }
    });

    // Đang chờ thì cũ trước — ai gửi sớm được xem trước. Hai khay lịch sử thì MỚI trước:
    // ở đó câu hỏi luôn là "vừa nãy tôi bấm gì", không phải "cái nào chờ lâu nhất".
    collected.sort((a, b) =>
      tray === "pending"
        ? a.updatedAt.localeCompare(b.updatedAt)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
    setItems(collected);
    setFailed([...broken]);
    setLoading(false);
  }, [request, tray]);

  // Một lượt đọc riêng cho badge "Xin gỡ": nội dung xin gỡ vẫn `published`, nên không có
  // cách nào suy ra nó từ hàng chờ `pending_review` mà thanh bên đang đếm.
  const countRemovals = useCallback(async () => {
    const results = await Promise.allSettled(
      CONTENT_KINDS.map((each) => moderationApi.queue(request, each, "published")),
    );
    setRemovalCount(
      results.reduce(
        (total, r) =>
          total + (r.status === "fulfilled" ? r.value.items.filter((i) => i.removalRequested).length : 0),
        0,
      ),
    );
  }, [request]);

  useEffect(() => {
    void countRemovals();
  }, [countRemovals]);

  // Hàng chờ sống ở provider gốc của cả ứng dụng nên nó không refetch khi điều hướng
  // client-side TỚI trang này lần nữa — bấm vào một thông báo "có bài mới cần duyệt" rồi
  // bị đưa tới đây với đúng dữ liệu cũ đã tải từ trước là chỗ hỏng đó.
  useEffect(() => {
    void load();
  }, [load]);

  // Đọc đồng hồ MỘT lần, trong initializer của state chứ không giữa thân render: `Date.now()`
  // lúc render là hàm không thuần — hai lần render liền nhau cho hai mốc khác nhau, và
  // "mục này chờ quá lâu chưa" sẽ đổi câu trả lời giữa chừng mà không có gì thay đổi thật.
  const [staleBefore] = useState(() => Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      // Hai khay dùng chung một lượt đọc (`published`), tách nhau bằng đúng cờ này. Bỏ
      // vế thứ hai thì một khoá học đang chờ quyết định gỡ vẫn nằm lẫn trong "Đã duyệt".
      if (tray === "removal" && !item.removalRequested) return false;
      if (tray === "approved" && item.removalRequested) return false;
      if (kind !== "" && item.kind !== kind) return false;
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
  }, [items, kind, onlyStale, search, staleBefore, tray]);

  const decide = async (item: QueueItem, decision: ModerationDecision, reason?: string) => {
    setBusy(true);
    setError(null);
    try {
      await moderationApi.decide(request, item.kind, item.id, decision, reason?.trim() || undefined);
      // Hai lần đọc, hai mục đích: `load` vẽ lại khay đang xem, `refreshPending` sửa con
      // số đỏ trên thanh bên. Mục vừa quyết rời khỏi khay này và rơi vào khay khác, nên
      // bỏ một trong hai là để lại một con số nói dối trên màn hình.
      await Promise.all([load(), refreshPending(), countRemovals()]);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  /** Admin từ chối yêu cầu xin gỡ — nội dung giữ nguyên `published`, tác giả nhận thông báo. */
  const denyRemoval = async (item: QueueItem) => {
    setBusy(true);
    setError(null);
    try {
      await moderationApi.denyRemoval(request, item.kind, item.id);
      await Promise.all([load(), refreshPending(), countRemovals()]);
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
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status as ContentStatus;
          return (
            <StatusBadge tone={CONTENT_STATUS_TONES[status] ?? "neutral"}>
              {CONTENT_STATUS_LABELS[status] ?? status}
            </StatusBadge>
          );
        },
      },
      {
        accessorKey: "authorName",
        header: "Tác giả",
        cell: ({ row }) => row.original.authorName ?? "—",
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => {
          const waited = Date.now() - new Date(row.original.updatedAt).getTime();
          const days = Math.floor(waited / (24 * 60 * 60 * 1000));
          return (
            <div>
              <p className="text-sm">{dateFormat.format(new Date(row.original.updatedAt))}</p>
              {/* Con số quan trọng ở hàng chờ không phải "lúc nào" mà là "bao lâu rồi". */}
              <p
                className={`text-xs ${days >= STALE_DAYS && tray === "pending" ? "font-medium text-destructive" : "text-muted-foreground"}`}
              >
                {days === 0 ? "hôm nay" : `${days} ngày trước`}
              </p>
            </div>
          );
        },
      },
    ],
    [tray],
  );

  const staleCount = items.filter(
    (item) => new Date(item.updatedAt).getTime() <= staleBefore,
  ).length;

  return (
    <ManagePage
      activeFilterCount={(onlyStale ? 1 : 0) + (kind === "" ? 0 : 1)}
      columns={columns}
      description={DESCRIPTIONS[tray](filtered.length)}
      drawer={{
        title: (row) => row.title,
        description: (row) =>
          `${KINDS[row.kind].label} · ${row.authorName ?? "không rõ tác giả"} · cập nhật ${dateFormat.format(new Date(row.updatedAt))}`,
        width: "wide",
        // Không còn ô "Lý do" thường trực: nó chỉ có nghĩa khi từ chối hoặc yêu cầu sửa,
        // và trước đây choán một khối cố định trên MỌI lượt mở — kể cả lúc chỉ để xem rồi
        // duyệt. Ngăn này giờ chỉ còn bản xem trước, được hiện trọn vẹn.
        body: (row) => (
          <>
            <ContentPreview item={row} />
            <ModerationHistory id={row.id} kind={row.kind} />
          </>
        ),
        footer: (row) =>
          tray === "removal" ? (
            /**
             * Hai kết cục của một yêu cầu xin gỡ, và cả hai đều báo lại cho tác giả.
             * `archive` cần lý do (admin phải nói vì sao chấp nhận hoặc gỡ), `deny-removal`
             * thì không — nội dung không đổi gì cả.
             */
            <>
              <Button
                disabled={busy}
                onClick={() => void denyRemoval(row)}
                type="button"
                variant="ghost"
              >
                <XCircle aria-hidden="true" className="size-4" />
                Từ chối yêu cầu
              </Button>
              <RejectDialogButton
                decisions={[{ value: "archive", label: "Gỡ khỏi danh mục" }]}
                description={`"${row.title}"`}
                disabled={busy}
                onConfirm={(decision, reason) => decide(row, decision as ModerationDecision, reason)}
                placeholder="Bắt buộc. Tác giả sẽ đọc đúng câu này trong thông báo."
                title="Duyệt yêu cầu gỡ"
                variant="danger"
              >
                <Archive aria-hidden="true" className="size-4" />
                Duyệt gỡ
              </RejectDialogButton>
            </>
          ) : tray === "pending" ? (
            <>
              <RejectDialogButton
                decisions={[
                  { value: "request_changes", label: "Yêu cầu sửa" },
                  { value: "reject", label: "Từ chối" },
                ]}
                description={`"${row.title}"`}
                disabled={busy}
                onConfirm={(decision, reason) => decide(row, decision as ModerationDecision, reason)}
                placeholder="Bắt buộc. Tác giả sẽ đọc đúng câu này trong thông báo."
                title="Từ chối / yêu cầu sửa"
                variant="ghost"
              >
                <XCircle aria-hidden="true" className="size-4" />
                Từ chối / Yêu cầu sửa
              </RejectDialogButton>
              <Button disabled={busy} onClick={() => void decide(row, "approve")} type="button">
                <CheckCheck aria-hidden="true" className="size-4" />
                Duyệt
              </Button>
            </>
          ) : (
            /**
             * Đường lùi cho một quyết định đã ra. Xác nhận trước khi chạy vì nó có hệ quả
             * thật: hoàn tác một lần duyệt sẽ GỠ nội dung khỏi danh mục công khai, và học
             * viên đang xem sẽ mất quyền truy cập ngay lập tức.
             */
            <ConfirmButton
              confirmLabel="Đưa về hàng chờ"
              description={
                tray === "approved"
                  ? `“${row.title}” sẽ bị gỡ khỏi danh mục công khai và quay lại hàng chờ để bạn xem lại. Nội dung không bị xoá, và thao tác này được ghi vào nhật ký.`
                  : `“${row.title}” sẽ quay lại hàng chờ để bạn xem lại. Lý do từ chối cũ sẽ được xoá, và thao tác này được ghi vào nhật ký.`
              }
              disabled={busy}
              onConfirm={() => void decide(row, "revert")}
              title="Hoàn tác quyết định này?"
              type="button"
              // Đỏ chỉ khi thật sự có gì để mất: lùi một lần DUYỆT sẽ gỡ nội dung đang
              // công khai xuống. Lùi một lần từ chối thì không ảnh hưởng học viên nào.
              variant={tray === "approved" ? "danger" : "outline"}
            >
              <Undo2 aria-hidden="true" className="size-4" />
              Hoàn tác về hàng chờ
            </ConfirmButton>
          ),
      }}
      emptyMessage={
        items.length > 0 ? "Không có mục nào khớp bộ lọc." : EMPTY_MESSAGES[tray]
      }
      error={error ?? (failed.length > 0 ? `Không tải được: ${failed.join(", ")}` : null)}
      filters={
        <div className="grid gap-3">
          <Select
            label="Loại nội dung"
            onChange={(value) => setKind(value as ContentKind | "")}
            options={[
              { value: "", label: "Tất cả" },
              ...CONTENT_KINDS.map((each) => ({ value: each, label: KINDS[each].label })),
            ]}
            value={kind}
          />
          {/* Chỉ có nghĩa ở khay đang chờ: "chờ quá 3 ngày" nói về việc chưa ai xử lý, còn
              ở hai khay lịch sử thì mọi dòng đều đã được xử lý xong. */}
          {tray === "pending" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={onlyStale}
                className="size-4 accent-primary"
                onChange={(event) => setOnlyStale(event.target.checked)}
                type="checkbox"
              />
              Chỉ mục chờ quá {STALE_DAYS} ngày
              {staleCount > 0 && <StatusBadge tone="danger">{staleCount}</StatusBadge>}
            </label>
          )}
        </div>
      }
      getRowId={(row) => `${row.kind}:${row.id}`}
      icon={ShieldCheck}
      loading={loading}
      onClearFilters={() => {
        setOnlyStale(false);
        setKind("");
      }}
      onRefresh={() => Promise.all([load(), refreshPending(), countRemovals()])}
      onSearchChange={setSearch}
      rows={filtered}
      search={search}
      searchPlaceholder="Tìm theo tiêu đề, slug hoặc tác giả…"
      tabs={{
        value: tray,
        onChange: (value) => setTray(value as ModerationTray),
        // Số chỉ hiện trên tab "Đang chờ": đó là số duy nhất có nghĩa vận hành. Đếm cả
        // "đã duyệt" là hiện tổng số nội dung từng được duyệt trên toàn hệ thống, một con
        // số chỉ lớn dần và không nói được điều gì.
        // `count` là trường riêng của `SegmentedTabs`, KHÔNG nhét vào nhãn: nhãn đổi độ
        // dài khi con số xuất hiện là đúng thứ làm cả dải tab nhảy chỗ mỗi lần bấm.
        // Chỉ hai khay có việc phải xử lý mới đếm — "đã duyệt"/"đã từ chối" là lịch sử,
        // một con số chỉ lớn dần ở đó không nói lên điều gì.
        options: MODERATION_TRAYS.map((each) => ({
          value: each,
          label: TRAY_META[each].label,
          ...(each === "pending" ? { count: pendingTotal } : {}),
          ...(each === "removal" ? { count: removalCount } : {}),
        })),
      }}
      title="Hàng chờ duyệt"
    />
  );
}

const DESCRIPTIONS: Record<ModerationTray, (count: number) => string> = {
  pending: (count) =>
    count === 0
      ? "Không còn gì chờ bạn xem."
      : `${count} mục đang chờ, cũ trước. Mở một mục ra để xem trước nội dung rồi quyết.`,
  removal: (count) =>
    count === 0
      ? "Không có yêu cầu gỡ nào đang chờ."
      : `${count} nội dung đang công khai được tác giả xin gỡ. Đọc lý do rồi quyết định gỡ hay giữ.`,
  approved: () =>
    "Những gì bạn đã duyệt, mới nhất trước. Bấm vào một mục để xem lịch sử, hoặc hoàn tác nếu lỡ duyệt nhầm.",
  rejected: () =>
    "Những gì bạn đã từ chối hoặc yêu cầu sửa, mới nhất trước. Hoàn tác để đưa lại về hàng chờ.",
};

const EMPTY_MESSAGES: Record<ModerationTray, string> = {
  pending: "Không có nội dung nào đang chờ duyệt.",
  removal: "Không có yêu cầu gỡ nội dung nào đang chờ.",
  approved: "Chưa có nội dung nào được duyệt.",
  rejected: "Chưa có nội dung nào bị từ chối.",
};

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
