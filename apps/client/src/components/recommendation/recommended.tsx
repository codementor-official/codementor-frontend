"use client";

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2, Map as MapIcon, Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { EntityCard } from "@/components/entity-card";
import { ProblemRow } from "@/components/problem-row";
import { CatalogueEmpty } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { exerciseDifficulty, levelToDifficulty, FIELD_LABEL } from "@/lib/catalogue/level";
import { useRecommendations } from "@/features/recommendations/use-recommendations";
import { inRecommendationOrder } from "@/features/recommendations/ranked-items";
import { RecommendationError, RecommendationNotice } from "@/features/recommendations/recommendation-feedback";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
const VISIBLE = 4;
const loadCourses = async (limit: number) => {
  const ranked = await api.recommendations.courses(limit);
  if (!ranked.items.length) return { personalized: ranked.personalized, items: [] };
  const page = await api.courses.catalogue({
    ids: ranked.items.map((item) => item.id).join(","),
    limit: ranked.items.length,
  });
  return { personalized: ranked.personalized, items: inRecommendationOrder(ranked.items, page.items) };
};

function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

export function RecommendedExercises({ limit = 5, title, layout = "list" }: { limit?: number; title?: string; layout?: "list" | "cards" } = {}) {
  const load = useCallback(() => api.recommendations.exercises(limit), [limit]);
  const { data, isLoading, error, reload } = useRecommendations(load);
  if (isLoading) return <Card className="h-52 animate-pulse" />;
  if (error) return <RecommendationError message={error} onRetry={reload} />;
  if (!data) return null;
  if (!data.items.length) return null;
  return <RecommendationFrame icon={Code2} title={title ?? (data.personalized ? "Bài luyện tập dành cho bạn" : "Bài luyện tập phổ biến")} personalized={data.personalized}>
    {layout === "cards" ? <ul className="grid gap-3 md:grid-cols-3">{data.items.map((item) => {
      const difficulty = exerciseDifficulty(item.difficulty ?? "easy");
      return <li key={item.id}><Link href={`/solve/${item.id}`} className="group flex h-full min-h-36 flex-col rounded-xl border border-border bg-surface p-4 shadow-card transition-colors duration-150 hover:border-primary/50">
        <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg text-xs font-bold text-primary">{tileFor(item.title)}</span><span className={`text-2xs font-semibold ${difficulty === "Cơ bản" ? "text-success" : difficulty === "Trung bình" ? "text-accent" : "text-danger"}`}>{difficulty}</span></div>
        <h3 className="mt-3 line-clamp-2 text-sm font-bold text-navy group-hover:text-primary">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{item.reasons[0] ?? "Phù hợp với tiến độ hiện tại của bạn"}</p>
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-primary">Mở bài tập <ArrowUpRight className="h-3.5 w-3.5" /></span>
      </Link></li>;
    })}</ul> : <Card className="overflow-hidden">
      {data.items.map((item, i) => <ProblemRow key={item.id} tile={tileFor(item.title)}
        tileVariant={i % 2 === 0 ? "primary" : "navy"} title={item.title}
        meta={item.reasons[0] ?? "Gợi ý cho bạn"} difficulty={exerciseDifficulty(item.difficulty ?? "easy")}
        href={`/solve/${item.id}`} />)}
    </Card>}
  </RecommendationFrame>;
}

export function RecommendedCourses({ excludeId, limit = 6, title }: { excludeId?: string; limit?: number; title?: string } = {}) {
  const load = useCallback(() => loadCourses(limit), [limit]);
  const { data, isLoading, error, reload } = useRecommendations(load);
  if (isLoading) return <CardGridSkeleton />;
  if (error) return <RecommendationError message={error} onRetry={reload} />;
  if (!data) return null;
  const visible = data.items.filter(({ item }) => item.id !== excludeId).slice(0, VISIBLE);
  if (!visible.length) return null;
  return <RecommendationFrame icon={BookOpen} title={title ?? (data.personalized ? "Khóa học dành cho bạn" : "Khóa học phổ biến")} personalized={data.personalized}>
    <ul className={GRID}>
      {visible.map(({ item, recommendation }, i) => <li key={item.id}>
        <CourseCard course={item} tileVariant={i % 2 === 0 ? "navy" : "primary"} note={recommendation.reasons[0]} />
      </li>)}
    </ul>
  </RecommendationFrame>;
}

export function RecommendedRoadmaps({ excludeId, limit = 6, title }: { excludeId?: string; limit?: number; title?: string } = {}) {
  const load = useCallback(() => api.recommendations.roadmaps(limit), [limit]);
  const { data, isLoading, error, reload } = useRecommendations(load);
  if (isLoading) return <CardGridSkeleton />;
  if (error) return <RecommendationError message={error} onRetry={reload} />;
  if (!data) return null;
  const visible = data.items.filter((item) => item.id !== excludeId).slice(0, VISIBLE);
  if (!visible.length) return null;
  return <RecommendationFrame icon={MapIcon} title={title ?? (data.personalized ? "Lộ trình dành cho bạn" : "Lộ trình phổ biến")} personalized={data.personalized}>
    <ul className={GRID}>
      {visible.map((roadmap) => <li key={roadmap.id}>
        <EntityCard tile={tileFor(roadmap.title)} tileHeight="md"
          kind={{ icon: MapIcon, label: FIELD_LABEL[roadmap.field ?? ""] ?? "Lộ trình" }}
          title={roadmap.title} description="" difficulty={levelToDifficulty(roadmap.level ?? "basic")}
          tags={roadmap.technologies.slice(0, 3)} note={roadmap.reasons[0]} href={`/roadmaps/${roadmap.id}`} />
      </li>)}
    </ul>
  </RecommendationFrame>;
}

function CardGridSkeleton() {
  return <div className={GRID}>{Array.from({ length: VISIBLE }, (_, i) => <Card key={i} className="h-64 animate-pulse" />)}</div>;
}

export function RecommendedArticles({ limit = 5, relatedTo }: { limit?: number; relatedTo?: string }) {
  const load = useCallback(() => relatedTo
    ? api.recommendations.relatedArticles(relatedTo, limit)
    : api.recommendations.articles(limit), [relatedTo, limit]);
  const { data, isLoading, error, reload } = useRecommendations(load);
  if (isLoading) return <Card className="h-48 animate-pulse" />;
  if (error) return <RecommendationError message={error} onRetry={reload} />;
  if (!data) return null;
  if (!data.items.length) return <CatalogueEmpty icon={Newspaper}
    title={relatedTo ? "Chưa có bài viết liên quan" : "Chưa có bài viết để đề xuất"}
    description="Chưa có bài viết nào khác được công khai." />;
  return <section>
    <h2 className="mb-3 text-sm font-bold text-navy">{relatedTo ? "Bài viết liên quan" : data.personalized ? "Bài viết dành cho bạn" : "Bài viết được lưu nhiều"}</h2>
    <RecommendationNotice personalized={data.personalized} />
    <Card className="divide-y divide-border-soft">
      {data.items.map((article) => <Link key={article.id} href={`/articles/${article.slug}`}
        className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-bg">
        <span className="line-clamp-2 text-sm font-semibold text-navy">{article.title}</span>
        <span className="text-2xs text-text-faint">{article.tags[0] ? `${article.tags[0]} · ` : ""}{article.reasons[0] ?? "Gợi ý cho bạn"}</span>
      </Link>)}
    </Card>
  </section>;
}

function RecommendationFrame({ icon: Icon, title, personalized, children }: { icon: typeof Code2; title: string; personalized: boolean; children: ReactNode }) {
  return <section><h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-navy"><Icon className="h-4 w-4 text-primary" />{title}</h2><RecommendationNotice personalized={personalized} />{children}</section>;
}
