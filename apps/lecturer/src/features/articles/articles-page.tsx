"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Send, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { RichTextEditor } from "@codementor/editor";
import { Button, ManagePage, Modal, Select, StatusBadge } from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";
import { api } from "@/lib/api";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_TONES,
  type ArticleListItem,
} from "@/features/articles/types";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Ứng dụng người học, để mở xem trước bài — bài nháp cũng xem được bởi chính tác giả. */
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

/** Bản nháp đang sửa trong drawer, nạp riêng vì danh sách không mang thân bài. */
interface Draft {
  id: string;
  excerpt: string;
  takeaway: string;
  readMinutes: string;
  contentHtml: string;
}

/**
 * Studio bài viết của giảng viên.
 *
 * Cùng màn hình và cùng luồng với trang Posts bên admin — khác đúng một điều: danh sách
 * chỉ có bài của chính người đang đăng nhập, và ràng buộc đó do learning-service áp
 * (`mustEdit`), không phải do màn này ẩn nút.
 */
export function ArticlesPage() {
  const [rows, setRows] = useState<ArticleListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.articles.mine({
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
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
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

  const loadDraft = useCallback(async (id: string) => {
    const detail = await api.articles.detail(id);
    setDraft({
      id,
      excerpt: detail.excerpt ?? "",
      takeaway: detail.takeaway ?? "",
      readMinutes: detail.readMinutes ? String(detail.readMinutes) : "",
      contentHtml: detail.contentHtml ?? "",
    });
  }, []);

  const saveDraft = useCallback(
    async (id: string) => {
      if (draft?.id !== id) return;
      await api.articles.update(id, {
        excerpt: draft.excerpt.trim() || undefined,
        takeaway: draft.takeaway.trim() || undefined,
        readMinutes: draft.readMinutes ? Number(draft.readMinutes) : undefined,
      });
      // Tiptap trả "<p></p>" cho tài liệu rỗng; ghi nó sẽ gắn `content_ref` cho một bài
      // trống — `publish()` cho qua, còn người đọc mở ra thấy trắng.
      if (draft.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0) {
        await api.articles.saveContent(id, draft.contentHtml);
      }
    },
    [draft],
  );

  const columns = useMemo<ColumnDef<ArticleListItem, unknown>[]>(
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
          <StatusBadge tone={ARTICLE_STATUS_TONES[row.original.status] ?? "neutral"}>
            {ARTICLE_STATUS_LABELS[row.original.status] ?? row.original.status}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "publishedAt",
        header: "Ngày đăng",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.publishedAt
              ? dateFormat.format(new Date(row.original.publishedAt))
              : "chưa đăng"}
          </span>
        ),
      },
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
    [],
  );

  return (
    <PageBody>
      <ManagePage
        action={
          <Button onClick={() => setCreating(true)} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Bài viết mới
          </Button>
        }
        activeFilterCount={status ? 1 : 0}
        columns={columns}
        description="Bài viết của bạn. Gửi duyệt để quản trị viên xem xét; bài được duyệt lần đầu sẽ gửi thông báo tới toàn bộ người học."
        drawer={{
          title: (row) => row.title,
          description: (row) => ARTICLE_STATUS_LABELS[row.status] ?? row.status,
          width: "wide",
          body: (row) => (
            <Editor draft={draft} key={row.id} onChange={setDraft} onLoad={loadDraft} row={row} />
          ),
          footer: (row) => (
            <>
              <a
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href={`${CLIENT_URL}/articles/${row.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Xem trước
              </a>
              <Button
                disabled={busy || draft?.id !== row.id}
                onClick={() => void act(() => saveDraft(row.id))}
                type="button"
                variant="outline"
              >
                <Save aria-hidden="true" className="size-4" />
                Lưu
              </Button>
              {/* Người viết KHÔNG tự đưa bài ra công khai — quyết định đó thuộc về admin,
                  đúng như khoá học và lộ trình. */}
              {row.status === "pending_review" ? (
                <Button
                  disabled={busy}
                  onClick={() => void act(() => api.articles.withdraw(row.id))}
                  type="button"
                  variant="ghost"
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                  Rút lại
                </Button>
              ) : (
                row.status !== "published" &&
                row.status !== "archived" && (
                  <Button
                    disabled={busy}
                    onClick={() => void act(() => api.articles.submit(row.id))}
                    type="button"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    Gửi duyệt
                  </Button>
                )
              )}
            </>
          ),
        }}
        emptyMessage="Bạn chưa có bài viết nào."
        error={error}
        filters={
          <Select
            label="Trạng thái"
            onChange={setStatus}
            options={[
              { value: "", label: "Tất cả" },
              ...ARTICLE_STATUSES.map((value) => ({
                value,
                label: ARTICLE_STATUS_LABELS[value],
              })),
            ]}
            value={status}
          />
        }
        getRowId={(row) => row.id}
        loading={loading}
        onClearFilters={() => setStatus("")}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        title="Bài viết"
      />

      <Modal onClose={() => setCreating(false)} open={creating} title="Tạo bài viết mới">
        <p className="mb-4 text-sm text-muted-foreground">
          Bài được tạo ở dạng nháp. Thêm tóm tắt và nội dung rồi mới đăng được.
        </p>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="new-title">
          Tiêu đề
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          id="new-title"
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="5 kỹ thuật giúp bạn học Spring Boot hiệu quả hơn"
          value={newTitle}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)} type="button" variant="ghost">
            Huỷ
          </Button>
          <Button
            disabled={busy || newTitle.trim().length === 0}
            onClick={() =>
              void act(async () => {
                await api.articles.create({ title: newTitle.trim() });
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
    </PageBody>
  );
}

function Editor({
  draft,
  onChange,
  onLoad,
  row,
}: {
  draft: Draft | null;
  onChange: (draft: Draft) => void;
  onLoad: (id: string) => Promise<void>;
  row: ArticleListItem;
}) {
  useEffect(() => {
    if (draft?.id !== row.id) void onLoad(row.id);
  }, [draft?.id, onLoad, row.id]);

  if (draft?.id !== row.id) {
    return <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>;
  }

  return (
    <div className="grid gap-4">
      {row.status === "changes_requested" || row.status === "rejected" ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <strong>Quản trị viên trả bài lại:</strong> {row.rejectionReason ?? "không nêu lý do"}
        </p>
      ) : null}

      <Field
        hint="Bắt buộc mới đăng được. Câu này cũng chính là nội dung thông báo gửi tới người học."
        label="Tóm tắt"
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, excerpt: event.target.value })}
          value={draft.excerpt}
        />
      </Field>

      <Field label="Điểm rút ra">
        <textarea
          className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, takeaway: event.target.value })}
          value={draft.takeaway}
        />
      </Field>

      <Field label="Thời gian đọc (phút)">
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...draft, readMinutes: event.target.value.replace(/\D/g, "") })
          }
          value={draft.readMinutes}
        />
      </Field>

      <Field label="Nội dung">
        <RichTextEditor
          onChange={(html) => onChange({ ...draft, contentHtml: html })}
          placeholder="Viết nội dung bài viết…"
          value={draft.contentHtml}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
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
