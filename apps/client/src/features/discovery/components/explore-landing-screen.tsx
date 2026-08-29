"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  BookOpen,
  Compass,
  Dumbbell,
  FileText,
  Flame,
  Globe,
  LayoutGrid,
  Map,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { FilterBar, Select } from "@codementor/ui";
import { CategoryFilterCards, type CategoryFilterOption } from "@/components/ui/category-filter-cards";
import { EntityCard } from "@/components/entity-card";
import { PageHeader } from "@/components/page-header";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import { ProblemRow } from "@/components/problem-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Difficulty } from "@/components/ui/badge";
import type { LearningLeaderboardEntry, UserLearningPreferences } from "@/features/account/types";
import type { WorkspaceListItem } from "@/features/workspace/types";
import { api } from "@/lib/api";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { ArticleSummary, CourseSummary, ExerciseSummary, RoadmapSummary } from "@/types/catalogue";

type DifficultyFilter = Difficulty | "all";
type Category = "all" | "courses" | "problems" | "articles" | "community";

const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { value: "all", label: "Tất cả", description: "Toàn bộ nội dung, mới và cũ", icon: LayoutGrid },
  { value: "courses", label: "Khóa học", description: "Học theo lộ trình có cấu trúc", icon: BookOpen },
  { value: "problems", label: "Bài luyện tập", description: "Rèn kỹ năng qua từng bài", icon: Dumbbell },
  { value: "articles", label: "Bài viết", description: "Kiến thức nền và mẹo thực chiến", icon: FileText },
  { value: "community", label: "Cộng đồng", description: "Nhóm học tập, chia sẻ tài liệu", icon: Users },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "Cơ bản", label: "Cơ bản" },
  { value: "Trung bình", label: "Trung bình" },
  { value: "Nâng cao", label: "Nâng cao" },
];

const FIELD_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  devops: "DevOps",
  security: "Bảo mật",
  data: "Dữ liệu",
  other: "Lập trình",
};

function courseDifficulty(level: string): Difficulty {
  if (level === "none" || level === "basic") return "Cơ bản";
  if (level === "intermediate") return "Trung bình";
  return "Nâng cao";
}

function exerciseDifficulty(value: ExerciseSummary["difficulty"]): Difficulty {
  return value === "easy" ? "Cơ bản" : value === "medium" ? "Trung bình" : "Nâng cao";
}

function difficultyParam(value: DifficultyFilter) {
  return value === "Cơ bản" ? "easy" : value === "Trung bình" ? "medium" : value === "Nâng cao" ? "hard" : undefined;
}

function courseLevelParam(value: DifficultyFilter) {
  return value === "Cơ bản" ? "basic" : value === "Trung bình" ? "intermediate" : value === "Nâng cao" ? "experienced" : undefined;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatXp(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface CommunityItem {
  id: string;
  title: string;
  kind: string;
  meta: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export function ExploreLandingScreen({ initialQuery = "" }: { initialQuery?: string }) {
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.trim());
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [category, setCategory] = useState<Category>("all");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LearningLeaderboardEntry[]>([]);
  const [preferences, setPreferences] = useState<UserLearningPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = debouncedSearch || undefined;
    const results = await Promise.allSettled([
      api.courses.catalogue({ q, level: courseLevelParam(difficulty), limit: 8 }),
      api.articles.catalogue({ q, limit: 6 }),
      api.exercises.bank({ q, difficulty: difficultyParam(difficulty), limit: 8 }),
      // Explore phải giới thiệu cả nhóm công khai mà người dùng đã tham gia. `discover`
      // cố ý loại các nhóm đó nên demo account luôn mất đúng nhóm hoạt động nhất.
      api.workspaces.list({ scope: "all", q, page: 1, limit: 3 }),
      api.roadmaps.catalogue({ q, limit: 3 }),
      api.account.leaderboard(5),
      api.account.preferences(),
    ]);
    const [courseResult, articleResult, exerciseResult, workspaceResult, roadmapResult, leaderboardResult, preferenceResult] = results;
    if (courseResult.status === "fulfilled") setCourses(courseResult.value.items);
    if (articleResult.status === "fulfilled") setArticles(articleResult.value.items);
    if (exerciseResult.status === "fulfilled") setExercises(exerciseResult.value.items);
    if (workspaceResult.status === "fulfilled") setWorkspaces(workspaceResult.value.items);
    if (roadmapResult.status === "fulfilled") setRoadmaps(roadmapResult.value.items);
    if (leaderboardResult.status === "fulfilled") setLeaderboard(leaderboardResult.value);
    if (preferenceResult.status === "fulfilled") setPreferences(preferenceResult.value);
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed === results.length) setError("Không tải được dữ liệu Khám phá. Vui lòng thử lại.");
    else if (failed > 0) setError(`Có ${failed} nguồn dữ liệu tạm thời chưa phản hồi.`);
    setLoading(false);
  }, [debouncedSearch, difficulty]);

  useEffect(() => { void load(); }, [load]);

  const showCourses = category === "all" || category === "courses";
  const showProblems = category === "all" || category === "problems";
  const showArticles = category === "all" || category === "articles";
  const showCommunity = category === "all" || category === "community";

  const topics = useMemo(() => {
    const selected = [
      ...(preferences?.interestedTechnologies ?? []),
      ...(preferences?.interestedFields ?? []).map((field) => FIELD_LABELS[field] ?? field),
    ].filter((topic) => !/\bai\b|trí tuệ nhân tạo/i.test(topic));
    const available = [
      ...articles.map((article) => article.tagName).filter((tag): tag is string => Boolean(tag)),
      ...exercises.map((exercise) => exercise.kind === "code" ? "Coding" : exercise.kind === "quiz" ? "Trắc nghiệm" : "Tự luận"),
    ];
    return Array.from(new Set([...selected, ...available])).slice(0, 8);
  }, [articles, exercises, preferences]);

  const communityItems = useMemo<CommunityItem[]>(() => {
    const items: CommunityItem[] = [];
    const workspace = workspaces[0];
    if (workspace) items.push({ id: `workspace-${workspace.id}`, title: workspace.name, kind: "Nhóm học tập", meta: `${workspace.memberCount} thành viên`, href: `/workspace/${workspace.slug}`, icon: Users });
    const roadmap = roadmaps[0];
    if (roadmap) items.push({ id: `roadmap-${roadmap.id}`, title: roadmap.title, kind: "Lộ trình nổi bật", meta: `${roadmap.courseCount} khóa học`, href: `/roadmaps/${roadmap.id}`, icon: Map });
    const article = articles[0];
    if (article) items.push({ id: `article-${article.id}`, title: article.title, kind: "Bài viết mới", meta: `${article.readMinutes ?? 1} phút đọc`, href: `/articles/${article.slug}`, icon: FileText });
    return items;
  }, [articles, roadmaps, workspaces]);

  return (
    <div>
      <PageHeader
        icon={Compass}
        title="Khám phá"
        subtitle="Nội dung mới đang nổi trên toàn hệ thống — khóa học, bài luyện tập, bài viết và cộng đồng."
        actions={<><Button href="/roadmaps" size="sm">Xem lộ trình</Button><PersonalizationSettingsTrigger label="Thiết lập gợi ý" /></>}
      />
      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khóa học, bài luyện tập, chủ đề..."
        activeFilterCount={difficulty === "all" ? 0 : 1}
        controls={<Select label="Độ khó" value={difficulty} options={DIFFICULTY_OPTIONS} onChange={(value) => setDifficulty(value as DifficultyFilter)} />}
      />
      <CategoryFilterCards options={CATEGORY_OPTIONS} value={category} onChange={(value) => setCategory(value as Category)} />

      {error && <Card className="mb-5 flex items-center justify-between gap-4 border-warning/40 p-4 text-sm text-text-muted"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}>Thử lại</Button></Card>}
      {loading ? <ExploreLandingSkeleton /> : (
        <>
          {showCourses && <section className="mb-6">
            <SectionTitle icon={Flame} title="Khóa học đang nổi" href="/courses" />
            {courses.length === 0 ? <EmptySearch label="khóa học" query={search} /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course, index) => <EntityCard key={course.id} tile={initials(course.title)} tileVariant={index % 2 ? "primary" : "ink"} coverImage={course.coverImageUrl ?? placeholderCoverUrl(course.slug)} kind={{ icon: BookOpen, label: course.authorName ?? "CodeMentor" }} title={course.title} description={course.description ?? "Khóa học có cấu trúc trên CodeMentor."} difficulty={courseDifficulty(course.level)} stats={[{ label: "chương", value: course.totalChapters }, { label: "bài", value: course.totalLessons }, { label: "giờ", value: course.durationHours ?? 0 }]} href={`/courses/${course.id}`} />)}
            </div>}
          </section>}

          {showArticles && <section className="mb-6">
            <SectionTitle icon={FileText} title="Bài viết mới nhất" href="/articles" />
            <p className="mb-3 text-xs text-text-faint">Kiến thức nền và mẹo thực chiến từ cộng đồng CodeMentor</p>
            {articles.length === 0 ? <EmptySearch label="bài viết" query={search} /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 6).map((article) => <Link key={article.id} href={`/articles/${article.slug}`} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Card className="flex h-full flex-col gap-2 p-4 transition-colors group-hover:border-primary/40"><span className="w-fit rounded-sm bg-border-soft px-2 py-1 text-2xs font-bold tracking-wide text-navy uppercase">{article.tagName ?? "Học tập"}</span><h3 className="text-sm leading-snug font-semibold text-navy">{article.title}</h3><p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{article.excerpt ?? "Nội dung học tập mới trên CodeMentor."}</p><div className="mt-auto flex items-center justify-between border-t border-border-soft pt-2.5 text-2xs text-text-faint"><span className="truncate">{article.authorName ?? "CodeMentor"}</span><span className="shrink-0">{article.readMinutes ?? 1} phút đọc</span></div></Card></Link>)}
            </div>}
          </section>}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-5">
              {showProblems && <><section><SectionTitle icon={Star} title="Bài luyện tập phổ biến" href="/practice" fillIcon />{exercises.length === 0 ? <EmptySearch label="bài luyện tập" query={search} /> : <Card className="overflow-hidden">{exercises.map((exercise, index) => <ProblemRow key={exercise.id} tile="</>" tileVariant={index % 3 === 1 ? "accent" : index % 3 === 2 ? "primary" : "navy"} title={exercise.title} meta={`Tác giả: ${exercise.authorName ?? "CodeMentor"}`} difficulty={exerciseDifficulty(exercise.difficulty)} href={`/solve/${exercise.id}`} />)}</Card>}</section><section><div className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy"><Target className="h-4 w-4 text-primary" /> Chủ đề đề xuất cho bạn</div><p className="mb-3 text-xs text-text-faint">{preferences && (preferences.interestedFields.length || preferences.interestedTechnologies.length) ? "Từ sở thích học tập đã lưu của bạn" : "Chủ đề đang có nội dung mới trên hệ thống"}</p><div className="flex flex-wrap gap-2">{topics.length ? topics.map((topic) => <Link key={topic} href={`/practice?q=${encodeURIComponent(topic)}`} className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-navy hover:border-primary hover:text-primary">{topic}</Link>) : <span className="text-sm text-text-faint">Chưa có chủ đề phù hợp.</span>}</div></section></>}
            </div>

            {showCommunity && <div className="flex min-w-0 flex-col gap-4">
              <Card className="h-fit p-4"><div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy"><Trophy className="h-4 w-4 text-primary" /> Bảng xếp hạng XP</div>{leaderboard.length ? <div className="flex flex-col gap-3">{leaderboard.map((learner, index) => <div key={learner.id} className="flex items-center gap-2.5"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold ${index < 3 ? "bg-primary text-on-ink" : "bg-border-soft text-navy"}`}>{index + 1}</span><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-navy">{learner.displayName}</div><div className="text-2xs text-text-faint">{learner.solvedCount} bài đã giải</div></div><span className="shrink-0 text-xs font-bold text-primary">{formatXp(learner.xp)} XP</span></div>)}</div> : <p className="text-xs text-text-faint">Chưa có dữ liệu xếp hạng.</p>}</Card>
              <Card className="h-fit p-4"><div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy"><Globe className="h-4 w-4 text-primary" /> Cộng đồng</div>{communityItems.length ? <div className="flex flex-col gap-4">{communityItems.map((item) => <Link key={item.id} href={item.href} className="flex items-start gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-primary"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-border-soft text-navy"><item.icon className="h-4 w-4" /></div><div className="min-w-0"><div className="mb-0.5 text-2xs font-bold tracking-wide text-primary uppercase">{item.kind}</div><div className="mb-0.5 line-clamp-2 text-sm font-semibold text-navy">{item.title}</div><div className="text-xs text-text-faint">{item.meta}</div></div></Link>)}</div> : <p className="text-xs text-text-faint">Chưa có nội dung cộng đồng phù hợp.</p>}<Link href="/workspace" className="mt-4 block rounded-md border border-border py-2.5 text-center text-xs font-semibold text-navy hover:bg-bg">Khám phá nhóm học tập →</Link></Card>
            </div>}
          </div>
        </>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, href, fillIcon = false }: { icon: typeof Flame; title: string; href: string; fillIcon?: boolean }) {
  return <div className="mb-3 flex items-baseline justify-between"><h2 className="flex items-center gap-1.5 text-base font-bold text-navy"><Icon className={`h-4 w-4 text-primary ${fillIcon ? "fill-primary" : ""}`} /> {title}</h2><Link href={href} className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</Link></div>;
}

function EmptySearch({ label, query }: { label: string; query: string }) {
  return <p className="text-sm text-text-faint">{query ? `Không có ${label} nào khớp với “${query}”.` : `Chưa có ${label} công khai.`}</p>;
}

function ExploreLandingSkeleton() {
  return <div className="space-y-6" aria-label="Đang tải dữ liệu Khám phá"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="h-64 animate-pulse bg-border-soft/50" />)}</div><div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><Card className="h-80 animate-pulse bg-border-soft/50" /><Card className="h-80 animate-pulse bg-border-soft/50" /></div></div>;
}
