export type WorkspaceRole = "owner" | "deputy" | "member";

export type WorkspacePermission =
  | "upload_doc"
  | "create_exercise"
  | "edit_exercise"
  | "delete_doc"
  | "review_submission"
  | "remove_member";

export interface WorkspaceUserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface WorkspaceListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topic: string | null;
  memberCount: number;
  lastActivityAt: string;
  owner: WorkspaceUserSummary;
  memberPreview: WorkspaceUserSummary[];
  role: WorkspaceRole;
  openTaskCount: number;
  progressPercent: number;
}

export interface WorkspacePage {
  items: WorkspaceListItem[];
  nextCursor: string | null;
}

export interface WorkspaceSummary {
  total: number;
  owned: number;
  joined: number;
}

export interface WorkspaceDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topic: string | null;
  status: "active" | "archived";
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  owner: WorkspaceUserSummary;
  inviteCode: string | null;
  currentMembership: {
    id: string;
    role: WorkspaceRole;
    joinedAt: string;
    permissions: Record<WorkspacePermission, boolean>;
  };
  rolePermissions: {
    deputy: Record<WorkspacePermission, boolean>;
    member: Record<WorkspacePermission, boolean>;
  } | null;
}

export interface WorkspaceMember {
  id: string;
  user: WorkspaceUserSummary;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceMembersPage {
  items: WorkspaceMember[];
  nextCursor: string | null;
  canManage: boolean;
}

export interface WorkspaceOverview {
  documents: { total: number; published: number; pending: number };
  exercises: { total: number; open: number };
  assignments: { total: number; completed: number; inProgress: number; notStarted: number; late: number; completionRate: number };
  submissions: { total: number; accepted: number; failed: number; acceptanceRate: number; averageScore: number; averageAttempts: number; maxAttempts: number };
  members: Array<{
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    role: WorkspaceRole;
    joinedAt: string;
    xp: number;
    solvedCount: number;
    streakDays: number;
    assignedCount: number;
    completedCount: number;
    completionRate: number;
    submissionCount: number;
    acceptedCount: number;
    averageScore: number;
    activityCount: number;
  }>;
  activities: Array<{ id: string; actor: string | null; action: string; targetType: string | null; createdAt: string }>;
  submissionTrend: Array<{ label: string; value: number }>;
  completionTrend: Array<{ label: string; value: number }>;
  activityTrend: Array<{ label: string; value: number }>;
  progressDistribution: Array<{ key: string; label: string; value: number }>;
  memberCount: number;
  createdAt: string;
  topic: string | null;
}

export interface WorkspaceContentPage<T> { items: T[]; page: number; limit: number; total: number; totalPages: number }
export interface WorkspaceDocument { id: string; title: string; docType: string; topic: string | null; uploaderId: string | null; uploaderName: string | null; sizeBytes: string | number | null; storageKey: string | null; url: string | null; previewText: string | null; status: "published" | "pending" | "changes" | "rejected" | "hidden"; aiVerdict: string; uploadedAt: string }
export interface WorkspaceExercise { id: string; exerciseId: string; slug: string; title: string; summary: string | null; difficulty: "easy" | "medium" | "hard"; status: string; source: string; xp: number; dueAt: string | null; attemptLimit: number | null; allowRetry: boolean; allowLateSubmission: boolean; phase: string | null; assignedCount: number; completedCount: number }
export interface WorkspaceAssignment { id: string; groupExerciseId: string; exerciseId: string; exerciseSlug: string; exerciseTitle: string; memberId: string; memberName: string; status: "notstarted" | "inprogress" | "done" | "late"; reviewStatus: "pending" | "approved" | "needsfix"; feedback: string | null; startedAt: string | null; updatedAt: string; submissionCount: number; latestVerdict: string | null; latestScore: number | null; latestAttemptNumber: number | null; latestIsLate: boolean; latestSubmittedAt: string | null }
export interface WorkspaceUploadConfig { enabled: boolean; maxBytes: number; acceptedTypes: string[] }
export interface PresignedWorkspaceUpload { uploadUrl: string; headers: Record<string, string>; publicUrl: string; objectKey: string; expiresInSeconds: number }
