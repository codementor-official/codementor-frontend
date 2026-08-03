import type {
  Assignment,
  DocumentStatus,
  DocumentVerdict,
  ExerciseStatus,
  GroupExercise,
  GroupMember,
  PermissionKey,
  ReviewStatus,
  SubmissionStatus,
} from "@/types/study-group-detail";

type Tone = "neutral" | "navy" | "primary" | "brown";

/* Status vocabularies. Tone stays inside the two-hue system: ink for settled/positive
 * states, orange for "needs your attention", neutral for inert ones. */

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; tone: Tone }> = {
  published: { label: "Đã duyệt", tone: "navy" },
  pending: { label: "Chờ kiểm duyệt", tone: "neutral" },
  changes: { label: "Cần chỉnh sửa", tone: "primary" },
  rejected: { label: "Bị từ chối", tone: "primary" },
  hidden: { label: "Đã ẩn", tone: "neutral" },
};

/** What a member without manage rights is allowed to see: published only. Hidden and
 * unmoderated documents simply don't exist for them — not greyed out, absent. */
export function visibleDocuments<T extends { status: DocumentStatus }>(
  documents: T[],
  canManage: boolean,
): T[] {
  return canManage ? documents : documents.filter((d) => d.status === "published");
}

export const DOCUMENT_VERDICT_META: Record<DocumentVerdict, { label: string; tone: Tone }> = {
  valid: { label: "Hợp lệ", tone: "navy" },
  warning: { label: "Cần xem xét", tone: "primary" },
  invalid: { label: "Không hợp lệ", tone: "primary" },
};

export const EXERCISE_STATUS_META: Record<ExerciseStatus, { label: string; tone: Tone }> = {
  published: { label: "Đã công bố", tone: "navy" },
  draft: { label: "Bản nháp", tone: "primary" },
  closed: { label: "Tạm đóng", tone: "neutral" },
};

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  notstarted: { label: "Chưa bắt đầu", tone: "neutral" },
  inprogress: { label: "Đang làm", tone: "navy" },
  done: { label: "Hoàn thành", tone: "navy" },
  late: { label: "Quá hạn", tone: "primary" },
};

export const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; tone: Tone }> = {
  pending: { label: "Chưa đánh giá", tone: "neutral" },
  approved: { label: "Đạt", tone: "navy" },
  needsfix: { label: "Cần chỉnh sửa", tone: "primary" },
};

export const PERMISSION_LABELS: { key: PermissionKey; label: string; hint: string }[] = [
  { key: "uploadDoc", label: "Tải tài liệu lên", hint: "Thêm tài liệu mới vào kho của nhóm" },
  { key: "createExercise", label: "Tạo bài tập", hint: "Soạn bài tập thủ công hoặc nhờ AI đề xuất" },
  { key: "editExercise", label: "Chỉnh sửa bài tập", hint: "Sửa nội dung, hạn nộp và tiêu chí chấm" },
  { key: "deleteDoc", label: "Xóa tài liệu", hint: "Gỡ vĩnh viễn tài liệu khỏi nhóm" },
  { key: "reviewSubmission", label: "Duyệt bài nộp", hint: "Chấm đạt hoặc yêu cầu chỉnh sửa" },
  { key: "removeMember", label: "Xóa thành viên", hint: "Loại thành viên khỏi nhóm" },
];

/** ISO date -> dd/mm/yyyy, the format the rest of the mock data already uses. */
export function formatDueDate(iso: string | null): string {
  if (!iso) return "Chưa đặt hạn";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Mock "today" — the fixtures are dated around late July 2026, so a real `new Date()`
 * would mark everything overdue. Swap for `new Date()` when data becomes live. */
export const MOCK_TODAY = new Date(2026, 6, 24);

export function isOverdue(iso: string | null): boolean {
  return iso ? new Date(iso) < MOCK_TODAY : false;
}

export function exerciseCompletionPercent(exercise: GroupExercise): number {
  if (exercise.assignedCount === 0) return 0;
  return Math.round((exercise.completedCount / exercise.assignedCount) * 100);
}

/** Members ranked for the podium — XP first, solved count as the tiebreaker. */
export function rankMembers(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => b.xp - a.xp || b.solvedCount - a.solvedCount);
}

export interface AssignmentBoardStats {
  assignedTotal: number;
  lateCount: number;
  repeatedFailCount: number;
  notStartedCount: number;
}

export function summarizeAssignments(assignments: Assignment[]): AssignmentBoardStats {
  return {
    assignedTotal: assignments.length,
    lateCount: assignments.filter((a) => a.status === "late" || a.submissions.some((s) => s.isLate)).length,
    // Two or more failed attempts still not approved — the "needs a hand" signal.
    repeatedFailCount: assignments.filter(
      (a) => a.reviewStatus !== "approved" && a.submissions.filter((s) => s.result !== "Đạt").length >= 2,
    ).length,
    notStartedCount: assignments.filter((a) => a.submissions.length === 0).length,
  };
}
