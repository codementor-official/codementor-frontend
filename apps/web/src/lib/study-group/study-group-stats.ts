import type { StudyGroup, StudyGroupRole, StudyGroupSummary } from "@/types/study-group";

export const ROLE_LABEL: Record<StudyGroupRole, string> = {
  owner: "Chủ nhóm",
  deputy: "Phó nhóm",
  member: "Thành viên",
};

export function isOwned(group: StudyGroup): boolean {
  return group.role === "owner";
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 60 * 24;

/** Renders `lastActiveMinutesAgo` — the field is numeric so sorting and the label
 * can never disagree. */
export function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "vừa xong";
  if (minutesAgo < MINUTES_PER_HOUR) return `${Math.round(minutesAgo)} phút trước`;
  if (minutesAgo < MINUTES_PER_DAY) return `${Math.floor(minutesAgo / MINUTES_PER_HOUR)} giờ trước`;
  const days = Math.floor(minutesAgo / MINUTES_PER_DAY);
  return days === 1 ? "hôm qua" : `${days} ngày trước`;
}

export function summarizeGroups(groups: StudyGroup[]): StudyGroupSummary {
  const ownedCount = groups.filter(isOwned).length;
  return {
    totalGroups: groups.length,
    ownedCount,
    joinedCount: groups.length - ownedCount,
    openTaskCount: groups.reduce((sum, g) => sum + g.openTaskCount, 0),
  };
}
