"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapIcon } from "lucide-react";
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
import { MAX_PAGE_SIZE, type RoadmapDetail, type RoadmapSummary } from "@/types/catalogue";

const PAGE_SIZE = 20;
const TILE_TONE = ["ink", "primary"] as const;
const CHIP_LIMIT = 3;

function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

/** Tên vài khóa đầu tiên làm chip — xem trước nội dung lộ trình mà không phải mở nó ra. */
function courseChips(detail: RoadmapDetail | undefined): string[] {
  if (!detail) return [];
  const ordered = [...detail.courses].sort((a, b) => a.position - b.position);
  const shown = ordered.slice(0, CHIP_LIMIT).map((course) => course.title);
  const rest = ordered.length - shown.length;
  return rest > 0 ? [...shown, `+${rest} khóa nữa`] : shown;
}

export default function RoadmapsPage() {
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

  // Mô tả và danh sách khóa chỉ có trong payload chi tiết — `RoadmapSummary` không mang
  // theo. Tải cho ĐÚNG những lộ trình đang hiện trên trang, mỗi cái một lần; một lộ trình
  // lỗi thì thẻ của nó lùi về mô tả rút gọn thay vì kéo sập cả danh sách.
  const [details, setDetails] = useState<Map<string, RoadmapDetail>>(() => new Map());
  const requested = useRef(new Set<string>());
  const visibleIds = paginated.map((roadmap) => roadmap.id).join(",");

  useEffect(() => {
    const fresh = visibleIds.split(",").filter((id) => id && !requested.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => requested.current.add(id));
    fresh.forEach((id) =>
      api.roadmaps
        .detail(id)
        .then((detail) => setDetails((prev) => new Map(prev).set(id, detail)))
        .catch(() => requested.current.delete(id)),
    );
  }, [visibleIds]);

  const totalCourses = items.reduce((sum, r) => sum + (r.courseCount ?? 0), 0);
  const fields = new Set(items.map((r) => r.field)).size;

  return (
    <div>
      <PageHeader
        icon={MapIcon}
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
          icon={MapIcon}
          title={items.length === 0 ? "Chưa có lộ trình nào được công khai" : "Không có lộ trình nào khớp"}
          description={
            items.length === 0
              ? "Lộ trình xuất hiện ở đây sau khi giảng viên soạn và được duyệt công khai."
              : "Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
          }
        />
      ) : (
        <>
          {/* Mỗi lộ trình một dòng, không phải lưới: một lộ trình là cả một hướng nghề
            * nghiệp, và thứ giúp chọn là mô tả cộng danh sách khóa bên trong — cả hai đều
            * không đọc nổi trong một ô hẹp bằng 1/4 màn hình. */}
          <ul className="flex flex-col gap-3">
            {paginated.map((roadmap, index) => {
              const detail = details.get(roadmap.id);
              return (
                <li key={roadmap.id}>
                  <EntityCard
                    layout="horizontal"
                    tile={tileFor(roadmap.title)}
                    tileVariant={TILE_TONE[index % TILE_TONE.length]}
                    coverImage={placeholderCoverUrl(roadmap.slug)}
                    kind={{ icon: MapIcon, label: FIELD_LABEL[roadmap.field] ?? roadmap.field }}
                    title={roadmap.title}
                    description={
                      detail?.shortDescription ??
                      detail?.description ??
                      `Lộ trình ${roadmap.courseCount} khóa học${roadmap.authorName ? ` · ${roadmap.authorName}` : ""}`
                    }
                    // Độ khó xuống hàng số liệu, KHÔNG để cạnh chip: hàng chip giờ toàn tên
                    // khóa học, thêm một badge "Cơ bản" vào đó thì nó đọc như tên khóa thứ ba.
                    tags={courseChips(detail)}
                    stats={[
                      { label: "", value: levelToDifficulty(roadmap.level) },
                      { label: "khóa học", value: roadmap.courseCount },
                      ...(roadmap.estimatedHours ? [{ label: "giờ", value: roadmap.estimatedHours }] : []),
                      ...(roadmap.authorName ? [{ label: "", value: roadmap.authorName }] : []),
                    ]}
                    href={`/roadmaps/${roadmap.id}`}
                  />
                </li>
              );
            })}
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
