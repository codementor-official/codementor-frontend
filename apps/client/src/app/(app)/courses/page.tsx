"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { FilterBar, Select, SegmentedTabs, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { CourseCard } from "@/components/course-card";
import { Pagination } from "@/components/ui/pagination";
import {
  CatalogueEmpty,
  CatalogueError,
  CatalogueSkeleton,
} from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useMyCourses } from "@/hooks/use-my-courses";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { levelToDifficulty, LEVEL_OPTIONS } from "@/lib/catalogue/level";
import { MAX_PAGE_SIZE, type CourseSummary } from "@/types/catalogue";

const TILE_TONE = ["navy", "primary"] as const;
const PAGE_SIZE = 20;

/** Two initials from the title — the backend sends no thumbnail for a course. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

export default function CoursesPage() {
  const { status: authStatus } = useAuth();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);

  const mine = useMyCourses(authStatus === "authenticated");

  // The catalogue endpoint already returns only published, public content, so this fetches
  // once and filters in the browser. Move the filters into the query when the list is long
  // enough that shipping it all is the wrong trade.
  const { items, isLoading, error } = useCatalogue<CourseSummary>(() =>
    api.courses.catalogue({ limit: MAX_PAGE_SIZE }),
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((c) => level === "all" || c.level === level)
      .filter((c) => !query || `${c.title} ${c.slug} ${c.authorName ?? ""}`.toLowerCase().includes(query));
  }, [items, search, level]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Only the cards on screen: enrolment is one request per course. Used only for the
  // "Hoàn thành" badge now — enrol/resume moved to the course detail page.
  const { byCourse } = useCourseProgress(
    paginated.map((c) => c.id),
    authStatus === "authenticated",
  );

  const published = items.filter((c) => c.status === "published").length;
  const totalLessons = items.reduce((sum, c) => sum + (c.totalLessons ?? 0), 0);

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Khóa học"
        subtitle="Toàn bộ khóa học đã công khai trên hệ thống. Học lẻ từng khóa hoặc theo thứ tự của một lộ trình."
      />

      {authStatus === "authenticated" && (
        <SegmentedTabs
          className="mb-5"
          value={tab}
          onChange={(v) => setTab(v as "all" | "mine")}
          options={[
            { value: "all", label: "Tất cả khóa học" },
            { value: "mine", label: "Đã đăng ký của tôi", count: mine.items.length },
          ]}
        />
      )}

      {tab === "mine" ? (
        mine.isLoading ? (
          <CatalogueSkeleton />
        ) : mine.error ? (
          <CatalogueError message={mine.error} />
        ) : mine.items.length === 0 ? (
          <CatalogueEmpty
            icon={BookOpen}
            title="Bạn chưa đăng ký khóa học nào"
            description="Chuyển sang tab &quot;Tất cả khóa học&quot; và bấm Đăng ký học để bắt đầu."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mine.items.map((course, index) => (
              <li key={course.id}>
                <CourseCard
                  tile={tileFor(course.title)}
                  tileVariant={TILE_TONE[index % TILE_TONE.length]}
                  coverImage={course.coverImageUrl || undefined}
                  title={course.title}
                  desc={`${course.totalChapters} chương · ${course.totalLessons} bài học`}
                  difficulty={levelToDifficulty(course.level)}
                  stats={course.durationHours ? [{ label: "giờ", value: course.durationHours }] : []}
                  completed={course.progressPercent >= 100}
                  href={`/courses/${course.courseId}`}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <StatStrip
            className="mb-5"
            stats={[
              { label: "Khóa học", value: items.length },
              { label: "Đã công khai", value: published },
              { label: "Bài học", value: totalLessons },
            ]}
          />

          <FilterBar
            className="mb-5"
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Tìm khóa học theo tên, slug, tác giả..."
            activeFilterCount={Number(level !== "all")}
            onClearFilters={() => {
              setLevel("all");
              setPage(1);
            }}
            sheetTitle="Lọc khóa học"
            controls={
              <Select
                label="Trình độ"
                value={level}
                options={LEVEL_OPTIONS}
                onChange={(v) => {
                  setLevel(v);
                  setPage(1);
                }}
              />
            }
          />

          {isLoading ? (
            <CatalogueSkeleton />
          ) : error ? (
            <CatalogueError message={error} />
          ) : visible.length === 0 ? (
            <CatalogueEmpty
              icon={BookOpen}
              title={items.length === 0 ? "Chưa có khóa học nào được công khai" : "Không có khóa học nào khớp"}
              description={
                items.length === 0
                  ? "Khóa học xuất hiện ở đây sau khi giảng viên soạn và được duyệt công khai."
                  : "Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
              }
            />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginated.map((course, index) => {
                  const enrollment = byCourse[course.id]?.enrollment ?? null;
                  const enrolled = enrollment !== null && enrollment.status !== "dropped";
                  return (
                    <li key={course.id}>
                      <CourseCard
                        tile={tileFor(course.title)}
                        tileVariant={TILE_TONE[index % TILE_TONE.length]}
                        title={course.title}
                        desc={`${course.totalChapters} chương · ${course.totalLessons} bài học`}
                        difficulty={levelToDifficulty(course.level)}
                        stats={course.durationHours ? [{ label: "giờ", value: course.durationHours }] : []}
                        completed={enrolled && enrollment.progressPercent >= 100}
                        href={`/courses/${course.id}`}
                      />
                    </li>
                  );
                })}
              </ul>
              <Pagination
                label="Phân trang khóa học"
                page={currentPage}
                pageCount={pageCount}
                onChange={setPage}
                className="mt-6"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
