import type { StudyGroupRole } from "@/types/study-group";

/* ---------- Members ---------- */

export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  role: StudyGroupRole;
  /** 0-100 — share of the group's assigned work this member has finished. */
  progressPercent: number;
  xp: number;
  /** Exercises solved across the whole platform, not just this group. */
  solvedCount: number;
  streakDays: number;
  joinedAt: string;
  lastActiveMinutesAgo: number;
  /** Per-member achievement rows shown in the "thành tích" modal. */
  achievements: MemberAchievement[];
}

export interface MemberAchievement {
  label: string;
  value: string;
  hint: string;
}

/* ---------- Documents ---------- */

/** AI pre-screen verdict; anything but `valid` needs a human moderator. */
export type DocumentVerdict = "valid" | "warning" | "invalid";
/** `hidden` is an owner action; `pending`/`changes`/`rejected` come from moderation.
 * Only `published` is visible to members without manage rights. */
export type DocumentStatus = "published" | "pending" | "changes" | "rejected" | "hidden";

export interface GroupDocument {
  id: string;
  title: string;
  /** File kind label (PDF, Slide, Video, Link…) — drives the type filter. */
  type: string;
  topic: string;
  uploaderName: string;
  uploadedAt: string;
  sizeLabel: string;
  status: DocumentStatus;
  /** Mock preview body — markdown/plain text for text-ish formats. */
  previewText?: string;
  /** Target for `type: "Link"` documents. */
  url?: string;
  verdict: DocumentVerdict;
}

/* ---------- Exercises ---------- */

/** `hidden` and `draft` are manager-only; members see published/closed exercises. */
export type ExerciseStatus = "published" | "draft" | "closed" | "hidden";
export type ExerciseSource = "ai" | "manual";
export type ExerciseDifficulty = "Cơ bản" | "Trung bình" | "Nâng cao";

export interface GroupExercise {
  id: string;
  title: string;
  difficulty: ExerciseDifficulty;
  source: ExerciseSource;
  status: ExerciseStatus;
  topic: string;
  xp: number;
  /** ISO date. Null when the owner hasn't set one. */
  dueAt: string | null;
  /** Members this exercise is assigned to, and how many have finished. */
  assignedCount: number;
  completedCount: number;
}

/* ---------- Assignments (Phân công & Nộp bài) ---------- */

export type SubmissionStatus = "notstarted" | "inprogress" | "done" | "late";
export type ReviewStatus = "pending" | "approved" | "needsfix";

export interface AssignmentSubmission {
  version: number;
  submittedAt: string;
  result: "Đạt" | "Không đạt";
  detail: string;
  isLate: boolean;
}

export interface Assignment {
  id: string;
  exerciseId: string;
  memberId: string;
  status: SubmissionStatus;
  reviewStatus: ReviewStatus;
  feedback: string;
  submissions: AssignmentSubmission[];
}

/* ---------- Permissions (Cài đặt → Thành viên) ---------- */

export type PermissionKey =
  | "uploadDoc"
  | "createExercise"
  | "editExercise"
  | "deleteDoc"
  | "reviewSubmission"
  | "removeMember";

/** Owner always has everything, so only the two lower roles are configurable. */
export type ConfigurableRole = Exclude<StudyGroupRole, "owner">;

export type RolePermissions = Record<ConfigurableRole, Record<PermissionKey, boolean>>;

/* ---------- Overview ---------- */

export interface GroupActivity {
  id: string;
  actor: string;
  action: string;
  minutesAgo: number;
}

export interface GroupDetail {
  documents: GroupDocument[];
  exercises: GroupExercise[];
  members: GroupMember[];
  assignments: Assignment[];
  activities: GroupActivity[];
  permissions: RolePermissions;
  /** Submissions per day for the last 7 days — feeds the overview chart. */
  submissionTrend: { label: string; value: number }[];
  createdAt: string;
  currentTopic: string;
}
