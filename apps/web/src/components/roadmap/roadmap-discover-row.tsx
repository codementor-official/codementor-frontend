import type { LucideIcon } from "lucide-react";
import type { RankedRoadmap } from "@/types/roadmap";

export interface QuickList {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  roadmaps: RankedRoadmap[];
}
export function RoadmapDiscoverRow({
  lists,
  activeKey,
  onSelect,
}: {
  lists: QuickList[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}) {
  if (lists.length === 0) return null;

  return (
    // Wraps rather than scrolls: a horizontal strip hid the last quick lists on exactly
    // the widths that had room for them, and gave the keyboard no way to reach them.
    <section className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {lists.map((list) => (
        <button
          key={list.key}
          type="button"
          onClick={() => onSelect(list.key)}
          aria-pressed={list.key === activeKey}
          className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
            list.key === activeKey ? "border-navy bg-bg" : "border-border bg-surface hover:border-navy"
          }`}
        >
          <list.icon className="h-4 w-4 text-navy" />
          <span className="text-xs font-bold text-navy">{list.label}</span>
          <span className="line-clamp-2 text-[11px] leading-relaxed text-text-faint">{list.description}</span>
        </button>
      ))}
    </section>
  );
}
