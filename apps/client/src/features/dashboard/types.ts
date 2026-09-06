import type { UserActivityCalendar, UserActivityEntry } from '@/features/account/types';
import type { EnrolledCourse, EnrolledRoadmap } from '@/types/catalogue';

export interface LearningDashboard {
  timezone: string;
  courses: EnrolledCourse[] | null;
  roadmaps: EnrolledRoadmap[] | null;
  activities: UserActivityEntry[] | null;
  calendar: UserActivityCalendar | null;
  totalStudySeconds: number | null;
}

export interface PendingAssignment {
  id: string;
  exerciseTitle: string;
  workspaceName: string;
  workspaceSlug: string;
  status: string;
  dueAt: string | null;
}

export interface DashboardInsight {
  status: 'ready' | 'empty' | 'hidden' | 'disabled';
  configured?: boolean;
  generatedAt?: string | null;
  appliedAt?: string | null;
  stale?: boolean;
  insight: {
    summary: string;
    focus: string;
    steps: { title: string; href: string; reason: string; task: string }[];
  } | null;
}
