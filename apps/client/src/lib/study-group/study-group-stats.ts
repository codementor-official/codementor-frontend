import type { WorkspaceListItem } from "@/features/workspace/types";
import type {
  StudyGroup,
  StudyGroupRole,
  StudyGroupSummary,
} from "@/types/study-group";

export const ROLE_LABEL: Record<StudyGroupRole, string> = {
  owner: "Chủ nhóm",
  deputy: "Phó nhóm",
  member: "Thành viên",
  guest: "Khám phá",
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
  if (minutesAgo < MINUTES_PER_HOUR)
    return `${Math.round(minutesAgo)} phút trước`;
  if (minutesAgo < MINUTES_PER_DAY)
    return `${Math.floor(minutesAgo / MINUTES_PER_HOUR)} giờ trước`;
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

/** Read model → thẻ nhóm. Dùng chung cho danh sách nhóm và dải đề xuất, để hai chỗ
 * không bao giờ hiển thị cùng một nhóm bằng hai bộ số khác nhau. */
export function toStudyGroup(group: WorkspaceListItem): StudyGroup {
  const now = Date.now();
  return {
    id: group.slug,
    tile: initialsOf(group.name),
    name: group.name,
    description: group.description ?? "Chưa có mô tả cho nhóm học tập này.",
    coverUrl: group.coverUrl,
    coverPosition: group.coverPosition,
    coverFit: group.coverFit,
    coverHeight: group.coverHeight,
    code: "",
    topic: group.topic ?? "Chưa phân loại",
    memberCount: group.memberCount,
    memberPreview: group.memberPreview.map((member) => ({
      id: member.id,
      initials: initialsOf(member.displayName),
      name: member.displayName,
    })),
    openTaskCount: group.openTaskCount,
    progressPercent: group.progressPercent,
    unreadCount: group.unreadCount,
    lastActiveMinutesAgo: Math.max(
      0,
      Math.floor((now - new Date(group.lastActivityAt).getTime()) / 60_000),
    ),
    role: group.role ?? "guest",
    ownerName: group.owner.displayName,
  };
}

export function initialsOf(value: string): string {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "NH"
  );
}
