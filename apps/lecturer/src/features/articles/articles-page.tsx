"use client";

import { ReviewFlag, ReviewNotice, RemovalPendingNotice } from "@/components/page/review-notice";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ExternalLink,
  FilePlus2,
  FileText,
  Newspaper,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import {
  Button,
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
  ManagePage,
  Modal,
  ReasonButton,
  Select,
  StatusBadge,
  buttonClassName,
} from "@codementor/ui";
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

/**
 * Studio bài viết của giảng viên.
 *
 * Cùng màn hình và cùng luồng với trang Posts bên admin — khác đúng một điều: danh sách
 * chỉ có bài của chính người đang đăng nhập, và ràng buộc đó do learning-service áp
 * (`mustEdit`), không phải do màn này ẩn nút.
 */
export function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageContent />
    </Suspense>
  );
}

/** `useSearchParams` đòi một `Suspense` bao ngoài — xem cùng lý do ở courses/roadmaps/
 * exercises page.tsx. */
function ArticlesPageContent() {
  const router = useRouter();
  // Breadcrumb ở studio trỏ về đây kèm id vì bản ghi không có trang riêng — mở sẵn drawer
  // của đúng bài viết đó thay vì chỉ về danh sách trống trơn.
  const openId = useSearchParams().get("open");
  const [rows, setRows] = useState<ArticleListItem[]>([]);
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

  const createArticle = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.articles.create({ title: newTitle.trim() });
      setNewTitle("");
      setCreating(false);
      router.push(`/articles/${created.id}/studio`);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

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
        initialSelectedId={openId}
        icon={Newspaper}
        columns={columns}
        description="Bài viết của bạn. Gửi duyệt để quản trị viên xem xét; bài được duyệt lần đầu sẽ gửi thông báo tới toàn bộ người học."
        drawer={{
          title: (row) => row.title,
          description: (row) => ARTICLE_STATUS_LABELS[row.status] ?? row.status,
          body: (row) => <ArticleDrawerBody row={row} />,
          footer: (row) => (
            <ArticleDrawerActions
              busy={busy}
              onRequestRemoval={(reason) => act(() => api.articles.requestRemoval(row.id, reason))}
              onRestore={() => act(() => api.articles.restore(row.id))}
              onSubmit={() => act(() => api.articles.submit(row.id))}
              onWithdraw={() => act(() => api.articles.withdraw(row.id))}
              row={row}
            />
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

      <Modal onClose={() => setCreating(false)} open={creating} title="Tạo bài viết mới">
        <p className="mb-4 text-sm text-muted-foreground">
          Bài được tạo ở dạng nháp. Thêm tóm tắt và nội dung rồi mới đăng được.
        </p>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="new-title">
          Tiêu đề
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
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
            onClick={() => void createArticle()}
            type="button"
          >
            <FilePlus2 aria-hidden="true" className="size-4" /> Tạo bản nháp
          </Button>
        </div>
      </Modal>
    </PageBody>
  );
}

function ArticleDrawerBody({ row }: { row: ArticleListItem }) {
  return (
    <DrawerDetail key={row.id} load={() => api.articles.detail(row.id)}>
      {(article) => (
        <>
          <ReviewNotice reason={article.rejectionReason} status={article.status} />
          <RemovalPendingNotice
            reason={article.rejectionReason}
            removalRequested={article.status === "published" && article.rejectionReason !== null}
            status={article.status}
          />
          <DetailMeta>
            <DetailRow label="Slug" value={article.slug} />
            <DetailRow label="Trạng thái" value={ARTICLE_STATUS_LABELS[article.status] ?? article.status} />
            <DetailRow label="Chủ đề" value={row.tagName ?? "— chưa chọn —"} />
            <DetailRow label="Thời gian đọc" value={article.readMinutes ? `${article.readMinutes} phút` : "—"} />
            <DetailRow label="Tác giả" value={article.authorName ?? "—"} />
            <DetailRow label="Cập nhật" value={dateFormat.format(new Date(article.updatedAt))} />
          </DetailMeta>

          <DetailSection icon={FileText} title="Tóm tắt">
            {article.excerpt ? (
              <p className="text-sm">{article.excerpt}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có tóm tắt.</p>
            )}
          </DetailSection>

          {article.takeaway && (
            <DetailSection icon={Sparkles} title="Điểm rút ra">
              <p className="text-sm">{article.takeaway}</p>
            </DetailSection>
          )}

          <DetailSection icon={Newspaper} title="Nội dung">
            {(article.contentHtml ?? "").replace(/<[^>]*>/g, "").trim().length > 0 ? (
              <div className="rich-text text-sm" dangerouslySetInnerHTML={{ __html: article.contentHtml ?? "" }} />
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có nội dung.</p>
            )}
          </DetailSection>
        </>
      )}
    </DrawerDetail>
  );
}

function ArticleDrawerActions({
  row,
  busy,
  onSubmit,
  onWithdraw,
  onRestore,
  onRequestRemoval,
}: {
  row: ArticleListItem;
  busy: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  onRestore: () => void;
  onRequestRemoval: (reason: string) => void;
}) {
  return (
    <>
      {row.status === "pending_review" ? (
        <Button disabled={busy} onClick={onWithdraw} type="button" variant="outline">
          <Undo2 aria-hidden="true" className="size-4" /> Hủy gửi duyệt
        </Button>
      ) : row.status === "archived" ? (
        <Button disabled={busy} onClick={onRestore} type="button" variant="outline">
          <RotateCcw aria-hidden="true" className="size-4" /> Khôi phục
        </Button>
      ) : (
        <>
          <Button disabled={busy} onClick={onSubmit} type="button" variant="outline">
            <Send aria-hidden="true" className="size-4" />
            {row.status === "published" ? "Gửi duyệt lại" : "Gửi duyệt"}
          </Button>
          {row.status === "published" && (
            <ReasonButton
              confirmLabel="Gửi yêu cầu"
              description="Bài viết vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
              disabled={busy}
              onConfirm={onRequestRemoval}
              placeholder="Vì sao bạn muốn gỡ bài viết này xuống?"
              title="Xin gỡ bài viết đang công khai?"
            >
              <Archive aria-hidden="true" className="size-4" /> Xin gỡ xuống
            </ReasonButton>
          )}
        </>
      )}
      {row.status === "published" && (
        <a className={buttonClassName("outline")} href={`${CLIENT_URL}/articles/${row.slug}`} rel="noreferrer" target="_blank">
          <ExternalLink aria-hidden="true" className="size-4" /> Xem trên client
        </a>
      )}
      <Link className={buttonClassName()} href={`/articles/${row.id}/studio`}>
        <Pencil aria-hidden="true" className="size-4" /> Mở studio
      </Link>
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
