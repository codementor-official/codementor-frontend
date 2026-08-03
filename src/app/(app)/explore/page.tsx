"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  Dumbbell,
  FileText,
  Layers,
  LayoutGrid,
  Star,
  Target,
  Globe,
  Trophy,
  Users,
} from "lucide-react";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { PAGE_ILLUSTRATIONS } from "@/lib/content-illustrations";
import { courseDifficulty, courseHref, featuredCourses } from "@/lib/roadmap/course-catalog";
import { PageBanner } from "@/components/page-banner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import { CategoryFilterCards, type CategoryFilterOption } from "@/components/ui/category-filter-cards";
import { EntityCard } from "@/components/entity-card";
import { ProblemRow } from "@/components/problem-row";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import {
  communityItems,
  latestArticles,
  learningCollections,
  popularProblems,
  recommendedTopics,
  topLearners,
} from "@/data/sample-explore";
import type { Difficulty } from "@/components/ui/badge";

type DifficultyFilter = Difficulty | "all";
type Category = "all" | "courses" | "problems" | "collections" | "articles" | "community";

const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { value: "all", label: "Tất cả", description: "Toàn bộ nội dung, mới và cũ", icon: LayoutGrid },
  { value: "courses", label: "Khóa học", description: "Học theo lộ trình có cấu trúc", icon: BookOpen },
  { value: "problems", label: "Bài luyện tập", description: "Rèn kỹ năng qua từng bài", icon: Dumbbell },
  { value: "collections", label: "Bộ sưu tập", description: "Tuyển chọn theo công nghệ", icon: Layers },
  { value: "articles", label: "Bài viết", description: "Kiến thức nền và mẹo thực chiến", icon: FileText },
  { value: "community", label: "Cộng đồng", description: "Nhóm học tập, chia sẻ tài liệu", icon: Users },
];

const COURSE_TILE_TONE = ["ink", "primary"] as const;

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "Cơ bản", label: "Cơ bản" },
  { value: "Trung bình", label: "Trung bình" },
  { value: "Nâng cao", label: "Nâng cao" },
];

/** Short mono tile per collection tag — mirrors the abbreviation convention used in
 * `data/roadmaps.ts` (e.g. "Jv" for Java, "⚛" for React) so tile text never wraps. */
const COLLECTION_TILE: Record<string, string> = {
  Frontend: "</>",
  Backend: "Be",
  Java: "Jv",
  Spring: "Sb",
  React: "Rx",
};

function matches(query: string, ...fields: (string | undefined)[]) {
  if (!query) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [category, setCategory] = useState<Category>("all");
  const query = search.trim().toLowerCase();

  const showCourses = category === "all" || category === "courses";
  const showCollections = category === "all" || category === "collections";
  const showProblems = category === "all" || category === "problems";
  const showArticles = category === "all" || category === "articles";
  const showCommunity = category === "all" || category === "community";

  const filteredArticles = useMemo(
    () => latestArticles.filter((a) => matches(query, a.title, a.excerpt, a.author, a.tag)),
    [query],
  );

  const filteredCourses = useMemo(
    () =>
      featuredCourses
        .filter((c) => difficulty === "all" || courseDifficulty(c.level) === difficulty)
        .filter((c) => matches(query, c.title, c.description, c.roadmapTitle, ...c.technologies)),
    [query, difficulty],
  );
  const filteredProblems = useMemo(
    () =>
      popularProblems
        .filter((p) => difficulty === "all" || p.difficulty === difficulty)
        .filter((p) => matches(query, p.title, p.meta)),
    [query, difficulty],
  );

  return (
    <div>
      <PageBanner
        illustrationSrc={PAGE_ILLUSTRATIONS.explore}
        title="Khám phá"
        description="Nội dung mới đang nổi trên toàn hệ thống — khóa học, bài luyện tập, bộ sưu tập và cộng đồng. Lọc theo loại nội dung bên dưới, hoặc tìm thẳng thứ bạn cần."
        actions={
          <>
            <Button href="/paths" size="sm">
              Xem lộ trình học
            </Button>
            <PersonalizationSettingsTrigger label="Thiết lập gợi ý" />
            <Button href="/create-problem" variant="outline" size="sm">
              Tạo bài luyện tập
            </Button>
          </>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khóa học, bài luyện tập, chủ đề..."
        activeFilterCount={difficulty !== "all" ? 1 : 0}
        controls={
          <Select
            label="Độ khó"
            value={difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={(v) => setDifficulty(v as DifficultyFilter)}
          />
        }
      />

      <CategoryFilterCards
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(v) => setCategory(v as Category)}
      />

      {showCourses && (
        <section className="mb-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-navy">
              <Flame className="h-4 w-4 text-primary" /> Khóa học đang nổi
            </h2>
            <Link href="/paths" className="text-xs font-semibold text-primary">
              Xem tất cả →
            </Link>
          </div>
          {filteredCourses.length === 0 ? (
            <p className="text-sm text-text-faint">Không có khóa học nào khớp với &ldquo;{search}&rdquo;.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-1">
              <Card className="flex w-64 shrink-0 flex-col justify-center gap-3 p-5">
                <div>
                  <h3 className="mb-1 text-sm font-bold text-navy">Khám phá lộ trình học</h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Mỗi lộ trình gộp nhiều khóa học theo một hướng nghề nghiệp, xếp hạng theo mức
                    độ phù hợp với bạn.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button href="/paths" size="sm">
                    Xem tất cả lộ trình
                  </Button>
                  <Button href="/create-problem" variant="outline" size="sm">
                    Tạo bài luyện tập
                  </Button>
                </div>
              </Card>
              {filteredCourses.map((course, i) => (
                <div key={course.id} className="w-64 shrink-0">
                  <EntityCard
                    tile={course.thumbnail}
                    tileVariant={COURSE_TILE_TONE[i % COURSE_TILE_TONE.length]}
                    coverImage={placeholderCoverUrl(course.slug)}
                    kind={{ icon: BookOpen, label: course.roadmapTitle }}
                    title={course.title}
                    description={course.description}
                    difficulty={courseDifficulty(course.level)}
                    tags={course.technologies.slice(0, 3)}
                    stats={[
                      { label: "chương", value: course.totalChapters },
                      { label: "giờ", value: course.durationHours },
                    ]}
                    progress={course.progressPercent > 0 ? course.progressPercent : undefined}
                    href={courseHref(course)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showCollections && (
        <section className="mb-6">
          <h2 className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy">
            <BookOpen className="h-4 w-4 text-primary" /> Bộ sưu tập học tập
          </h2>
          <p className="mb-3 text-xs text-text-faint">Các lộ trình chủ đề được tuyển chọn theo công nghệ</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {learningCollections.map((c) => (
              <EntityCard
                key={c.name}
                tile={COLLECTION_TILE[c.tag] ?? c.tag.slice(0, 2)}
                tileVariant="ink"
                tileHeight="sm"
                coverImage={placeholderCoverUrl(c.name)}
                kind={{ icon: Layers, label: "Bộ sưu tập" }}
                title={c.name}
                description={c.desc}
                footer={
                  <>
                    <span>{c.count}</span>
                    <span className="rounded-sm bg-border-soft px-2 py-1 font-semibold text-navy">{c.tag}</span>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      {showArticles && filteredArticles.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy">
            <FileText className="h-4 w-4 text-primary" /> Bài viết mới nhất
          </h2>
          <p className="mb-3 text-xs text-text-faint">Kiến thức nền và mẹo thực chiến từ mentor của CodeMentor</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((a) => (
              <Card key={a.title} className="flex flex-col gap-2 p-4">
                <span className="w-fit rounded-sm bg-border-soft px-2 py-1 text-[10px] font-bold tracking-wide text-navy uppercase">
                  {a.tag}
                </span>
                <h3 className="text-sm leading-snug font-semibold text-navy">{a.title}</h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{a.excerpt}</p>
                <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-2.5 text-[11px] text-text-faint">
                  <span className="truncate">{a.author}</span>
                  <span className="shrink-0">{a.readMinutes} phút đọc</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {showProblems && (
            <>
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="flex items-center gap-1.5 text-base font-bold text-navy">
                    <Star className="h-4 w-4 fill-primary text-primary" /> Bài luyện tập phổ biến
                  </h2>
                  <Link href="/practice" className="text-xs font-semibold text-primary">
                    Xem tất cả →
                  </Link>
                </div>
                {filteredProblems.length === 0 ? (
                  <p className="text-sm text-text-faint">Không có bài luyện tập nào khớp với &ldquo;{search}&rdquo;.</p>
                ) : (
                  <Card className="overflow-hidden">
                    {filteredProblems.map((p) => (
                      <ProblemRow key={p.title} {...p} />
                    ))}
                  </Card>
                )}
              </section>

              <section>
                <div className="mb-1 flex items-center gap-1.5 text-base font-bold text-navy">
                  <Target className="h-4 w-4 text-primary" /> Chủ đề đề xuất cho bạn
                </div>
                <p className="mb-3 text-xs text-text-faint">Dựa trên lĩnh vực bạn chọn khi đăng ký</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedTopics.map((t) => (
                    <Link
                      key={t}
                      href="/practice"
                      className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-navy hover:border-primary hover:text-primary"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
        {showCommunity && (
          <Card className="h-fit p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Trophy className="h-4 w-4 text-primary" /> Bảng xếp hạng tuần
            </div>
            <div className="flex flex-col gap-3">
              {topLearners.map((l) => (
                <div key={l.name} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      l.rank <= 3 ? "bg-primary text-white" : "bg-border-soft text-navy"
                    }`}
                  >
                    {l.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-navy">{l.name}</div>
                    <div className="text-[11px] text-text-faint">{l.solved} bài đã giải</div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary">{l.xp} XP</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {showCommunity && (
          <Card className="h-fit p-4">
            <div className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-navy">
              <Globe className="h-4 w-4 text-primary" /> Cộng đồng
            </div>
            <div className="flex flex-col gap-4">
              {communityItems.map((c) => (
                <div key={c.title} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-border-soft text-navy">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                      {c.kind}
                    </div>
                    <div className="mb-0.5 text-sm font-semibold text-navy">{c.title}</div>
                    <div className="flex items-center gap-1 text-xs text-text-faint">
                      {c.rating && (
                        <span className="flex items-center gap-0.5 text-primary">
                          <Star className="h-3 w-3 fill-primary" /> {c.rating} ·
                        </span>
                      )}
                      {c.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/workspace"
              className="mt-4 block rounded-md border border-border py-2.5 text-center text-xs font-semibold text-navy hover:bg-bg"
            >
              Khám phá nhóm học tập →
            </Link>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
