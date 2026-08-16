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
  const [page, setPage] = useState(1);

  function setFilters(patch: Partial<RoadmapFilterState>) {
    setFiltersState((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function resetFilters() {
    setFiltersState(DEFAULT_ROADMAP_FILTERS);
    setPage(1);
  }

  const filtered = useMemo(
    () => sortRoadmaps(filterRoadmaps(source, filters), filters.sort),
    [source, filters],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / ROADMAP_LIST_CONFIG.pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * ROADMAP_LIST_CONFIG.pageSize,
    currentPage * ROADMAP_LIST_CONFIG.pageSize,
  );

  function goToPage(nextPage: number) {
    setPage(Math.max(1, Math.min(nextPage, pageCount)));
  }

  return { filters, setFilters, resetFilters, filtered, visible, currentPage, pageCount, goToPage };
}
