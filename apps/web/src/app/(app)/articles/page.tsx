import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { articles } from "@/data/articles";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader
        title="Bài viết"
        subtitle={`${articles.length} bài kiến thức nền, kinh nghiệm triển khai và mẹo thực chiến từ mentor CodeMentor.`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:border-primary/40">
              <div className="flex items-center justify-between gap-3 text-2xs text-text-faint">
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
                  Đọc bài <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
