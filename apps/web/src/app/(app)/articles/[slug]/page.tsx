import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Lightbulb } from "lucide-react";
import { getArticle } from "@/data/articles";
import { Card } from "@/components/ui/card";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link href="/articles" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Tất cả bài viết
      </Link>
      <article>
        <header className="border-b border-border pb-7">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-faint">
            <span className="rounded-sm bg-primary-tint px-2 py-1 font-bold tracking-wide text-primary uppercase">{article.tag}</span>
            <span>{article.publishedAt}</span>
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {article.readMinutes} phút đọc</span>
          </div>
          <h1 className="max-w-3xl text-3xl leading-tight font-bold tracking-tight text-navy sm:text-4xl">{article.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">{article.excerpt}</p>
          <p className="mt-5 text-sm font-medium text-navy">{article.author} <span className="font-normal text-text-faint">· {article.role}</span></p>
        </header>

        <div className="mt-8 space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-xl font-bold text-navy">{section.heading}</h2>
              <div className="space-y-3 text-[15px] leading-7 text-text">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {section.code && (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-ink-fixed p-4 text-xs leading-6 text-zinc-100">
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>

        <Card className="mt-9 flex gap-3 border-primary/20 bg-primary-tint p-5">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-bold text-navy">Điểm cần nhớ</h2>
            <p className="mt-1 text-sm leading-relaxed text-text">{article.takeaway}</p>
          </div>
        </Card>
      </article>
    </div>
  );
}
