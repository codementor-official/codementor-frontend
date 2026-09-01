"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Loader2, Newspaper, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/study-group/study-group-stats";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { ArticleSummary } from "@/types/catalogue";
import { SaveButton } from "@/features/saved/components/save-button";
import { ReportButton } from "@/features/reports/report-button";
import { RecommendedArticles } from "@/components/recommendation/recommended";

const PAGE_SIZE = 10;

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
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const resetPagination = () => {
    setPage(1);
    setCursors([undefined]);
  };

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.articles.catalogue({
        limit: PAGE_SIZE,
        tag: activeTag ?? undefined,
        q: query || undefined,
        cursor: cursors[page - 1],
      });
      if (sequence === requestSequence.current) {
        setItems(response.items);
        setNextCursor(response.nextCursor);
      }
    } catch (cause) {
      if (sequence === requestSequence.current) {
        setItems([]);
        setNextCursor(null);
        setError(cause instanceof Error ? cause.message : "Không tải được bài viết");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [activeTag, cursors, page, query]);

  // Hoãn 300ms: gõ "websocket" mà gọi ngay từng phím là chín request, và request về sau
  // có thể tới trước request trước nó rồi ghi đè kết quả bằng danh sách của tiền tố cũ.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    void api.articles
      .tags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const goNext = () => {
    if (!nextCursor) return;
    setCursors((current) => {
      const copy = current.slice(0, page);
      copy[page] = nextCursor;
      return copy;
    });
    setPage((current) => current + 1);
  };

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
          {/* Tìm trong tiêu đề và tóm tắt, do learning-service lọc (tham số `q`) chứ không
              lọc trên mảng đã tải: danh sách phân trang nên lọc ở client chỉ tìm được
              trong 15 bài đầu tiên. */}
          <div className="relative mb-5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-faint"
            />
            <input
              aria-label="Tìm bài viết"
              className="h-11 w-full rounded-lg border border-border bg-surface pr-10 pl-10 text-sm text-navy transition-colors placeholder:text-text-faint focus-visible:border-primary"
              onChange={(event) => {
                setSearch(event.target.value);
                resetPagination();
              }}
              placeholder="Tìm bài viết theo tiêu đề hoặc mô tả…"
              // `text` chứ không phải `search`: `type="search"` khiến Chrome vẽ thêm nút
              // xoá của riêng nó, nằm ngay cạnh nút xoá bên dưới — hai dấu X cạnh nhau.
              type="text"
              value={search}
            />
            {search !== "" && (
              <button
                aria-label="Xoá tìm kiếm"
                className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-bg hover:text-navy"
                onClick={() => {
                  setSearch("");
                  resetPagination();
                }}
                type="button"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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
                {search.trim()
                  ? `Không tìm thấy bài viết nào khớp "${search.trim()}"`
                  : activeTag
                    ? `Chưa có bài viết nào thuộc "${activeTag}"`
                    : "Chưa có bài viết nào"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {search.trim()
                  ? "Thử từ khoá ngắn hơn, hoặc bỏ lọc chủ đề."
                  : "Bài viết mới sẽ xuất hiện ở đây."}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((article) => (
                <ArticleRow article={article} key={article.id} />
              ))}
            </ul>
          )}

          {(page > 1 || nextCursor) && items.length > 0 && (
            <nav
              aria-label="Phân trang bài viết"
              className="mt-6 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span className="text-xs text-text-faint">Trang {page}</span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:opacity-40"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  type="button"
                >
                  Trước
                </button>
                <button
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:opacity-40"
                  disabled={!nextCursor || loading}
                  onClick={goNext}
                  type="button"
                >
                  Sau
                </button>
              </div>
            </nav>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          {/* Đứng TRÊN dãy chip: đề xuất là thứ đọc được ngay, còn chip là công cụ cho
              người đã biết mình muốn tìm chủ đề nào. */}
          <div className="mb-6">
            <RecommendedArticles />
          </div>
          <h2 className="mb-3 text-xs font-bold tracking-wide text-text-muted uppercase">
            Xem các bài viết theo chủ đề
          </h2>
          <div className="flex flex-wrap gap-2">
            <TagChip
              active={activeTag === null}
              onClick={() => {
                setActiveTag(null);
                resetPagination();
              }}
            >
              Tất cả
            </TagChip>
            {tags.map((tag) => (
              <TagChip
                active={activeTag === tag.name}
                key={tag.name}
                // Bấm lại chip đang chọn thì bỏ lọc — đỡ phải đi tìm nút "Tất cả".
                onClick={() => {
                  setActiveTag(activeTag === tag.name ? null : tag.name);
                  resetPagination();
                }}
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
          <div className="flex items-center gap-1">
            <SaveButton compact targetType="POST" targetId={article.id} targetRef={article.slug} />
            <ReportButton compact targetType="POST" targetId={article.id} targetRef={article.slug} />
          </div>
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
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted">
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
