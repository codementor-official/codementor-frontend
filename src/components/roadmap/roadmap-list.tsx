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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roadmaps.map((roadmap) => (
          <RoadmapCard key={roadmap.id} roadmap={roadmap} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Phân trang lộ trình" className="mt-6 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-navy hover:bg-bg disabled:cursor-not-allowed disabled:opacity-45"
          >
            Trước
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`h-9 min-w-9 rounded-md px-2 text-xs font-semibold ${page === currentPage ? "bg-navy text-on-ink" : "border border-border bg-surface text-navy hover:bg-bg"}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-navy hover:bg-bg disabled:cursor-not-allowed disabled:opacity-45"
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
