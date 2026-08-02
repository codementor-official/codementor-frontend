/** Your standing in a group. `owner` groups appear under "Nhóm do bạn tạo",
 * everything else under "Nhóm bạn đã tham gia". */
export type StudyGroupRole = "owner" | "deputy" | "member";

export interface StudyGroup {
  /** Slug — also the `/workspace/[groupId]` route segment. */
  id: string;
  /** Short monospace glyph shown on the card tile (see `data/roadmaps.ts` for the convention). */
  tile: string;
  name: string;
  description: string;
  /** Invite code members join with — matched by the "tham gia bằng mã" box. */
  code: string;
  /** Subject the group is currently working through. */
  topic: string;
  memberCount: number;
  /** Assignments still open in the group. */
  openTaskCount: number;
  /** 0-100. Group-wide progress when you own it, your own progress when you joined. */
  progressPercent: number;
  lastActiveLabel: string;
  role: StudyGroupRole;
  ownerName: string;
}

export interface StudyGroupSummary {
  totalGroups: number;
  ownedCount: number;
  joinedCount: number;
  /** Mean of `progressPercent` across every group, rounded. */
  averageProgress: number;
  /** Everyone you study alongside, excluding yourself once per group. */
  peerCount: number;
  openTaskCount: number;
}
