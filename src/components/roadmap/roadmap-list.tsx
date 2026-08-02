import { RoadmapCard } from "./roadmap-card";
import { ROADMAP_LIST_CONFIG } from "@/lib/roadmap/roadmap-filter";
import type { RankedRoadmap } from "@/types/roadmap";

export function RoadmapList({
  roadmaps,
  hasMore,
  onLoadMore,
  isFiltered,
}: {
  roadmaps: RankedRoadmap[];
  hasMore: boolean;
  onLoadMore: () => void;
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

  const showDivider = !isFiltered && roadmaps.length > ROADMAP_LIST_CONFIG.highRelevanceCount;
  const primary = showDivider ? roadmaps.slice(0, ROADMAP_LIST_CONFIG.highRelevanceCount) : roadmaps;
  const rest = showDivider ? roadmaps.slice(ROADMAP_LIST_CONFIG.highRelevanceCount) : [];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((r) => (
          <RoadmapCard key={r.id} roadmap={r} />
        ))}
      </div>

      {showDivider && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-text-faint">
            <span className="h-px flex-1 bg-border" /> Các lộ trình khác <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} />
            ))}
          </div>
        </>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-5 w-full rounded-md border border-border bg-surface py-2.5 text-sm font-semibold text-navy hover:bg-bg"
        >
          Xem thêm lộ trình
        </button>
      )}
    </div>
  );
}
