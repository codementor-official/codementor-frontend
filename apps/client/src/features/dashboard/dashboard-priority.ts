import type { DashboardData } from './dashboard-service';
import type { DashboardInsight } from './types';

export interface DashboardAction {
  id: string;
  kind: 'assignment' | 'course' | 'roadmap' | 'coach' | 'practice';
  title: string;
  href: string;
  label: string;
  reason: string;
  cta: string;
  progress?: number;
  status?: string;
}

const DAY = 24 * 60 * 60 * 1000;

function assignmentAction(data: DashboardData, index = 0): DashboardAction | null {
  const assignment = data.assignments?.[index];
  if (!assignment) return null;
  const due = assignment.dueAt ? Date.parse(assignment.dueAt) : null;
  const overdue = due !== null && due < data.fetchedAt;
  return {
    id: assignment.id,
    kind: 'assignment',
    title: assignment.exerciseTitle,
    href: `/workspace/${assignment.workspaceSlug}?tab=exercises`,
    label: overdue ? 'Bài nhóm đã quá hạn' : 'Bài tập nhóm',
    reason: overdue
      ? `${assignment.workspaceName} · Kiểm tra khả năng nộp muộn ngay.`
      : `${assignment.workspaceName} · ${assignment.dueAt ? 'Ưu tiên theo hạn nộp.' : 'Bài đang chờ bạn xử lý.'}`,
    cta: 'Mở bài tập',
    status: overdue ? 'Quá hạn' : assignment.status === 'inprogress' ? 'Đang làm' : 'Chưa làm',
  };
}

function newestLearningAction(data: DashboardData): DashboardAction | null {
  const items = [
    ...(data.learning?.courses ?? [])
      .filter((item) => item.status === 'active' || item.status === 'paused')
      .map((item) => ({
        id: item.id,
        kind: 'course' as const,
        title: item.title,
        href: `/courses/${item.courseId}`,
        label: 'Bài học đang dở',
        reason: `Đã hoàn thành ${Math.round(item.progressPercent)}%. Tiếp tục từ tiến độ đã lưu.`,
        cta: 'Tiếp tục học',
        progress: item.progressPercent,
        date: item.lastActivityAt ?? item.startedAt,
      })),
    ...(data.learning?.roadmaps ?? [])
      .filter((item) => item.status === 'active' || item.status === 'paused')
      .map((item) => ({
        id: item.id,
        kind: 'roadmap' as const,
        title: item.title,
        href: `/roadmaps/${item.roadmapId}`,
        label: 'Lộ trình đang học',
        reason: `Đã hoàn thành ${Math.round(item.progressPercent)}%. Tiếp tục theo lộ trình của bạn.`,
        cta: 'Tiếp tục lộ trình',
        progress: item.progressPercent,
        date: item.lastActivityAt ?? item.startedAt,
      })),
  ];
  const selected = items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  if (!selected) return null;
  const { date, ...action } = selected;
  return data.fetchedAt - Date.parse(date) > 7 * DAY
    ? { ...action, reason: `Quay lại bằng một bước ngắn. Tiến độ ${Math.round(action.progress)}% của bạn vẫn được lưu.` }
    : action;
}

function appliedCoachAction(coach: DashboardInsight | null): DashboardAction | null {
  const step = coach?.appliedAt ? coach.insight?.steps[0] : null;
  return step
    ? {
        id: `coach:${step.href}`,
        kind: 'coach',
        title: step.title,
        href: step.href,
        label: 'Đã thêm từ AI Coach',
        reason: step.task,
        cta: 'Mở nội dung',
        status: 'Trong kế hoạch',
      }
    : null;
}

export function selectPrimaryAction(
  data: DashboardData,
  coach: DashboardInsight | null,
): DashboardAction {
  const firstAssignment = data.assignments?.[0];
  const due = firstAssignment?.dueAt ? Date.parse(firstAssignment.dueAt) : null;
  const urgent = due !== null && due - data.fetchedAt <= DAY;
  if (urgent) return assignmentAction(data) as DashboardAction;
  return (
    appliedCoachAction(coach) ??
    newestLearningAction(data) ??
    assignmentAction(data) ??
    (!data.preferences?.learningGoal
      ? {
          id: 'profile:goal',
          kind: 'practice',
          title: 'Thiết lập mục tiêu học tập của bạn',
          href: '/profile?tab=personalization',
          label: 'Bước khởi đầu',
          reason: 'Chọn mục tiêu và lịch phù hợp để Dashboard sắp xếp nội dung có ích hơn.',
          cta: 'Thiết lập mục tiêu',
        }
      : {
          id: 'practice:start',
          kind: 'practice',
          title: 'Bắt đầu một phiên luyện tập',
          href: '/practice',
          label: 'Bước khởi đầu',
          reason: 'Chọn một chủ đề phù hợp với mục tiêu để bắt đầu tích lũy tiến độ.',
          cta: 'Chọn bài luyện tập',
        })
  );
}

export function selectTodayPlan(
  data: DashboardData,
  coach: DashboardInsight | null,
  primary: DashboardAction,
): DashboardAction[] {
  const urgentAssignments: DashboardAction[] = [];
  const otherAssignments: DashboardAction[] = [];
  for (let index = 0; index < (data.assignments?.length ?? 0); index += 1) {
    const action = assignmentAction(data, index);
    const dueAt = data.assignments?.[index]?.dueAt;
    const due = dueAt ? Date.parse(dueAt) : null;
    if (action) (due !== null && due - data.fetchedAt <= DAY ? urgentAssignments : otherAssignments).push(action);
  }
  const coachSteps: DashboardAction[] = [];
  if (coach?.appliedAt) {
    for (const [index, step] of (coach.insight?.steps ?? []).entries()) {
      coachSteps.push({
        id: `coach:${index}:${step.href}`,
        kind: 'coach',
        title: step.title,
        href: step.href,
        label: 'Kế hoạch AI Coach',
        reason: step.reason,
        cta: 'Mở',
        status: 'Đã thêm',
      });
    }
  }
  const learning = newestLearningAction(data);
  const candidates = [
    ...urgentAssignments,
    ...coachSteps,
    ...otherAssignments,
    ...(learning ? [learning] : []),
  ];
  const seen = new Set([primary.href]);
  return candidates.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).slice(0, 3);
}
