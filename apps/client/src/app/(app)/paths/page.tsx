"use client";

import { useMemo, useState } from "react";
import { Map } from "lucide-react";
import { FilterBar, Select, StatStrip } from "@codementor/ui";
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
import {
  FIELD_LABEL,
  FIELD_OPTIONS,
  LEVEL_OPTIONS,
  levelToDifficulty,
} from "@/lib/catalogue/level";
import { MAX_PAGE_SIZE, type RoadmapSummary } from "@/types/catalogue";

const PAGE_SIZE = 20;
const TILE_TONE = ["ink", "primary"] as const;

function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

export default function PathsPage() {
  const [search, setSearch] = useState("");
  const [field, setField] = useState("all");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);

  const { items, isLoading, error } = useCatalogue<RoadmapSummary>(() =>
    api.roadmaps.catalogue({ limit: MAX_PAGE_SIZE }),
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((r) => field === "all" || r.field === field)
      .filter((r) => level === "all" || r.level === level)
      .filter((r) => !query || `${r.title} ${r.slug} ${r.authorName ?? ""}`.toLowerCase().includes(query));
  }, [items, search, field, level]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCourses = items.reduce((sum, r) => sum + (r.courseCount ?? 0), 0);
  const fields = new Set(items.map((r) => r.field)).size;

  return (
    <div>
      <PageHeader
        title="Lộ trình"
        subtitle="Mỗi lộ trình gộp nhiều khóa học theo một hướng nghề nghiệp, sắp xếp sẵn thứ tự để bạn không phải tự mò mẫm nên học gì trước."
      />

      <StatStrip
        className="mb-5"
        stats={[
          { label: "Lộ trình", value: items.length },
          { label: "Khóa học", value: totalCourses },
          { label: "Lĩnh vực", value: fields },
        ]}
      />

      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm lộ trình theo tên, slug, tác giả..."
        activeFilterCount={Number(field !== "all") + Number(level !== "all")}
        onClearFilters={() => {
          setField("all");
          setLevel("all");
          setPage(1);
        }}
        sheetTitle="Lọc lộ trình"
        controls={
          <>
            <Select
              label="Lĩnh vực"
              value={field}
              options={FIELD_OPTIONS}
              onChange={(v) => {
                setField(v);
                setPage(1);
              }}
            />
            <Select
              label="Trình độ"
              value={level}
              options={LEVEL_OPTIONS}
              onChange={(v) => {
                setLevel(v);
                setPage(1);
              }}
            />
          </>
        }
      />

      {isLoading ? (
        <CatalogueSkeleton />
      ) : error ? (
        <CatalogueError message={error} />
      ) : visible.length === 0 ? (
        <CatalogueEmpty
          icon={Map}
          title={items.length === 0 ? "Chưa có lộ trình nào được công khai" : "Không có lộ trình nào khớp"}
          description={
            items.length === 0
              ? "Lộ trình xuất hiện ở đây sau khi giảng viên soạn và được duyệt công khai."
              : "Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {paginated.map((roadmap, index) => (
              <li key={roadmap.id}>
                <EntityCard
                  tile={tileFor(roadmap.title)}
                  tileVariant={TILE_TONE[index % TILE_TONE.length]}
                  coverImage={placeholderCoverUrl(roadmap.slug)}
                  kind={{ icon: Map, label: FIELD_LABEL[roadmap.field] ?? roadmap.field }}
                  title={roadmap.title}
                  description={`${roadmap.courseCount} khóa học${roadmap.authorName ? ` · ${roadmap.authorName}` : ""}`}
                  difficulty={levelToDifficulty(roadmap.level)}
                  stats={[
                    { label: "khóa học", value: roadmap.courseCount },
                    ...(roadmap.estimatedHours ? [{ label: "giờ", value: roadmap.estimatedHours }] : []),
                  ]}
                  // No href yet: /paths/[pathId] still reads the mock catalogue, so a real
                  // backend slug would land on a detail page that cannot find it. Wire the
                  // detail route to the backend and this becomes one line.
                />
              </li>
            ))}
          </ul>
          <Pagination
            label="Phân trang lộ trình"
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
