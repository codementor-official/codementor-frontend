"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { FilterBar, SegmentedTabs, Select, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { EntityCard } from "@/components/entity-card";
import { Pagination } from "@/components/ui/pagination";
import {
  CatalogueEmpty,
  CatalogueError,
  CatalogueSkeleton,
} from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { api } from "@/lib/api";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { levelToDifficulty, LEVEL_OPTIONS } from "@/lib/catalogue/level";
import { MAX_PAGE_SIZE, type CourseSummary } from "@/types/catalogue";

type StatusFilter = "all" | "published" | "draft";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "published", label: "Đã công khai" },
  { value: "draft", label: "Đang soạn" },
];

const TILE_TONE = ["ink", "primary"] as const;
const PAGE_SIZE = 20;

/** Two initials from the title — the backend sends no thumbnail for a course. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
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
      .filter((c) =>
        status === "all" ? true : status === "published" ? c.status === "published" : c.status !== "published",
      )
      .filter((c) => !query || `${c.title} ${c.slug} ${c.authorName ?? ""}`.toLowerCase().includes(query));
  }, [items, search, status, level]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const published = items.filter((c) => c.status === "published").length;
  const totalLessons = items.reduce((sum, c) => sum + (c.totalLessons ?? 0), 0);

  return (
    <div>
      <PageHeader
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

      <div className="mb-4">
        <SegmentedTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
        />
      </div>

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
            {paginated.map((course, index) => (
              <li key={course.id}>
                <EntityCard
                  tile={tileFor(course.title)}
                  tileVariant={TILE_TONE[index % TILE_TONE.length]}
                  coverImage={placeholderCoverUrl(course.slug)}
                  kind={{ icon: BookOpen, label: course.authorName ?? "CodeMentor" }}
                  title={course.title}
                  description={`${course.totalChapters} chương · ${course.totalLessons} bài học`}
                  difficulty={levelToDifficulty(course.level)}
                  stats={[
                    { label: "chương", value: course.totalChapters },
                    ...(course.durationHours ? [{ label: "giờ", value: course.durationHours }] : []),
                  ]}
                  href={`/courses/${course.id}`}
                />
              </li>
            ))}
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
