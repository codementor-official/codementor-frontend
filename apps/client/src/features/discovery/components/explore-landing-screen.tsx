"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Compass,
  Dumbbell,
  FileText,
  Flame,
  Globe,
  LayoutGrid,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { FilterBar, Select } from "@codementor/ui";
import { CategoryFilterCards, type CategoryFilterOption } from "@/components/ui/category-filter-cards";
import { CourseCard } from "@/components/course-card";
import { PageHeader } from "@/components/page-header";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import { ProblemRow } from "@/components/problem-row";
import {
  hasPersonalizedContent,
  usePersonalized,
} from "@/components/recommendation/use-personalized";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Difficulty } from "@/components/ui/badge";
import type { LearningLeaderboardEntry, UserLearningPreferences } from "@/features/account/types";
import type { WorkspaceListItem } from "@/features/workspace/types";
import { api } from "@/lib/api";
import { MAX_PAGE_SIZE, type ArticleSummary, type CourseSummary, type ExerciseSummary } from "@/types/catalogue";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";


type DifficultyFilter = Difficulty | "all";
type Category = "all" | "courses" | "problems" | "articles" | "community";

const recommendCourses = () => api.recommendations.courses(8);
const recommendArticles = () => api.recommendations.articles(6);
const recommendExercises = () => api.recommendations.exercises(8);
const recommendedCourses = (ids: string[]) => api.courses.catalogue({ ids: ids.join(","), limit: ids.length });
const recommendedArticles = () => api.articles.catalogue({ limit: MAX_PAGE_SIZE });
const recommendedExercises = () => api.exercises.bank({ limit: MAX_PAGE_SIZE });

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

function exerciseDifficulty(value: ExerciseSummary["difficulty"]): Difficulty {
  return value === "easy" ? "Cơ bản" : value === "medium" ? "Trung bình" : "Nâng cao";
}

function difficultyParam(value: DifficultyFilter) {
  return value === "Cơ bản" ? "easy" : value === "Trung bình" ? "medium" : value === "Nâng cao" ? "hard" : undefined;
}

function courseLevelParam(value: DifficultyFilter) {
  return value === "Cơ bản" ? "basic" : value === "Trung bình" ? "intermediate" : value === "Nâng cao" ? "experienced" : undefined;
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
  const preferenceRevision = useLearningPreferenceStore((state) => state.preferenceRevision);
  const requestSequence = useRef(0);
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.trim());
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [category, setCategory] = useState<Category>("all");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LearningLeaderboardEntry[]>([]);
  const [preferences, setPreferences] = useState<UserLearningPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    setPreferences(null);
    const q = debouncedSearch || undefined;
    const results = await Promise.allSettled([
      api.courses.catalogue({ q, level: courseLevelParam(difficulty), limit: 8 }),
      api.articles.catalogue({ q, limit: 6 }),
      api.exercises.bank({ q, difficulty: difficultyParam(difficulty), limit: 8 }),
      // Global Explore has its own public catalogue. Unlike `all`, it can never
      // include a private workspace merely because the viewer is a member.
      api.workspaces.list({ scope: "public", q, page: 1, limit: 5 }),
      api.account.leaderboard(5),
      api.account.preferences(),
    ]);
    const [courseResult, articleResult, exerciseResult, workspaceResult, leaderboardResult, preferenceResult] = results;
    if (sequence !== requestSequence.current) return;
    if (courseResult.status === "fulfilled") setCourses(courseResult.value.items);
    if (articleResult.status === "fulfilled") setArticles(articleResult.value.items);
    if (exerciseResult.status === "fulfilled") setExercises(exerciseResult.value.items);
    if (workspaceResult.status === "fulfilled") setWorkspaces(workspaceResult.value.items);
    if (leaderboardResult.status === "fulfilled") setLeaderboard(leaderboardResult.value);
    if (preferenceResult.status === "fulfilled") setPreferences(preferenceResult.value);
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed === results.length) setError("Không tải được dữ liệu Khám phá. Vui lòng thử lại.");
    else if (failed > 0) setError(`Có ${failed} nguồn dữ liệu tạm thời chưa phản hồi.`);
    setLoading(false);
  }, [debouncedSearch, difficulty]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(timer);
      requestSequence.current += 1;
    };
  }, [load, preferenceRevision]);

  // Đề xuất chỉ có nghĩa khi học viên đang DUYỆT. Vừa gõ tìm kiếm hay chọn độ khó là họ
  // đã nói rõ muốn gì, và `recommendation-service` không nhận tham số tìm kiếm nào — dải
  // "dành cho bạn" lúc đó sẽ mâu thuẫn với chính bộ lọc ngay bên trên nó.
  const browsing = debouncedSearch === "" && difficulty === "all";

  // Ba dải đề xuất, ghép sẵn với bản ghi danh mục để vẽ bằng ĐÚNG loại thẻ mà mỗi mục
  // đang dùng. Chỉ nạp khi đang duyệt; lúc đó `browsing` cũng là lúc `courses`/`articles`/
  // `exercises` bên dưới đang giữ danh sách không lọc, nên hai bên luôn nói về cùng một tập.
  const suggestedCourses = usePersonalized<CourseSummary>(
    recommendCourses,
    recommendedCourses,
    browsing,
  );
  const suggestedArticles = usePersonalized<ArticleSummary>(
    recommendArticles,
    recommendedArticles,
    browsing,
  );
  const suggestedExercises = usePersonalized<ExerciseSummary>(
    recommendExercises,
    recommendedExercises,
    browsing,
  );

  // Chỉ thay nội dung mặc định khi đề xuất thật sự nói được điều gì mới: có hồ sơ dùng
  // được VÀ còn mục nào sau khi ghép. Thiếu một trong hai thì giữ nguyên "đang nổi" —
  // dán nhãn "dành cho bạn" lên đúng bảng phổ biến chỉ làm mất nghĩa của cái nhãn.
  const courseList = hasPersonalizedContent(suggestedCourses)
    ? suggestedCourses.items
    : courses.map((item) => ({ item, reason: undefined }));
  const articleList = hasPersonalizedContent(suggestedArticles)
    ? suggestedArticles.items.map(({ item }) => item)
    : articles;
  const exerciseList = hasPersonalizedContent(suggestedExercises)
    ? suggestedExercises.items
    : exercises.map((item) => ({ item, reason: undefined }));

  const showCourses = category === "all" || category === "courses";
  const showProblems = category === "all" || category === "problems";
  const showArticles = category === "all" || category === "articles";
  const showCommunity = category === "all" || category === "community";

  const topics = useMemo(() => {
    const selected = preferences?.adaptiveRecommendations && preferences.completedAt ? [
      ...(preferences?.interestedTechnologies ?? []),
      ...(preferences?.interestedFields ?? []).map((field) => FIELD_LABELS[field] ?? field),
    ] : [];
    const available = [
      ...articles.map((article) => article.tagName).filter((tag): tag is string => Boolean(tag)),
      ...exercises.map((exercise) => exercise.kind === "code" ? "Coding" : exercise.kind === "quiz" ? "Trắc nghiệm" : "Tự luận"),
    ];
    return Array.from(new Set([...selected, ...available])).slice(0, 8);
  }, [articles, exercises, preferences]);

  const communityItems = useMemo<CommunityItem[]>(() => {
    return workspaces.map((workspace) => ({
      id: `workspace-${workspace.id}`,
      title: workspace.name,
      kind: "Nhóm công khai nổi bật",
      meta: `${workspace.memberCount} thành viên · ${workspace.topic ?? "Học tập"}`,
      href: `/workspace/${workspace.slug}`,
      icon: Users,
    }));
  }, [workspaces]);

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
            <SectionTitle
              icon={hasPersonalizedContent(suggestedCourses) ? Sparkles : Flame}
              title={hasPersonalizedContent(suggestedCourses) ? "Khóa học dành cho bạn" : "Khóa học đang nổi"}
              href="/courses"
            />
            {courseList.length === 0 ? <EmptySearch label="khóa học" query={search} /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courseList.map(({ item: course, reason }, index) => <CourseCard key={course.id} course={course} tileVariant={index % 2 ? "primary" : "navy"} note={reason} />)}
            </div>}
          </section>}

          {showArticles && <section className="mb-6">
            <SectionTitle
              icon={hasPersonalizedContent(suggestedArticles) ? Sparkles : FileText}
              title={hasPersonalizedContent(suggestedArticles) ? "Bài viết dành cho bạn" : "Bài viết mới nhất"}
              href="/articles"
            />
            <p className="mb-3 text-xs text-text-faint">{hasPersonalizedContent(suggestedArticles) ? "Chọn theo lĩnh vực, công nghệ và những gì bạn đã học" : "Kiến thức nền và mẹo thực chiến từ cộng đồng CodeMentor"}</p>
            {articleList.length === 0 ? <EmptySearch label="bài viết" query={search} /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articleList.slice(0, 6).map((article) => <Link key={article.id} href={`/articles/${article.slug}`} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-primary/40">{article.coverImageUrl && <Image alt={`Ảnh bìa ${article.title}`} className="aspect-[16/7] w-full object-cover" height={210} src={article.coverImageUrl} unoptimized width={480} />}<div className="flex flex-1 flex-col gap-2 p-4"><span className="w-fit rounded-sm bg-border-soft px-2 py-1 text-2xs font-bold tracking-wide text-navy uppercase">{article.tagName ?? "Học tập"}</span><h3 className="text-sm leading-snug font-semibold text-navy">{article.title}</h3><p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{article.excerpt ?? "Nội dung học tập mới trên CodeMentor."}</p><div className="mt-auto flex items-center justify-between border-t border-border-soft pt-2.5 text-2xs text-text-faint"><span className="truncate">{article.authorName ?? "CodeMentor"}</span><span className="shrink-0">{article.readMinutes ?? 1} phút đọc</span></div></div></Card></Link>)}
            </div>}
          </section>}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-5">
              {showProblems && <><section><SectionTitle icon={hasPersonalizedContent(suggestedExercises) ? Sparkles : Star} title={hasPersonalizedContent(suggestedExercises) ? "Bài luyện tập dành cho bạn" : "Bài luyện tập phổ biến"} href="/practice" fillIcon={!hasPersonalizedContent(suggestedExercises)} />{exerciseList.length === 0 ? <EmptySearch label="bài luyện tập" query={search} /> : <Card className="overflow-hidden">{exerciseList.map(({ item: exercise, reason }, index) => <ProblemRow key={exercise.id} tile="</>" tileVariant={index % 3 === 1 ? "accent" : index % 3 === 2 ? "primary" : "navy"} title={exercise.title} meta={reason ?? `Tác giả: ${exercise.authorName ?? "CodeMentor"}`} difficulty={exerciseDifficulty(exercise.difficulty)} href={`/solve/${exercise.id}`} />)}</Card>}</section><section><div className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy"><Target className="h-4 w-4 text-primary" /> Chủ đề đề xuất cho bạn</div><p className="mb-3 text-xs text-text-faint">{preferences?.adaptiveRecommendations && preferences.completedAt && (preferences.interestedFields.length || preferences.interestedTechnologies.length) ? "Từ sở thích học tập đã lưu của bạn" : "Chủ đề đang có nội dung mới trên hệ thống"}</p><div className="flex flex-wrap gap-2">{topics.length ? topics.map((topic) => <button key={topic} type="button" onClick={() => { setSearch(topic); setCategory("all"); }} className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-navy transition-colors hover:border-primary hover:text-primary">{topic}</button>) : <span className="text-sm text-text-faint">Chưa có chủ đề phù hợp.</span>}</div></section></>}

            </div>

            {showCommunity && <div className="flex min-w-0 flex-col gap-4">
              <Card className="h-fit p-4"><div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy"><Trophy className="h-4 w-4 text-primary" /> Bảng xếp hạng XP</div>{leaderboard.length ? <div className="flex flex-col gap-3">{leaderboard.map((learner, index) => <div key={learner.id} className="flex items-center gap-2.5"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold ${index < 3 ? "bg-primary text-on-ink" : "bg-border-soft text-navy"}`}>{index + 1}</span><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-navy">{learner.displayName}</div><div className="text-2xs text-text-faint">{learner.solvedCount} bài đã giải</div></div><span className="shrink-0 text-xs font-bold text-primary">{formatXp(learner.xp)} XP</span></div>)}</div> : <p className="text-xs text-text-faint">Chưa có dữ liệu xếp hạng.</p>}</Card>
              <Card className="h-fit p-4"><div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy"><Globe className="h-4 w-4 text-primary" /> Nhóm công khai nổi bật</div>{communityItems.length ? <div className="flex flex-col gap-4">{communityItems.map((item) => <Link key={item.id} href={item.href} className="flex items-start gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-primary"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-border-soft text-navy"><item.icon className="h-4 w-4" /></div><div className="min-w-0"><div className="mb-0.5 text-2xs font-bold tracking-wide text-primary uppercase">{item.kind}</div><div className="mb-0.5 line-clamp-2 text-sm font-semibold text-navy">{item.title}</div><div className="text-xs text-text-faint">{item.meta}</div></div></Link>)}</div> : <p className="text-xs text-text-faint">Chưa có nhóm công khai phù hợp.</p>}<Link href="/workspace?tab=public" className="mt-4 block rounded-md border border-border py-2.5 text-center text-xs font-semibold text-navy hover:bg-bg">Xem tất cả nhóm công khai →</Link></Card>
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
