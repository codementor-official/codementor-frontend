"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCheck, ExternalLink, Newspaper, Plus, RotateCcw, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { Button, ManagePage, Modal, ReasonButton, RejectDialogButton, Select, StatusBadge, useToast } from "@codementor/ui";
import { ContentPreview } from "@/features/moderation/content-preview";
import { useAdminApi } from "@/features/auth/admin-api";
import { articlesApi, type AdminArticle } from "@/lib/api";
import type { ModerationDecision } from "@/features/moderation/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  changes_requested: "Cần sửa",
  rejected: "Bị từ chối",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

const STATUS_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  pending_review: "warning",
  changes_requested: "warning",
  rejected: "danger",
  published: "success",
  archived: "neutral",
};

/** Cùng 5 trạng thái mà trang Khoá học/Lộ trình/Bài code lọc theo — bản nháp chưa gửi
 * của giảng viên không có gì để admin xem nên không đưa vào đây. */
const STATUS_OPTIONS = ["pending_review", "changes_requested", "rejected", "published", "archived"] as const;

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Địa chỉ ứng dụng người học, để mở xem trước bài viết.
 *
 * Bài chưa đăng vẫn xem được: `GET /articles/:slug` cho admin đọc mọi trạng thái, nên
 * người biên tập kiểm tra được trước khi bấm đăng.
 */
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

export function ArticlesPage() {
  const request = useAdminApi();
  const toast = useToast();
  const [rows, setRows] = useState<AdminArticle[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await articlesApi.list(request, {
        q: search.trim() || undefined,
        status: status || undefined,
        limit: 25,
      });
      setRows(page.items);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, [request, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (cause) {
      // Kết quả một thao tác đi bằng toast. Dải lỗi dưới tiêu đề chỉ còn cho lỗi tải danh
      // sách — thứ vẫn đang đúng lúc người dùng ngước lên đọc.
      toast.error(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const decide = (id: string, decision: ModerationDecision, reason?: string) =>
    act(() => articlesApi.moderate(request, id, decision, reason));

  const columns = useMemo<ColumnDef<AdminArticle, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài viết",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONES[row.original.status] ?? "neutral"}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </StatusBadge>
        ),
        meta: { exportValue: (row) => STATUS_LABELS[row.status] ?? row.status },
      },
      {
        accessorKey: "authorName",
        header: "Người tạo",
        cell: ({ row }) => row.original.authorName ?? "—",
      },
      {
        accessorKey: "publishedAt",
        header: "Ngày đăng",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.publishedAt ? dateFormat.format(new Date(row.original.publishedAt)) : "chưa đăng"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <ManagePage
        action={
          <Button onClick={() => setCreating(true)} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Bài viết mới
          </Button>
        }
        activeFilterCount={status ? 1 : 0}
        columns={columns}
        description="Bài viết chờ duyệt và đã đăng. Duyệt lần đầu sẽ gửi thông báo tới toàn bộ người học; duyệt lại bài đã đăng thì không."
        drawer={{
          title: (row) => row.title,
          description: (row) => `${STATUS_LABELS[row.status] ?? row.status} · ${row.authorName ?? "không rõ"}`,
          body: (row) => <ContentPreview item={{ ...row, kind: "articles" }} />,
          footer: (row) => (
            <>
              {/* Thẻ <a> chứ không phải Button: Button ở @codementor/ui chỉ render
                  <button>, và mở tab mới là việc của liên kết. */}
              {row.status === "published" && (
                <a
                  className="mr-auto inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  href={`${CLIENT_URL}/articles/${row.slug}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Xem trên client
                </a>
              )}
              {row.status === "pending_review" && (
                <>
                  <RejectDialogButton
                    decisions={[
                      { value: "request_changes", label: "Yêu cầu sửa" },
                      { value: "reject", label: "Từ chối" },
                    ]}
                    description="Người viết sẽ nhận được đúng lý do này."
                    disabled={busy}
                    onConfirm={(decision, reason) => decide(row.id, decision as ModerationDecision, reason)}
                    placeholder="Vì sao cần sửa hoặc từ chối?"
                    title="Từ chối / yêu cầu sửa bài viết"
                    variant="ghost"
                  >
                    <XCircle aria-hidden="true" className="size-4" />
                    Từ chối / Yêu cầu sửa
                  </RejectDialogButton>
                  <Button disabled={busy} onClick={() => void decide(row.id, "approve")} type="button">
                    <CheckCheck aria-hidden="true" className="size-4" />
                    Duyệt & đăng
                  </Button>
                </>
              )}
              {row.status === "published" && (
                <ReasonButton
                  confirmLabel="Thu hồi"
                  description="Bài viết sẽ rời khỏi trang công khai. Người viết sẽ nhận được đúng lý do này."
                  disabled={busy}
                  onConfirm={(reason) => decide(row.id, "archive", reason)}
                  placeholder="Vì sao thu hồi bài viết đang công khai này?"
                  title="Thu hồi bài viết đang công khai?"
                  variant="ghost"
                >
                  <Archive aria-hidden="true" className="size-4" />
                  Thu hồi
                </ReasonButton>
              )}
              {row.status === "archived" && (
                <Button
                  disabled={busy}
                  onClick={() => void decide(row.id, "restore")}
                  type="button"
                  variant="outline"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Khôi phục
                </Button>
              )}
            </>
          ),
        }}
        emptyMessage="Chưa có bài viết nào."
        error={error}
        filters={
          <Select
            label="Trạng thái"
            onChange={setStatus}
            options={[{ value: "", label: "Mọi trạng thái" }, ...STATUS_OPTIONS.map((value) => ({ value, label: STATUS_LABELS[value] }))]}
            value={status}
          />
        }
        getRowId={(row) => row.id}
        loading={loading}
        onClearFilters={() => setStatus("")}
        onRefresh={load}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        icon={Newspaper}
        title="Bài viết"
      />

      <Modal
        onClose={() => setCreating(false)}
        open={creating}
        title="Tạo bài viết mới"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Bài được tạo ở dạng nháp. Thêm tóm tắt và nội dung rồi mới đăng được.
        </p>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
          Tiêu đề
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          id="title"
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="5 kỹ thuật giúp bạn học Spring Boot hiệu quả hơn"
          value={newTitle}
        />
        {newTitle.trim().length > 200 && (
          <p className="mt-1.5 text-sm text-destructive" role="alert">
            Tiêu đề tối đa 200 ký tự
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)} type="button" variant="ghost">
            Huỷ
          </Button>
          <Button
            disabled={busy || newTitle.trim().length === 0 || newTitle.trim().length > 200}
            onClick={() =>
              void act(async () => {
                await articlesApi.create(request, { title: newTitle.trim() });
                setNewTitle("");
                setCreating(false);
              })
            }
            type="button"
          >
            Tạo bản nháp
          </Button>
        </div>
      </Modal>
    </>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
