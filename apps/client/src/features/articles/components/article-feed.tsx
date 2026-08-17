"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bookmark, Loader2, Newspaper } from "lucide-react";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/study-group/study-group-stats";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { ArticleSummary } from "@/types/catalogue";

const PAGE_SIZE = 15;

/**
 * Danh sách bài viết, bố cục hai cột theo mẫu trang "Bài viết nổi bật" của F8: dòng bài
 * chiếm cột chính, chủ đề nằm ở cột phải.
 *
 * Lấy CẤU TRÚC chứ không lấy màu — chip, khoảng cách, chữ đều dùng token của CodeMentor,
 * nên trang này nằm cùng hệ thiết kế với phần còn lại của ứng dụng thay vì trông như
 * một trang lạ dán vào.
 */
export function ArticleFeed() {
  const [items, setItems] = useState<ArticleSummary[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (tag: string | null, nextCursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const page = await api.articles.catalogue({
          limit: PAGE_SIZE,
          tag: tag ?? undefined,
          cursor: nextCursor,
        });
        // Có cursor nghĩa là "xem thêm" — nối vào; không có thì đây là lần lọc mới.
        setItems((current) => (nextCursor ? [...current, ...page.items] : page.items));
        setCursor(page.nextCursor);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không tải được bài viết");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(activeTag);
  }, [activeTag, load]);

  useEffect(() => {
    void api.articles
      .tags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Bài viết nổi bật</h1>
        <p className="mt-2 text-sm text-text-muted">
          Tổng hợp các bài viết chia sẻ về kinh nghiệm tự học lập trình và các kỹ thuật lập trình web.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          {error !== null && (
            <p className="rounded-lg border border-danger/40 bg-danger-tint px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {loading && items.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-20 text-sm text-text-muted">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Đang tải bài viết…
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface py-20 text-center">
              <Newspaper aria-hidden="true" className="mx-auto h-8 w-8 text-border" />
              <p className="mt-3 text-sm font-medium text-navy">
                {activeTag ? `Chưa có bài viết nào thuộc "${activeTag}"` : "Chưa có bài viết nào"}
              </p>
              <p className="mt-1 text-xs text-text-muted">Bài viết mới sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((article) => (
                <ArticleRow article={article} key={article.id} />
              ))}
            </ul>
          )}

          {cursor !== null && items.length > 0 && (
            <button
              className="mt-6 w-full rounded-lg border border-border bg-surface py-3 text-sm font-semibold text-primary transition-colors hover:bg-bg disabled:opacity-50"
              disabled={loading}
              onClick={() => void load(activeTag, cursor)}
              type="button"
            >
              {loading ? "Đang tải…" : "Xem thêm bài viết"}
            </button>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <h2 className="mb-3 text-xs font-bold tracking-wide text-text-muted uppercase">
            Xem các bài viết theo chủ đề
          </h2>
          <div className="flex flex-wrap gap-2">
            <TagChip active={activeTag === null} onClick={() => setActiveTag(null)}>
              Tất cả
            </TagChip>
            {tags.map((tag) => (
              <TagChip
                active={activeTag === tag.name}
                key={tag.name}
                // Bấm lại chip đang chọn thì bỏ lọc — đỡ phải đi tìm nút "Tất cả".
                onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
              >
                {tag.name}
              </TagChip>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function TagChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none ${
        active
          ? "border-primary bg-primary-tint text-primary"
          : "border-border bg-surface text-text-muted hover:border-navy/20 hover:text-navy"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ArticleRow({ article }: { article: ArticleSummary }) {
  return (
    <li className="rounded-xl border border-border bg-surface transition-colors hover:border-navy/20">
      <article className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* Chưa có avatar tác giả trong `users` cho đường đọc này — chữ cái đầu là
                mỏ neo nhận diện rẻ nhất mà vẫn ổn định theo từng người. */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-on-ink">
              {initialOf(article.authorName)}
            </span>
            <span className="truncate text-sm font-semibold text-navy">
              {article.authorName ?? "CodeMentor"}
            </span>
            <BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          </div>
          {/* Nút đánh dấu chưa có backend — để nguyên chỗ nhưng không vẽ ra, vì một nút
              bấm vào không làm gì còn tệ hơn là chưa có nút. */}
          <Bookmark aria-hidden="true" className="h-4 w-4 shrink-0 text-border" />
        </div>

        <div className="flex gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-snug font-bold text-navy">
              <Link
                className="rounded-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
                href={`/articles/${article.slug}`}
              >
                {article.title}
              </Link>
            </h2>
            {article.excerpt && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                {article.excerpt}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-faint">
              {article.tagName && (
                <span className="rounded-md bg-bg px-2 py-1 font-medium text-text-muted">
                  {article.tagName}
                </span>
              )}
              {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
              {article.readMinutes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.readMinutes} phút đọc</span>
                </>
              )}
            </div>
          </div>

          <Link
            aria-hidden="true"
            className="hidden shrink-0 sm:block"
            href={`/articles/${article.slug}`}
            tabIndex={-1}
          >
            <Image
              alt=""
              className="h-[86px] w-[152px] rounded-lg object-cover"
              height={172}
              // `articles` chưa có cột ảnh bìa; ảnh giữ chỗ suy ra từ slug nên mỗi bài
              // luôn ra cùng một ảnh giữa các lần render.
              src={placeholderCoverUrl(article.slug, 304, 172)}
              unoptimized
              width={304}
            />
          </Link>
        </div>
      </article>
    </li>
  );
}

function initialOf(name: string | null): string {
  return name?.trim()?.[0]?.toUpperCase() ?? "C";
}

function timeAgo(iso: string): string {
  return formatRelativeTime((Date.now() - new Date(iso).getTime()) / 60_000);
}
