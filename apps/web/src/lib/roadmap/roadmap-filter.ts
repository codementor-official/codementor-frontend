import type { CurrentLevel } from "@/types/learning-preference";
import type { RankedRoadmap, RoadmapField } from "@/types/roadmap";

export type RoadmapSort = "relevance" | "popular" | "newest";

export interface RoadmapFilterState {
  search: string;
  field: RoadmapField | "all";
  level: CurrentLevel | "all";
  technology: string | "all";
  maxDurationHours: number | "all";
  sort: RoadmapSort;
}

export const DEFAULT_ROADMAP_FILTERS: RoadmapFilterState = {
  search: "",
  field: "all",
  level: "all",
  technology: "all",
  maxDurationHours: "all",
  sort: "relevance",
};

/** Tunables for how the full roadmap list is presented — adjust freely. */
export const ROADMAP_LIST_CONFIG = {
  /** A compact page keeps the list scannable while pagination remains easy to use. */
  pageSize: 8,
};

export function filterRoadmaps(roadmaps: RankedRoadmap[], filters: RoadmapFilterState): RankedRoadmap[] {
  const query = filters.search.trim().toLowerCase();
  return roadmaps.filter((r) => {
    if (query) {
      const haystack = `${r.title} ${r.shortDescription} ${r.technologies.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.field !== "all" && r.field !== filters.field) return false;
    if (filters.level !== "all" && r.level !== filters.level) return false;
    if (filters.technology !== "all" && !r.technologies.includes(filters.technology)) return false;
    if (filters.maxDurationHours !== "all" && r.estimatedHours > filters.maxDurationHours) return false;
    return true;
  });
}

export function sortRoadmaps(roadmaps: RankedRoadmap[], sort: RoadmapSort): RankedRoadmap[] {
  const list = [...roadmaps];
  switch (sort) {
    case "popular":
      return list.sort((a, b) => b.popularity - a.popularity);
    case "newest":
      return list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    case "relevance":
    default:
      return list.sort((a, b) => b.score - a.score);
  }
}

export function getAvailableTechnologies(roadmaps: RankedRoadmap[]): string[] {
  return Array.from(new Set(roadmaps.flatMap((r) => r.technologies))).sort();
}

export const FIELD_FILTER_OPTIONS: { value: RoadmapField | "all"; label: string }[] = [
  { value: "all", label: "Tất cả lĩnh vực" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Fullstack" },
  { value: "mobile", label: "Mobile" },
  { value: "data-ai", label: "Data & AI" },
  { value: "foundation", label: "Nền tảng lập trình" },
];

export const LEVEL_FILTER_OPTIONS: { value: CurrentLevel | "all"; label: string }[] = [
  { value: "all", label: "Tất cả trình độ" },
  { value: "none", label: "Chưa biết lập trình" },
  { value: "basic", label: "Cơ bản" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "experienced", label: "Đã có kinh nghiệm" },
];

export const DURATION_FILTER_OPTIONS: { value: number | "all"; label: string }[] = [
  { value: "all", label: "Mọi thời lượng" },
  { value: 20, label: "Dưới 20 giờ" },
  { value: 60, label: "Dưới 60 giờ" },
  { value: 100, label: "Dưới 100 giờ" },
];

export const SORT_OPTIONS: { value: RoadmapSort; label: string }[] = [
  { value: "relevance", label: "Phù hợp nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới cập nhật" },
];
