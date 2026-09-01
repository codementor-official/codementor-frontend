"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { Clock3, Lightbulb, Loader2 } from "lucide-react";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { Card } from "@/components/ui/card";
import { RecommendedArticles } from "@/components/recommendation/recommended";
import { SaveButton } from "@/features/saved/components/save-button";
import { api } from "@/lib/api";
import type { ArticleDetail } from "@/types/catalogue";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

function authorInitials(name: string | null) {
  return (name ?? "CodeMentor")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Đọc từ learning-service, không phải `src/data/articles.ts`.
 *
 * Bản cũ đọc mock nên mọi bài admin đăng đều 404 — kể cả khi người dùng bấm đúng nút
 * "Đọc bài viết" trong thông báo vừa nhận. Đây là client component vì token nằm ở phía
 * trình duyệt (`lib/api.ts` tự chọn gọi thẳng gateway hay qua proxy BFF).
 */
export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.articles
      .read(slug)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Không tải được bài viết");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error !== null) {
    return (
      <div className="mx-auto w-full max-w-4xl py-16 text-center">
        <h1 className="text-xl font-bold text-navy">Không mở được bài viết</h1>
        <p className="mt-2 text-sm text-text-muted">{error}</p>
      </div>
    );
  }

  if (article === null) {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-sm text-text-muted">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Đang tải bài viết…
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BreadcrumbTitle slug={slug} title={article.title} />
      <article>
        <header className="border-b border-border pb-7">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-faint">
            {article.tagName && (
              <span className="rounded-sm bg-primary-tint px-2 py-1 font-bold tracking-wide text-primary uppercase">
                {article.tagName}
              </span>
            )}
            {article.publishedAt && <span>{dateFormat.format(new Date(article.publishedAt))}</span>}
            {article.readMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" /> {article.readMinutes} phút đọc
              </span>
            )}
          </div>
          <h1 className="max-w-3xl text-3xl leading-tight font-bold tracking-tight text-navy sm:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
              {article.excerpt}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-on-ink">
                {authorInitials(article.authorName)}
              </span>
              <div className="min-w-0">
                <p className="text-2xs font-bold tracking-wide text-text-faint uppercase">Tác giả</p>
                <p className="truncate text-sm font-semibold text-navy">
                  {article.authorName ?? "CodeMentor"}
                </p>
              </div>
            </div>
            <SaveButton targetType="POST" targetId={article.id} targetRef={article.slug} />
          </div>
          {article.coverImageUrl && (
            <Image
              alt={`Ảnh bìa ${article.title}`}
              className="mt-6 aspect-[16/7] w-full rounded-xl object-cover"
              height={560}
              priority
              src={article.coverImageUrl}
              unoptimized
              width={1280}
            />
          )}
        </header>

        {/*
          Thân bài là HTML do RichTextEditor sinh ra, hiển thị qua cùng lớp `.rich-text`
          mà trình soạn thảo dùng — nhờ vậy bản xem trước và bản đăng trông giống nhau.

          `dangerouslySetInnerHTML` ở đây là có kiểm soát: nội dung chỉ do giảng viên và
          quản trị viên đã xác thực tạo ra, không phải do người dùng bất kỳ gửi lên.
        */}
        <div
          className="rich-text mt-8 text-base leading-7 text-text"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {article.takeaway && (
          <Card className="mt-9 flex gap-3 border-primary/20 bg-primary-tint p-5">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-navy">Điểm cần nhớ</h2>
              <p className="mt-1 text-sm leading-relaxed text-text">{article.takeaway}</p>
            </div>
          </Card>
        )}
      </article>

      {/* Dưới cùng, sau "điểm cần nhớ": đây là chỗ người đọc vừa đọc xong và đang tìm thứ
          tiếp theo. `key` theo id để đổi bài thì danh sách tải lại — hook chỉ chạy một lần
          mỗi lần mount. */}
      <div className="mt-12 border-t border-border pt-8">
        <RecommendedArticles key={article.id} limit={4} relatedTo={article.id} />
      </div>
    </div>
  );
}
