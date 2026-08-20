"use client";

import { ReviewFlag, ReviewNotice, RemovalPendingNotice } from "@/components/page/review-notice";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ExternalLink,
  Eye,
  FilePlus2,
  Newspaper,
  Plus,
  RotateCcw,
  Save,
  Send,
  Undo2,
  X,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { RichTextEditor } from "@codementor/editor";
import { Button, ManagePage, Modal, ReasonButton, Select, StatusBadge } from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";
import { api, type Tag } from "@/lib/api";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_TONES,
  type ArticleListItem,
} from "@/features/articles/types";
import { integer, maxLength } from "@codementor/utils";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const timeFormat = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" });

/** Ứng dụng người học, để mở xem trước bài — bài nháp cũng xem được bởi chính tác giả. */
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

/** Bản nháp đang sửa trong drawer, nạp riêng vì danh sách không mang thân bài. */
interface Draft {
  id: string;
  excerpt: string;
  takeaway: string;
  readMinutes: string;
  /** "" = chưa chọn chủ đề. */
  tagId: string;
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [previewing, setPreviewing] = useState(false);
  // Bấm Lưu xong thì màn hình không đổi gì cả — drawer vẫn nguyên, danh sách vẫn nguyên —
  // nên người viết tưởng nút hỏng dù dữ liệu đã ghi. Đây là dấu hiệu rằng nó đã chạy.
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Nạp một lần cho cả trang: danh sách chủ đề đổi rất hiếm, và mỗi lần mở một bài mà gọi
  // lại thì drawer phải chờ thêm một vòng mạng chỉ để vẽ đúng ô select đó.
  useEffect(() => {
    void api.tags
      .list()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

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
    // Mở sang bài khác thì dấu "đã lưu" của bài trước không còn đúng nữa.
    setSavedAt(null);
    const detail = await api.articles.detail(id);
    setDraft({
      id,
      excerpt: detail.excerpt ?? "",
      takeaway: detail.takeaway ?? "",
      readMinutes: detail.readMinutes ? String(detail.readMinutes) : "",
      tagId: detail.tagId ?? "",
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
        // `undefined` = không đụng tới. Backend chưa có đường gỡ chủ đề đã gắn; bỏ chọn
        // chỉ giữ nguyên chủ đề cũ chứ không xoá — chưa ai cần xoá nên chưa mở đường đó.
        tagId: draft.tagId || undefined,
      });
      // Tiptap trả "<p></p>" cho tài liệu rỗng; ghi nó sẽ gắn `content_ref` cho một bài
      // trống — `publish()` cho qua, còn người đọc mở ra thấy trắng.
      if (draft.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0) {
        await api.articles.saveContent(id, draft.contentHtml);
      }
      setSavedAt(new Date());
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
            <ReviewFlag status={row.original.status} />
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
        icon={Newspaper}
        columns={columns}
        description="Bài viết của bạn. Gửi duyệt để quản trị viên xem xét; bài được duyệt lần đầu sẽ gửi thông báo tới toàn bộ người học."
        drawer={{
          title: (row) => row.title,
          description: (row) => ARTICLE_STATUS_LABELS[row.status] ?? row.status,
          width: "wide",
          body: (row) => (
            <Editor
              draft={draft}
              key={row.id}
              onChange={setDraft}
              onLoad={loadDraft}
              row={row}
              tags={tags}
            />
          ),
          footer: (row) => (
            <>
              {savedAt !== null && draft?.id === row.id && (
                <span
                  aria-live="polite"
                  className="mr-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Check aria-hidden="true" className="size-3.5 text-success" />
                  Đã lưu lúc {timeFormat.format(savedAt)}
                </span>
              )}
              {/* Xem trước dựng từ bản nháp ĐANG SỬA, ngay tại chỗ. Trước đây nút này mở
                  sang ứng dụng người học — với bài chưa đăng thì trang đó trả 404, và kể
                  cả bài đã đăng thì nó hiện bản đã lưu chứ không phải bản đang gõ. */}
              <Button
                disabled={draft?.id !== row.id}
                onClick={() => setPreviewing(true)}
                type="button"
                variant="outline"
              >
                <Eye aria-hidden="true" className="size-4" />
                Xem trước
              </Button>
              {row.status === "published" && (
                <a
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  href={`${CLIENT_URL}/articles/${row.slug}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Xem trên client
                </a>
              )}
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
                  đúng như khoá học và lộ trình. Bài đã đăng vẫn sửa và gửi duyệt lại được:
                  bản chỉnh chỉ thay bản đang sống sau khi admin duyệt lại, không âm thầm
                  cập nhật một bài đang công khai mà không ai xem lại. */}
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
              ) : row.status === "archived" ? (
                <Button
                  disabled={busy}
                  onClick={() => void act(() => api.articles.restore(row.id))}
                  type="button"
                  variant="outline"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Khôi phục
                </Button>
              ) : (
                <>
                  <Button
                    disabled={busy}
                    onClick={() => void act(() => api.articles.submit(row.id))}
                    type="button"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    {row.status === "published" ? "Gửi duyệt lại" : "Gửi duyệt"}
                  </Button>
                  {row.status === "published" && (
                    <ReasonButton
                      confirmLabel="Gửi yêu cầu"
                      description="Bài viết vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
                      disabled={busy}
                      onConfirm={(reason) => act(() => api.articles.requestRemoval(row.id, reason))}
                      placeholder="Vì sao bạn muốn gỡ bài viết này xuống?"
                      title="Xin gỡ bài viết đang công khai?"
                    >
                      <Archive aria-hidden="true" className="size-4" />
                      Xin gỡ xuống
                    </ReasonButton>
                  )}
                </>
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
        onRefresh={load}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        title="Bài viết"
      />

      {/* Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản xem trước và bản người
          học đọc được dựng từ đúng một bộ luật trình bày. */}
      <Modal
        onClose={() => setPreviewing(false)}
        open={previewing}
        title="Xem trước bài viết"
        width="lg"
      >
        <article>
          <h1 className="text-2xl leading-snug font-bold">
            {rows.find((row) => row.id === draft?.id)?.title ?? ""}
          </h1>
          {draft?.excerpt ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{draft.excerpt}</p>
          ) : null}
          <div
            className="rich-text mt-6"
            dangerouslySetInnerHTML={{ __html: draft?.contentHtml ?? "" }}
          />
        </article>
      </Modal>

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
            <X aria-hidden="true" className="size-4" /> Huỷ
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
            <FilePlus2 aria-hidden="true" className="size-4" /> Tạo bản nháp
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
  tags,
}: {
  draft: Draft | null;
  onChange: (draft: Draft) => void;
  onLoad: (id: string) => Promise<void>;
  row: ArticleListItem;
  tags: Tag[];
}) {
  useEffect(() => {
    if (draft?.id !== row.id) void onLoad(row.id);
  }, [draft?.id, onLoad, row.id]);

  if (draft?.id !== row.id) {
    return <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>;
  }

  return (
    <div className="grid gap-4">
      <ReviewNotice reason={row.rejectionReason} status={row.status} />
      <RemovalPendingNotice
        reason={row.rejectionReason}
        removalRequested={row.status === "published" && row.rejectionReason !== null}
        status={row.status}
      />

      <Field
        error={maxLength(draft.excerpt, 500, "Tóm tắt")}
        hint="Bắt buộc mới đăng được. Câu này cũng chính là nội dung thông báo gửi tới người học."
        label="Tóm tắt"
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, excerpt: event.target.value })}
          value={draft.excerpt}
        />
      </Field>

      <Field error={maxLength(draft.takeaway, 500, "Điểm rút ra")} label="Điểm rút ra">
        <textarea
          className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, takeaway: event.target.value })}
          value={draft.takeaway}
        />
      </Field>

      <Field
        hint="Chip lọc ở trang bài viết lấy từ đây. Bài không có chủ đề vẫn hiện trong danh sách nhưng không lọc ra được."
        label="Chủ đề"
      >
        {/* `<select>` thô chứ không dùng `Select` của @codementor/ui: cái đó là ô lọc
            (cao 9, chữ nhỏ đậm, co lại ở màn rộng) — đặt cạnh các ô nhập của form này
            thì lệch hẳn một nấc. Cùng class với `<input>` bên dưới là khớp luôn. */}
        <select
          aria-label="Chủ đề"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, tagId: event.target.value })}
          value={draft.tagId}
        >
          <option value="">— Chưa chọn —</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        error={integer(draft.readMinutes, "Thời gian đọc", { min: 1, max: 1000 })}
        label="Thời gian đọc (phút)"
      >
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
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Lỗi hiện thẳng dưới ô — đó là thứ đang chặn việc lưu, không giấu vào tooltip. */
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
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
