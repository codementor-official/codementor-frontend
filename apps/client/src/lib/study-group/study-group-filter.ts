import type { StudyGroup } from "@/types/study-group";

export type StudyGroupSort = "recent" | "progress" | "members" | "name";

export interface StudyGroupFilterState {
  search: string;
  topic: string | "all";
  sort: StudyGroupSort;
}

export const DEFAULT_STUDY_GROUP_FILTERS: StudyGroupFilterState = {
  search: "",
  topic: "all",
  sort: "recent",
};

export function filterGroups(groups: StudyGroup[], filters: StudyGroupFilterState): StudyGroup[] {
  const query = filters.search.trim().toLowerCase();
  return groups.filter((g) => {
    if (filters.topic !== "all" && g.topic !== filters.topic) return false;
    if (!query) return true;
    // Code is searchable too — pasting an invite code you already joined should find it.
    return `${g.name} ${g.description} ${g.topic} ${g.code} ${g.ownerName}`.toLowerCase().includes(query);
  });
}

export function sortGroups(groups: StudyGroup[], sort: StudyGroupSort): StudyGroup[] {
  const list = [...groups];
  switch (sort) {
    case "progress":
      return list.sort((a, b) => b.progressPercent - a.progressPercent);
    case "members":
      return list.sort((a, b) => b.memberCount - a.memberCount);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    case "recent":
    default:
      return list.sort((a, b) => a.lastActiveMinutesAgo - b.lastActiveMinutesAgo);
  }
}

export function getAvailableTopics(groups: StudyGroup[]): string[] {
  return Array.from(new Set(groups.map((g) => g.topic))).sort((a, b) => a.localeCompare(b, "vi"));
}

/** Filters that are actually narrowing the list — drives `FilterBar`'s count badge. */
export function countActiveFilters(filters: StudyGroupFilterState): number {
  let count = 0;
  if (filters.topic !== "all") count += 1;
  if (filters.sort !== DEFAULT_STUDY_GROUP_FILTERS.sort) count += 1;
  return count;
}

export const STUDY_GROUP_SORT_OPTIONS: { value: StudyGroupSort; label: string }[] = [
  { value: "recent", label: "Hoạt động gần nhất" },
  { value: "progress", label: "Tiến độ cao nhất" },
  { value: "members", label: "Nhiều thành viên nhất" },
  { value: "name", label: "Tên A–Z" },
];
