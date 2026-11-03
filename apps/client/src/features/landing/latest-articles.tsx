import Link from "next/link";
import type { ArticleSummary } from "@/types/catalogue";
import { LandingSection } from "./section";

export function LandingArticles({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <LandingSection
      id="articles"
      eyebrow="Bài viết"
      title="Kinh nghiệm từ giảng viên"
      action={{ label: "Đọc thêm bài viết", href: "/articles" }}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <li key={article.id}>
            <Link href={`/articles/${article.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-colors hover:border-text-faint">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bìa từ S3, hostname theo môi trường */}
              <img
                src={article.coverImageUrl || "/article-cover-fallback.svg"}
                alt=""
                loading="lazy"
                width={640}
                height={360}
                className="aspect-video w-full bg-bg object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                {article.tagName && <p className="text-xs font-medium text-text-muted">{article.tagName}</p>}
                <h3 className="mt-1 text-base leading-6 font-semibold text-navy">{article.title}</h3>
                {article.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{article.excerpt}</p>}
                <p className="mt-auto pt-3 text-xs text-text-faint">
                  {[article.authorName, article.readMinutes && `${article.readMinutes} phút đọc`].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
