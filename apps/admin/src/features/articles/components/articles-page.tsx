"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Check,
  CheckCheck,
  ExternalLink,
  Eye,
  Newspaper,
  PencilLine,
  Plus,
  Save,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import { RichTextEditor } from "@codementor/editor";
import { Button, ManagePage, Modal, Select, StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { articlesApi, tagsApi, type AdminArticle, type Tag } from "@/lib/api";

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

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const timeFormat = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" });

/**
 * Địa chỉ ứng dụng người học, để mở xem trước bài viết.
 *
 * Bài chưa đăng vẫn xem được: `GET /articles/:slug` cho admin đọc mọi trạng thái, nên
 * người biên tập kiểm tra được trước khi bấm đăng.
 */
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

/**
 * Bản nháp đang sửa trong drawer. `body` là văn bản thô — mỗi đoạn cách nhau một dòng
 * trống — chứ không phải trình soạn thảo giàu định dạng: phase này chỉ cần đủ để biên
 * tập viên viết và đăng được bài, và một editor thật là việc riêng của nó.
 */
interface ArticleDraft {
  id: string;
  excerpt: string;
  takeaway: string;
  readMinutes: string;
  /** "" = chưa chọn chủ đề. */
  tagId: string;
  /** HTML từ RichTextEditor — cùng trình soạn thảo mà studio giảng viên đang dùng. */
  contentHtml: string;
}

export function ArticlesPage() {
  const request = useAdminApi();
  const [rows, setRows] = useState<AdminArticle[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [previewing, setPreviewing] = useState(false);
  // Bấm Lưu xong thì màn hình không đổi gì cả — drawer vẫn nguyên, danh sách vẫn nguyên —
  // nên người biên tập tưởng nút hỏng dù dữ liệu đã ghi. Đây là dấu hiệu rằng nó đã chạy.
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Nạp một lần cho cả trang: danh sách chủ đề đổi rất hiếm, và gọi lại mỗi lần mở một
  // bài thì drawer phải chờ thêm một vòng mạng chỉ để vẽ đúng ô select đó.
  useEffect(() => {
    void tagsApi
      .list(request)
      .then(setTags)
      .catch(() => setTags([]));
  }, [request]);

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

  /** Nạp thân bài khi mở một dòng — danh sách cố ý không mang nội dung. */
  const loadDraft = useCallback(
    async (id: string) => {
      // Mở sang bài khác thì dấu "đã lưu" của bài trước không còn đúng nữa.
      setSavedAt(null);
      const detail = await articlesApi.detail(request, id);
      setDraft({
        id,
        excerpt: detail.excerpt ?? "",
        takeaway: detail.takeaway ?? "",
        readMinutes: detail.readMinutes ? String(detail.readMinutes) : "",
        tagId: detail.tagId ?? "",
        contentHtml: detail.contentHtml ?? "",
      });
    },
    [request],
  );

  const saveDraft = useCallback(
    async (id: string) => {
      if (draft?.id !== id) return;
      await articlesApi.update(request, id, {
        excerpt: draft.excerpt.trim() || undefined,
        takeaway: draft.takeaway.trim() || undefined,
        readMinutes: draft.readMinutes ? Number(draft.readMinutes) : undefined,
        // `undefined` = không đụng tới. Backend chưa có đường gỡ chủ đề đã gắn; bỏ chọn
        // chỉ giữ nguyên chủ đề cũ chứ không xoá — chưa ai cần xoá nên chưa mở đường đó.
        tagId: draft.tagId || undefined,
      });

      // Chỉ ghi thân bài khi thực sự có chữ. Tiptap trả "<p></p>" cho tài liệu rỗng, và
      // ghi nó sẽ gắn `content_ref` cho một bài trống — `publish()` cho qua, còn người
      // đọc mở ra thấy trắng.
      if (draft.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0) {
        await articlesApi.saveContent(request, id, draft.contentHtml);
      }
      setSavedAt(new Date());
    },
    [request, draft],
  );

  /**
   * Quyết định kiểm duyệt. Từ chối và yêu cầu sửa BẮT BUỘC nêu lý do — chặn ngay ở đây
   * thay vì để backend trả 400, vì người duyệt cần biết trước khi bấm chứ không phải sau.
   */
  const decide = async (id: string, decision: "approve" | "request_changes" | "reject" | "archive") => {
    if ((decision === "reject" || decision === "request_changes") && !reason.trim()) {
      setError("Phải nêu lý do khi từ chối hoặc yêu cầu sửa.");
      return;
    }
    await act(async () => {
      await articlesApi.moderate(request, id, decision, reason.trim() || undefined);
      setReason("");
    });
  };

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
          body: (row) => (
            <>
              <ArticleEditor
                article={row}
                draft={draft}
                onChange={setDraft}
                onLoad={loadDraft}
                tags={tags}
              />
              {row.status === "pending_review" && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium" htmlFor="reason">
                    Lý do
                  </label>
                  <textarea
                    className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    id="reason"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Bắt buộc khi từ chối hoặc yêu cầu sửa. Người viết sẽ đọc đúng câu này."
                    value={reason}
                  />
                </div>
              )}
            </>
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
              {/* Thẻ <a> chứ không phải Button: Button ở @codementor/ui chỉ render
                  <button>, và mở tab mới là việc của liên kết. */}
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
              {row.status === "pending_review" && (
                <>
                  <Button
                    disabled={busy}
                    onClick={() => void decide(row.id, "request_changes")}
                    type="button"
                    variant="outline"
                  >
                    <PencilLine aria-hidden="true" className="size-4" />
                    Yêu cầu sửa
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void decide(row.id, "reject")}
                    type="button"
                    variant="ghost"
                  >
                    <XCircle aria-hidden="true" className="size-4" />
                    Từ chối
                  </Button>
                  <Button disabled={busy} onClick={() => void decide(row.id, "approve")} type="button">
                    <CheckCheck aria-hidden="true" className="size-4" />
                    Duyệt & đăng
                  </Button>
                </>
              )}
              {row.status === "published" && (
                <Button
                  disabled={busy}
                  onClick={() => void decide(row.id, "archive")}
                  type="button"
                  variant="ghost"
                >
                  <Archive aria-hidden="true" className="size-4" />
                  Gỡ xuống
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
            options={[
              { value: "", label: "Tất cả" },
              { value: "draft", label: "Bản nháp" },
              { value: "published", label: "Đã đăng" },
              { value: "archived", label: "Lưu trữ" },
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
        icon={Newspaper}
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
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCreating(false)} type="button" variant="ghost">
            Huỷ
          </Button>
          <Button
            disabled={busy || newTitle.trim().length === 0}
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

/**
 * Form sửa bài, nằm trong drawer.
 *
 * Thiếu tóm tắt hoặc thân bài thì `publish()` từ chối, nên không có chỗ nhập hai thứ đó
 * đồng nghĩa với việc từ giao diện admin không đăng nổi bài nào.
 */
function ArticleEditor({
  article,
  draft,
  onChange,
  onLoad,
  tags,
}: {
  article: AdminArticle;
  draft: ArticleDraft | null;
  onChange: (draft: ArticleDraft) => void;
  onLoad: (id: string) => Promise<void>;
  tags: Tag[];
}) {
  useEffect(() => {
    if (draft?.id !== article.id) void onLoad(article.id);
  }, [article.id, draft?.id, onLoad]);

  if (draft?.id !== article.id) {
    return <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>;
  }

  return (
    <div className="grid gap-4">
      {(article.status === "changes_requested" || article.status === "rejected") &&
        article.rejectionReason && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <strong>Đã trả lại:</strong> {article.rejectionReason}
          </p>
        )}

      <dl className="grid gap-3 text-sm">
        <Row label="Slug" value={article.slug} />
        <Row
          label="Ngày đăng"
          value={article.publishedAt ? dateFormat.format(new Date(article.publishedAt)) : "chưa đăng"}
        />
      </dl>

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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
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
