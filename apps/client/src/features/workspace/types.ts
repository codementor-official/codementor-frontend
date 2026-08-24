export type WorkspaceRole = "owner" | "deputy" | "member";

export type WorkspacePermission =
  | "view_doc"
  | "upload_doc"
  | "edit_own_doc"
  | "delete_own_doc"
  | "manage_doc"
  | "approve_doc"
  | "view_exercise"
  | "create_exercise"
  | "edit_own_exercise"
  | "delete_own_exercise"
  | "manage_exercise"
  | "assign_exercise"
  | "edit_exercise"
  | "delete_doc"
  | "review_submission"
  | "remove_member";

export interface WorkspaceUserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  handle?: string;
  email?: string;
}

export interface WorkspaceListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topic: string | null;
  memberCount: number;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverPosition: "top" | "center" | "bottom";
  coverFit: "cover" | "contain";
  coverHeight: "compact" | "medium" | "tall";
  privacy: "public" | "private";
  joinPolicy: "open" | "approval" | "invite_only";
  lastActivityAt: string;
  owner: WorkspaceUserSummary;
  memberPreview: WorkspaceUserSummary[];
  role: WorkspaceRole | null;
  openTaskCount: number;
  progressPercent: number;
  unreadCount: number;
}

export interface WorkspacePage {
  items: WorkspaceListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WorkspaceSummary {
  total: number;
  owned: number;
  joined: number;
  unreadCount: number;
}

export interface WorkspaceDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topic: string | null;
  status: "active" | "archived";
  memberCount: number;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverKey: string | null;
  coverPosition: "top" | "center" | "bottom";
  coverFit: "cover" | "contain";
  coverHeight: "compact" | "medium" | "tall";
  privacy: "public" | "private";
  joinPolicy: "open" | "approval" | "invite_only";
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
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  canManage: boolean;
  canViewPrivate: boolean;
}

export interface WorkspaceMemberDetail extends WorkspaceMember {
  xp: number;
  solvedCount: number;
  currentStreakDays: number;
  longestStreakDays: number;
  activeDays: number;
  lastActiveAt: string | null;
  activityHeatmap: Array<{ date: string; count: number }>;
  assignmentStats: {
    assigned: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  submissionStats: {
    total: number;
    accepted: number;
    failed: number;
    averageScore: number;
  };
  access: "public" | "manager";
  recentActivities?: Array<{
    id: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
  }>;
  permissions?: Record<WorkspacePermission, boolean>;
  roleDefaults?: Record<WorkspacePermission, boolean>;
  overrides?: Partial<Record<WorkspacePermission, boolean>>;
  canManagePermissions: boolean;
}

export interface WorkspaceJoinRequest {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user: WorkspaceUserSummary;
}

export interface WorkspaceOverview {
  documents: { total: number; published: number; pending: number };
  exercises: { total: number; open: number };
  assignments: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    late: number;
    completionRate: number;
  };
  submissions: {
    total: number;
    accepted: number;
    failed: number;
    acceptanceRate: number;
    averageScore: number;
    averageAttempts: number;
    maxAttempts: number;
  };
  members: Array<{
    id: string;
    displayName: string;
    email?: string;
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
    lastActiveAt: string | null;
  }>;
  activities: Array<{
    id: string;
    actor: string | null;
    action: string;
    targetType: string | null;
    createdAt: string;
  }>;
  activityPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  submissionTrend: Array<{ label: string; value: number }>;
  completionTrend: Array<{ label: string; value: number }>;
  activityTrend: Array<{ label: string; value: number }>;
  progressDistribution: Array<{ key: string; label: string; value: number }>;
  memberCount: number;
  createdAt: string;
  topic: string | null;
}

export interface WorkspaceContentPage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface WorkspaceDocument {
  id: string;
  title: string;
  docType: string;
  topic: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  sizeBytes: string | number | null;
  storageKey: string | null;
  url: string | null;
  previewText: string | null;
  status:
    "published" | "pending" | "changes" | "rejected" | "hidden" | "removed";
  aiVerdict: string;
  uploadedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}
export interface WorkspaceExercise {
  id: string;
  exerciseId: string;
  slug: string;
  title: string;
  summary: string | null;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  source: string;
  authorId: string | null;
  publicationStatus: "published" | "hidden";
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  canEdit: boolean;
  canDelete: boolean;
  xp: number;
  estimatedMinutes: number | null;
  timeLimitMs: number;
  memoryLimitKb: number;
  dueAt: string | null;
  attemptLimit: number | null;
  allowRetry: boolean;
  allowLateSubmission: boolean;
  phase: string | null;
  assignedCount: number;
  completedCount: number;
  isAssignedToMe: boolean;
  myAssignment: {
    id: string;
    status: string;
    submissionCount: number;
    latestVerdict: string | null;
  } | null;
}
export interface WorkspaceAssignment {
  id: string;
  groupExerciseId: string;
  exerciseId: string;
  exerciseSlug: string;
  exerciseTitle: string;
  memberId: string;
  memberName: string;
  status: "notstarted" | "inprogress" | "done" | "late";
  reviewStatus: "pending" | "approved" | "needsfix";
  feedback: string | null;
  startedAt: string | null;
  updatedAt: string;
  submissionCount: number;
  latestVerdict: string | null;
  latestScore: number | null;
  latestAttemptNumber: number | null;
  latestIsLate: boolean;
  latestSubmittedAt: string | null;
}
export interface WorkspaceExerciseDetail extends WorkspaceExercise {
  assignedMemberIds?: string[];
  /** Compatibility with workspace-service instances that have not restarted yet. */
  assignments?: WorkspaceAssignment[];
  content: Record<string, unknown> | null;
  canManage: boolean;
  canReview: boolean;
}
export interface WorkspaceSubmission {
  id: string;
  userId: string;
  language: string;
  sourceCode: string;
  verdict: string;
  score: number | null;
  passedTests: number | null;
  totalTests: number | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  attemptNumber: number;
  isLate: boolean;
  note: string | null;
  runDetailRef: string | null;
  submittedAt: string;
  runDetail: {
    compile?: { success?: boolean; stderr?: string; durationMs?: number };
    cases?: Array<{
      order: number;
      passed: boolean;
      visibility?: string;
      input?: string;
      expected?: string;
      actual?: string;
      stderr?: string;
      runtimeMs?: number;
      memoryKb?: number;
      verdict?: string;
    }>;
    consoleOutput?: string;
    judge?: Record<string, string>;
  } | null;
}
export interface WorkspaceUploadConfig {
  enabled: boolean;
  maxBytes: number;
  acceptedTypes: string[];
}
export interface PresignedWorkspaceUpload {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

export interface WorkspaceMessage {
  id: string;
  workspaceId: string;
  senderId: string;
  sender: {
    displayName: string;
    avatarUrl: string | null;
  };
  content: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WorkspaceMessagePage {
  items: WorkspaceMessage[];
  nextCursor: string | null;
}
