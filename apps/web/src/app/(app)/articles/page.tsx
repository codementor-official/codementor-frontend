import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { articles } from "@/data/articles";
import { PageBanner } from "@/components/page-banner";
import { Card } from "@/components/ui/card";
import { PAGE_ILLUSTRATIONS } from "@/lib/content-illustrations";

export default function ArticlesPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Thư viện kiến thức"
        title="Bài viết từ mentor CodeMentor"
        description="Kiến thức nền, kinh nghiệm triển khai và các mẹo thực chiến để bạn học nhanh hơn và làm bài chắc hơn."
        illustrationSrc={PAGE_ILLUSTRATIONS.explore}
        highlights={[
          { value: String(articles.length), label: "bài viết" },
          { value: "4", label: "chủ đề" },
          { value: "100%", label: "đọc miễn phí" },
        ]}
      />

      <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
        <FileText className="h-4 w-4 text-primary" />
        <span>{articles.length} bài viết mới nhất</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Card className="flex h-full flex-col gap-3 p-5 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-card">
              <div className="flex items-center justify-between gap-3 text-[11px] text-text-faint">
                <span className="rounded-sm bg-primary-tint px-2 py-1 font-bold tracking-wide text-primary uppercase">
                  {article.tag}
                </span>
                <span>{article.publishedAt}</span>
              </div>
              <h2 className="text-base leading-snug font-bold text-navy">{article.title}</h2>
              <p className="text-sm leading-relaxed text-text-muted">{article.excerpt}</p>
              <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-3 text-xs text-text-faint">
                <span>{article.author} · {article.role}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  Đọc bài <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
