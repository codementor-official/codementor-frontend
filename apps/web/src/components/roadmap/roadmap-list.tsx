import { Pagination } from "@/components/ui/pagination";
import { RoadmapCard } from "./roadmap-card";
import type { RankedRoadmap } from "@/types/roadmap";

export function RoadmapList({
  roadmaps,
  currentPage,
  pageCount,
  onPageChange,
  isFiltered,
}: {
  roadmaps: RankedRoadmap[];
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  isFiltered: boolean;
}) {
  if (roadmaps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
        <p className="mb-1 text-sm font-semibold text-navy">Không tìm thấy lộ trình phù hợp</p>
        <p className="text-xs text-text-faint">
          {isFiltered ? "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm." : "Chưa có lộ trình nào trong hệ thống."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {roadmaps.map((roadmap) => (
          <li key={roadmap.id}>
            <RoadmapCard roadmap={roadmap} />
          </li>
        ))}
      </ul>

      <Pagination
        label="Phân trang lộ trình"
        page={currentPage}
        pageCount={pageCount}
        onChange={onPageChange}
        className="mt-6"
      />
    </div>
  );
}
