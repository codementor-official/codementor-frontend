"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_ROADMAP_FILTERS,
  ROADMAP_LIST_CONFIG,
  filterRoadmaps,
  sortRoadmaps,
  type RoadmapFilterState,
} from "@/lib/roadmap/roadmap-filter";
import type { RankedRoadmap } from "@/types/roadmap";

export function useRoadmapFilters(source: RankedRoadmap[]) {
  const [filters, setFiltersState] = useState<RoadmapFilterState>(DEFAULT_ROADMAP_FILTERS);
  const [visibleCount, setVisibleCount] = useState(ROADMAP_LIST_CONFIG.pageSize);

  function setFilters(patch: Partial<RoadmapFilterState>) {
    setFiltersState((prev) => ({ ...prev, ...patch }));
    setVisibleCount(ROADMAP_LIST_CONFIG.pageSize);
  }

  function resetFilters() {
    setFiltersState(DEFAULT_ROADMAP_FILTERS);
    setVisibleCount(ROADMAP_LIST_CONFIG.pageSize);
  }

  const filtered = useMemo(
    () => sortRoadmaps(filterRoadmaps(source, filters), filters.sort),
    [source, filters],
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function loadMore() {
    setVisibleCount((c) => c + ROADMAP_LIST_CONFIG.pageSize);
  }

  return { filters, setFilters, resetFilters, filtered, visible, hasMore, loadMore };
}
