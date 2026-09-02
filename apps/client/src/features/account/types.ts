import type { User } from '@codementor/types';
import type { ThemePreference } from '@/lib/store/theme-store';

export interface AccountProfile extends User {
  handle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  githubHandle: string | null;
  locale: string;
  timezone: string;
  emailVerified: boolean;
}

export interface EmailVerificationStatus {
  email: string;
  verified: boolean;
  canSend: boolean;
  retryAfterSeconds: number;
}

export interface UserSettings {
  emailNotifications: boolean;
  assignmentNotifications: boolean;
  deadlineReminders: boolean;
  deadline6hReminders: boolean;
  workspaceEmailUpdates: boolean;
  systemAnnouncements: boolean;
  learningInactivityDays: number;
  workspaceNotifications: boolean;
  learningReminders: boolean;
  weeklyDigest: boolean;
  publicProfile: boolean;
  showLearningProgress: boolean;
  allowWorkspaceInvites: boolean;
  theme: ThemePreference;
}

export interface StudyScheduleSlot {
  weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  enabled: boolean;
  startTime: string;
  durationMinutes: number;
}

export interface UserLearningPreferences {
  learningGoal: string | null;
  careerGoal: string | null;
  currentLevel: 'none' | 'basic' | 'intermediate' | 'experienced' | null;
  contentPriority: 'theory' | 'practice' | 'project' | null;
  weeklyStudyHours: number | null;
  interestedFields: string[];
  interestedTechnologies: string[];
  preferredLearningStyle: string[];
  remindersEnabled: boolean;
  reminderTime: string;
  adaptiveRecommendations: boolean;
  schedule: StudyScheduleSlot[];
  completedAt: string | null;
}

export interface UserLearningStats {
  xp: number;
  solvedCount: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastSolvedOn: string | null;
}

export interface LearningLeaderboardEntry {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  solvedCount: number;
}

export interface UserActivityCalendar {
  days: { date: string; count: number }[];
  totalActivities: number;
  activeDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
}

export type BookmarkTarget = "COURSE" | "ROADMAP" | "EXERCISE" | "POST";
export type BookmarkSort = "newest" | "oldest" | "title";
export interface UserBookmark {
  id: string;
  targetType: BookmarkTarget;
  targetId: string;
  targetRef: string | null;
  createdAt: string;
  contentSlug?: string | null;
  title?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  contentStatus?: string | null;
  available?: boolean;
  difficulty?: string | null;
  level?: string | null;
  durationMinutes?: number | null;
  itemCount?: number | null;
  popularity?: number | null;
}
export interface BookmarkPage {
  items: UserBookmark[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ReportTarget = "DOCUMENT" | "POST" | "COURSE" | "ROADMAP" | "EXERCISE" | "WORKSPACE";
export type ReportCategory = "SPAM" | "MISLEADING" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
export interface ContentReport {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetRef: string | null;
  category: ReportCategory;
  note: string | null;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface UserActivityEntry {
  kind: 'roadmap_enrolled' | 'course_enrolled' | 'course_completed' | 'lesson_completed' | 'exercise_solved';
  title: string;
  detail: string | null;
  occurredAt: string;
}

export interface PresignedAvatarUpload {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}
