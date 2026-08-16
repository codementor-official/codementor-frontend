"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { FilterBar, SegmentedTabs, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { EntityCard } from "@/components/entity-card";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { courseCatalog, courseDifficulty, courseHref } from "@/lib/roadmap/course-catalog";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { Difficulty } from "@/components/ui/badge";

type StatusFilter = "all" | "learning" | "done" | "new";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "learning", label: "Đang học" },
  { value: "done", label: "Hoàn thành" },
  { value: "new", label: "Chưa bắt đầu" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "Mọi độ khó" },
  { value: "Cơ bản", label: "Cơ bản" },
  { value: "Trung bình", label: "Trung bình" },
  { value: "Nâng cao", label: "Nâng cao" },
];

const TILE_TONE = ["ink", "primary"] as const;
// The catalogue is 84 courses; an unbounded grid is a scroll with no end and no way back.
const PAGE_SIZE = 20;

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [roadmap, setRoadmap] = useState("all");
  const [page, setPage] = useState(1);

  const roadmapOptions = useMemo(
    () => [
      { value: "all", label: "Mọi lộ trình" },
      ...Array.from(new Map(courseCatalog.map((c) => [c.roadmapSlug, c.roadmapTitle])))
        .map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courseCatalog
      .filter((c) => roadmap === "all" || c.roadmapSlug === roadmap)
      .filter((c) => difficulty === "all" || courseDifficulty(c.level) === difficulty)
      .filter((c) =>
        status === "all"
          ? true
          : status === "learning"
            ? c.progressPercent > 0 && c.progressPercent < 100
            : status === "done"
              ? c.progressPercent >= 100
              : c.progressPercent === 0,
      )
      .filter((c) =>
        !query ||
        `${c.title} ${c.description} ${c.roadmapTitle} ${c.technologies.join(" ")}`
          .toLowerCase()
          .includes(query),
      );
  }, [search, status, difficulty, roadmap]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const inProgress = courseCatalog.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length;
  const completed = courseCatalog.filter((c) => c.progressPercent >= 100).length;
  const activeFilters = Number(difficulty !== "all") + Number(roadmap !== "all");

  return (
    <div>
      <PageHeader
        title="Khóa học"
        subtitle="Toàn bộ khóa học trên hệ thống, gộp từ mọi lộ trình. Học lẻ từng khóa hoặc theo thứ tự của một lộ trình."
      />

      <StatStrip
        className="mb-5"
        stats={[
          { label: "Khóa học", value: courseCatalog.length },
          { label: "Đang học", value: inProgress },
          { label: "Hoàn thành", value: completed },
        ]}
      />

      <div className="mb-4">
        <SegmentedTabs options={STATUS_OPTIONS} value={status} onChange={(v) => { setStatus(v as StatusFilter); setPage(1); }} />
      </div>

      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Tìm khóa học theo tên, công nghệ, lộ trình..."
        activeFilterCount={activeFilters}
        onClearFilters={() => {
          setDifficulty("all");
          setRoadmap("all");
          setPage(1);
        }}
        sheetTitle="Lọc khóa học"
        controls={
          <>
            <Select label="Lộ trình" value={roadmap} options={roadmapOptions} onChange={(v) => { setRoadmap(v); setPage(1); }} />
            <Select
              label="Độ khó"
              value={difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(v) => { setDifficulty(v as Difficulty | "all"); setPage(1); }}
            />
          </>
        }
      />

      {visible.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <BookOpen className="mx-auto mb-2 h-5 w-5 text-text-faint" />
          <p className="text-sm font-semibold text-navy">Không có khóa học nào khớp</p>
          <p className="mt-1 text-xs text-text-faint">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.</p>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {paginated.map((course, index) => (
            <EntityCard
              key={course.id}
              tile={course.thumbnail}
              tileVariant={TILE_TONE[index % TILE_TONE.length]}
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
          ))}
        </div>
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
