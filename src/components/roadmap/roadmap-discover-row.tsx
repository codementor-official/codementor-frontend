import { ChevronRight, type LucideIcon } from "lucide-react";
import type { RankedRoadmap } from "@/types/roadmap";

export interface QuickList {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  roadmaps: RankedRoadmap[];
}

const TILE_TONE = ["bg-navy", "bg-primary"];

export function RoadmapDiscoverRow({
  lists,
  onSelect,
}: {
  lists: QuickList[];
  onSelect: (key: string) => void;
}) {
  if (lists.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-1 text-base font-bold text-navy">Khám phá theo tiêu chí</h2>
      <p className="mb-3 text-xs text-text-faint">Xem nhanh các nhóm lộ trình được tuyển chọn sẵn.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list, i) => (
          <button
            key={list.key}
            type="button"
            onClick={() => onSelect(list.key)}
            className="group flex items-center gap-3.5 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-navy hover:shadow-card"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white ${TILE_TONE[i % TILE_TONE.length]}`}
            >
              <list.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy">{list.label}</span>
              <span className="block truncate text-xs text-text-faint">{list.description}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-text-faint group-hover:text-primary">
              {list.roadmaps.length}
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
