"use client";

import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import {
  DEFAULT_ROADMAP_FILTERS,
  DURATION_FILTER_OPTIONS,
  FIELD_FILTER_OPTIONS,
  LEVEL_FILTER_OPTIONS,
  SORT_OPTIONS,
  type RoadmapFilterState,
  type RoadmapSort,
} from "@/lib/roadmap/roadmap-filter";
import type { CurrentLevel } from "@/types/learning-preference";
import type { RoadmapField } from "@/types/roadmap";

export function RoadmapFilterBar({
  filters,
  onChange,
  onClear,
  technologyOptions,
}: {
  filters: RoadmapFilterState;
  onChange: (patch: Partial<RoadmapFilterState>) => void;
  onClear: () => void;
  technologyOptions: string[];
}) {
  const activeFilterCount = [
    filters.search !== DEFAULT_ROADMAP_FILTERS.search,
    filters.field !== DEFAULT_ROADMAP_FILTERS.field,
    filters.level !== DEFAULT_ROADMAP_FILTERS.level,
    filters.technology !== DEFAULT_ROADMAP_FILTERS.technology,
    filters.maxDurationHours !== DEFAULT_ROADMAP_FILTERS.maxDurationHours,
  ].filter(Boolean).length;

  const controls = (
    <>
      <Select
        label="Lĩnh vực"
        value={filters.field}
        options={FIELD_FILTER_OPTIONS}
        onChange={(v) => onChange({ field: v as RoadmapField | "all" })}
      />
      <Select
        label="Trình độ"
        value={filters.level}
        options={LEVEL_FILTER_OPTIONS}
        onChange={(v) => onChange({ level: v as CurrentLevel | "all" })}
      />
      <Select
        label="Công nghệ"
        value={filters.technology}
        options={[{ value: "all", label: "Tất cả công nghệ" }, ...technologyOptions.map((t) => ({ value: t, label: t }))]}
        onChange={(v) => onChange({ technology: v })}
      />
      <Select
        label="Thời lượng"
        value={String(filters.maxDurationHours)}
        options={DURATION_FILTER_OPTIONS.map((d) => ({ value: String(d.value), label: d.label }))}
        onChange={(v) => onChange({ maxDurationHours: v === "all" ? "all" : Number(v) })}
      />
      <Select
        label="Sắp xếp"
        value={filters.sort}
        options={SORT_OPTIONS}
        onChange={(v) => onChange({ sort: v as RoadmapSort })}
      />
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="h-9 rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary-tint"
        >
          Xóa bộ lọc
        </button>
      )}
    </>
  );

  return (
    <FilterBar
      searchValue={filters.search}
      onSearchChange={(v) => onChange({ search: v })}
      searchPlaceholder="Tìm lộ trình theo tên, công nghệ..."
      controls={controls}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClear}
      displayMode="inline"
    />
  );
}
