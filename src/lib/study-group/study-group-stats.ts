import type { StudyGroup, StudyGroupRole, StudyGroupSummary } from "@/types/study-group";

export const ROLE_LABEL: Record<StudyGroupRole, string> = {
  owner: "Chủ nhóm",
  deputy: "Phó nhóm",
  member: "Thành viên",
};

export function isOwned(group: StudyGroup): boolean {
  return group.role === "owner";
}

export function summarizeGroups(groups: StudyGroup[]): StudyGroupSummary {
  const owned = groups.filter(isOwned);
  const totalProgress = groups.reduce((sum, g) => sum + g.progressPercent, 0);
  return {
    totalGroups: groups.length,
    ownedCount: owned.length,
    joinedCount: groups.length - owned.length,
    averageProgress: groups.length ? Math.round(totalProgress / groups.length) : 0,
    // Everyone but you in each group; a person in two groups is counted twice, which
    // is what "bạn học cùng" means here without a real cross-group identity join.
    peerCount: groups.reduce((sum, g) => sum + Math.max(0, g.memberCount - 1), 0),
    openTaskCount: groups.reduce((sum, g) => sum + g.openTaskCount, 0),
  };
}
