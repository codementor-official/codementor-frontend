"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Compass, Dumbbell, FileText, LayoutGrid, Map, Users, type LucideIcon } from "lucide-react";
import { FilterBar, Select } from "@codementor/ui";
import { CategoryFilterCards, type CategoryFilterOption } from "@/components/ui/category-filter-cards";
import { CourseCard } from "@/components/course-card";
import { EntityCard } from "@/components/entity-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ArticleSummary, CourseSummary, ExerciseSummary, RoadmapSummary } from "@/types/catalogue";
import type { WorkspaceListItem } from "@/features/workspace/types";

type Category = "all" | "courses" | "roadmaps" | "exercises" | "articles" | "workspaces";
type Difficulty = "all" | "easy" | "medium" | "hard";

const CATEGORIES: CategoryFilterOption[] = [
  { value: "all", label: "Tất cả", description: "Toàn bộ nội dung công khai", icon: LayoutGrid },
  { value: "courses", label: "Khóa học", description: "Chương trình học có cấu trúc", icon: BookOpen },
  { value: "roadmaps", label: "Lộ trình", description: "Các bước học theo mục tiêu", icon: Map },
  { value: "exercises", label: "Bài luyện tập", description: "Thực hành với Judge", icon: Dumbbell },
  { value: "articles", label: "Bài viết", description: "Kiến thức đã xuất bản", icon: FileText },
  { value: "workspaces", label: "Nhóm học tập", description: "Workspace công khai", icon: Users },
];

const DIFFICULTIES = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" },
];

function exerciseDifficulty(value: ExerciseSummary["difficulty"]) {
  return value === "easy" ? "Cơ bản" : value === "medium" ? "Trung bình" : "Nâng cao";
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
}

export function ExploreScreen({ initialQuery = "" }: { initialQuery?: string }) {
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.trim());
  const [category, setCategory] = useState<Category>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<Record<Exclude<Category, "all" | "workspaces">, string | null>>({
    courses: null,
    roadmaps: null,
    exercises: null,
    articles: null,
  });
  const [workspacePage, setWorkspacePage] = useState(1);
  const [workspaceTotalPages, setWorkspaceTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNextCursor({ courses: null, roadmaps: null, exercises: null, articles: null });
    setWorkspacePage(1);
    setWorkspaceTotalPages(1);
    const q = debouncedSearch || undefined;
    const results = await Promise.allSettled([
      api.courses.catalogue({ q, limit: 12 }),
      api.roadmaps.catalogue({ q, limit: 12 }),
      api.exercises.bank({ q, difficulty: difficulty === "all" ? undefined : difficulty, limit: 12 }),
      api.articles.catalogue({ q, limit: 12 }),
      api.workspaces.list({ scope: "discover", q, page: 1, limit: 12 }),
    ]);
    const [courseResult, roadmapResult, exerciseResult, articleResult, workspaceResult] = results;
    if (courseResult.status === "fulfilled") {
      setCourses(courseResult.value.items);
      setNextCursor((current) => ({ ...current, courses: courseResult.value.nextCursor }));
    }
    if (roadmapResult.status === "fulfilled") {
      setRoadmaps(roadmapResult.value.items);
      setNextCursor((current) => ({ ...current, roadmaps: roadmapResult.value.nextCursor }));
    }
    if (exerciseResult.status === "fulfilled") {
      setExercises(exerciseResult.value.items);
      setNextCursor((current) => ({ ...current, exercises: exerciseResult.value.nextCursor }));
    }
    if (articleResult.status === "fulfilled") {
      setArticles(articleResult.value.items);
      setNextCursor((current) => ({ ...current, articles: articleResult.value.nextCursor }));
    }
    if (workspaceResult.status === "fulfilled") {
      const resolved = await Promise.all(workspaceResult.value.items.map(async (workspace) => {
        if (!workspace.coverUrl) return workspace;
        try {
          const cover = await api.workspaces.coverPreview(workspace.slug);
          return { ...workspace, coverUrl: cover.url ?? workspace.coverUrl };
        } catch {
          return workspace;
        }
      }));
      setWorkspaces(resolved);
      setWorkspacePage(workspaceResult.value.page);
      setWorkspaceTotalPages(workspaceResult.value.totalPages);
    }
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length === results.length) {
      const reason = (failures[0] as PromiseRejectedResult).reason;
      setError(reason instanceof Error ? reason.message : "Không tải được dữ liệu khám phá.");
    } else if (failures.length > 0) {
      setError(`Có ${failures.length} nguồn dữ liệu tạm thời chưa phản hồi.`);
    }
    setLoading(false);
  }, [debouncedSearch, difficulty]);

  useEffect(() => { void load(); }, [load]);

  const canLoadMore = useMemo(() => {
    const enabled = (value: Exclude<Category, "all">) => category === "all" || category === value;
    return (
      (enabled("courses") && Boolean(nextCursor.courses)) ||
      (enabled("roadmaps") && Boolean(nextCursor.roadmaps)) ||
      (enabled("exercises") && Boolean(nextCursor.exercises)) ||
      (enabled("articles") && Boolean(nextCursor.articles)) ||
      (enabled("workspaces") && workspacePage < workspaceTotalPages)
    );
  }, [category, nextCursor, workspacePage, workspaceTotalPages]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setError(null);
    const q = debouncedSearch || undefined;
    const enabled = (value: Exclude<Category, "all">) => category === "all" || category === value;
    const tasks: Promise<void>[] = [];
    if (enabled("courses") && nextCursor.courses) tasks.push(
      api.courses.catalogue({ q, cursor: nextCursor.courses, limit: 12 }).then((page) => {
        setCourses((items) => mergeUnique(items, page.items));
        setNextCursor((current) => ({ ...current, courses: page.nextCursor }));
      }),
    );
    if (enabled("roadmaps") && nextCursor.roadmaps) tasks.push(
      api.roadmaps.catalogue({ q, cursor: nextCursor.roadmaps, limit: 12 }).then((page) => {
        setRoadmaps((items) => mergeUnique(items, page.items));
        setNextCursor((current) => ({ ...current, roadmaps: page.nextCursor }));
      }),
    );
    if (enabled("exercises") && nextCursor.exercises) tasks.push(
      api.exercises.bank({ q, difficulty: difficulty === "all" ? undefined : difficulty, cursor: nextCursor.exercises, limit: 12 }).then((page) => {
        setExercises((items) => mergeUnique(items, page.items));
        setNextCursor((current) => ({ ...current, exercises: page.nextCursor }));
      }),
    );
    if (enabled("articles") && nextCursor.articles) tasks.push(
      api.articles.catalogue({ q, cursor: nextCursor.articles, limit: 12 }).then((page) => {
        setArticles((items) => mergeUnique(items, page.items));
        setNextCursor((current) => ({ ...current, articles: page.nextCursor }));
      }),
    );
    if (enabled("workspaces") && workspacePage < workspaceTotalPages) tasks.push(
      api.workspaces.list({ scope: "discover", q, page: workspacePage + 1, limit: 12 }).then(async (page) => {
        const resolved = await Promise.all(page.items.map(async (workspace) => {
          if (!workspace.coverUrl) return workspace;
          try {
            const cover = await api.workspaces.coverPreview(workspace.slug);
            return { ...workspace, coverUrl: cover.url ?? workspace.coverUrl };
          } catch {
            return workspace;
          }
        }));
        setWorkspaces((items) => mergeUnique(items, resolved));
        setWorkspacePage(page.page);
        setWorkspaceTotalPages(page.totalPages);
      }),
    );
    const results = await Promise.allSettled(tasks);
    if (results.some((result) => result.status === "rejected")) {
      setError("Một số nội dung chưa tải thêm được. Bạn có thể thử lại.");
    }
    setLoadingMore(false);
  }, [category, debouncedSearch, difficulty, nextCursor, workspacePage, workspaceTotalPages]);

  const visibleCount = useMemo(
    () => courses.length + roadmaps.length + exercises.length + articles.length + workspaces.length,
    [articles.length, courses.length, exercises.length, roadmaps.length, workspaces.length],
  );
  const show = (value: Exclude<Category, "all">) => category === "all" || category === value;

  return (
    <div>
      <PageHeader icon={Compass} title="Khám phá" subtitle="Khóa học, lộ trình, bài luyện tập, bài viết và nhóm học tập công khai từ dữ liệu thật." />
      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm trên toàn hệ thống..."
        activeFilterCount={difficulty === "all" ? 0 : 1}
        controls={<Select label="Độ khó bài tập" value={difficulty} options={DIFFICULTIES} onChange={(value) => setDifficulty(value as Difficulty)} />}
      />
      <CategoryFilterCards options={CATEGORIES} value={category} onChange={(value) => setCategory(value as Category)} />

      {error && (
        <Card className="mb-5 flex items-center justify-between gap-4 border-warning/40 p-4 text-sm text-text-muted">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>Thử lại</Button>
        </Card>
      )}
      {loading ? <DiscoverySkeleton /> : visibleCount === 0 ? (
        <Card className="p-10 text-center text-sm text-text-muted">Không tìm thấy nội dung phù hợp.</Card>
      ) : (
        <div className="space-y-7">
          {show("courses") && courses.length > 0 && (
            <DiscoverySection title="Khóa học" icon={BookOpen} href="/courses">
              {courses.map((course) => <CourseCard key={course.id} course={course} />)}
            </DiscoverySection>
          )}
          {show("roadmaps") && roadmaps.length > 0 && (
            <DiscoverySection title="Lộ trình học" icon={Map} href="/roadmaps">
              {roadmaps.map((roadmap) => <EntityCard key={roadmap.id} tile={initials(roadmap.title)} tileVariant="primary" title={roadmap.title} description={`${roadmap.authorName ?? "CodeMentor"} · ${roadmap.field}`} tags={[roadmap.level]} stats={[{ label: "khóa", value: roadmap.courseCount }, { label: "giờ", value: roadmap.estimatedHours ?? 0 }]} href={`/roadmaps/${roadmap.id}`} />)}
            </DiscoverySection>
          )}
          {show("exercises") && exercises.length > 0 && (
            <DiscoverySection title="Coding Exercise" icon={Dumbbell} href="/practice">
              {exercises.map((exercise) => <EntityCard key={exercise.id} tile="&lt;/&gt;" title={exercise.title} description={`Tác giả: ${exercise.authorName ?? "CodeMentor"}`} difficulty={exerciseDifficulty(exercise.difficulty)} tags={[exercise.kind]} href={`/solve/${exercise.id}`} />)}
            </DiscoverySection>
          )}
          {show("articles") && articles.length > 0 && (
            <DiscoverySection title="Bài viết mới" icon={FileText} href="/articles">
              {articles.map((article) => <EntityCard key={article.id} tile="DOC" title={article.title} description={article.excerpt ?? "Bài viết học tập từ cộng đồng CodeMentor."} tags={article.tagName ? [article.tagName] : []} stats={[{ label: "phút đọc", value: article.readMinutes ?? 1 }]} href={`/articles/${article.slug}`} />)}
            </DiscoverySection>
          )}
          {show("workspaces") && workspaces.length > 0 && (
            <DiscoverySection title="Nhóm học tập công khai" icon={Users} href="/workspace">
              {workspaces.map((workspace) => <EntityCard key={workspace.id} tile={initials(workspace.name)} coverImage={workspace.coverUrl ?? undefined} coverPosition={workspace.coverPosition} coverFit={workspace.coverFit} title={workspace.name} description={workspace.description ?? "Nhóm học tập trên CodeMentor."} tags={workspace.topic ? [workspace.topic] : []} stats={[{ label: "thành viên", value: workspace.memberCount }]} badge={<Badge tone="neutral">{workspace.joinPolicy === "open" ? "Tham gia tự do" : workspace.joinPolicy === "approval" ? "Cần duyệt" : "Mã mời"}</Badge>} href={`/workspace/${workspace.slug}`} />)}
            </DiscoverySection>
          )}
          {canLoadMore && (
            <div className="flex justify-center pt-1">
              <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Đang tải thêm..." : "Tải thêm nội dung"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function mergeUnique<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

function DiscoverySection({ title, icon: Icon, href, children }: { title: string; icon: LucideIcon; href: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy"><Icon className="h-4 w-4 text-primary" /> {title}</h2>
        <Link href={href} className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function DiscoverySkeleton() {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Đang tải nội dung">{Array.from({ length: 8 }, (_, index) => <Card key={index} className="h-64 animate-pulse bg-border-soft/50" />)}</div>;
}
