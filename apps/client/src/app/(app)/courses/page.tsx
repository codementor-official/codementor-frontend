"use client";

import { useMemo, useState } from "react";
import { BookOpen, Check, Loader2, PlayCircle, Plus, RotateCcw } from "lucide-react";
import { FilterBar, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { EntityCard } from "@/components/entity-card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  CatalogueEmpty,
  CatalogueError,
  CatalogueSkeleton,
} from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { levelToDifficulty, LEVEL_OPTIONS } from "@/lib/catalogue/level";
import { MAX_PAGE_SIZE, type CourseProgress, type CourseSummary } from "@/types/catalogue";

const TILE_TONE = ["ink", "primary"] as const;
const PAGE_SIZE = 20;

/** Two initials from the title — the backend sends no thumbnail for a course. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

/**
 * The card's bottom row: enrol, resume, or review.
 *
 * Its own component because each card needs its own in-flight state — one shared flag
 * would grey out every button on the page while one of them enrols.
 */
function CourseCardAction({
  courseId,
  progress,
  onEnrolled,
}: {
  courseId: string;
  progress: CourseProgress | undefined;
  onEnrolled: () => Promise<void>;
}) {
  const [enrolling, setEnrolling] = useState(false);
  const [failed, setFailed] = useState(false);

  const enrollment = progress?.enrollment ?? null;
  const enrolled = enrollment !== null && enrollment.status !== "dropped";

  if (enrolled) {
    // First lesson still open, or the first lesson overall once everything is done — that is
    // where "xem lại" should land.
    const next = progress?.lessons.find((l) => l.status !== "completed" && l.isAvailable);
    const done = !next;
    const target = next ?? progress?.lessons[0];
    return (
      <Button
        href={target ? `/courses/${courseId}/lessons/${target.lessonId}` : `/courses/${courseId}`}
        size="sm"
        variant={done ? "outline" : "primary"}
        className="w-full"
      >
        {done ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" /> Xem lại
          </>
        ) : (
          <>
            <PlayCircle className="h-3.5 w-3.5" /> Tiếp tục học
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="w-full"
      disabled={enrolling}
      onClick={async () => {
        setEnrolling(true);
        setFailed(false);
        try {
          await api.courses.enroll(courseId);
          await onEnrolled();
        } catch {
          setFailed(true);
        } finally {
          setEnrolling(false);
        }
      }}
    >
      {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
      {failed ? "Thử lại" : "Đăng ký học"}
    </Button>
  );
}

export default function CoursesPage() {
  const { status: authStatus } = useAuth();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);

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

  // Only the cards on screen: enrolment is one request per course.
  const { byCourse, refresh } = useCourseProgress(
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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {paginated.map((course, index) => {
              const progress = byCourse[course.id];
              const enrollment = progress?.enrollment ?? null;
              const enrolled = enrollment !== null && enrollment.status !== "dropped";
              return (
                <li key={course.id}>
                  <EntityCard
                    tile={tileFor(course.title)}
                    tileVariant={TILE_TONE[index % TILE_TONE.length]}
                    coverImage={placeholderCoverUrl(course.slug)}
                    kind={{ icon: BookOpen, label: course.authorName ?? "CodeMentor" }}
                    title={course.title}
                    description={`${course.totalChapters} chương · ${course.totalLessons} bài học`}
                    difficulty={levelToDifficulty(course.level)}
                    badge={
                      enrolled && enrollment.progressPercent >= 100 ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-2xs font-bold text-primary">
                          <Check className="h-3 w-3" /> Hoàn thành
                        </span>
                      ) : undefined
                    }
                    stats={[
                      { label: "chương", value: course.totalChapters },
                      ...(course.durationHours ? [{ label: "giờ", value: course.durationHours }] : []),
                    ]}
                    progress={enrolled ? enrollment.progressPercent : undefined}
                    action={
                      authStatus === "authenticated" ? (
                        <CourseCardAction
                          courseId={course.id}
                          progress={progress}
                          onEnrolled={() => refresh(course.id)}
                        />
                      ) : undefined
                    }
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
    </div>
  );
}
