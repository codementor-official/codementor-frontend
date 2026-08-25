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

export interface UserSettings {
  emailNotifications: boolean;
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

export interface UserActivityCalendar {
  days: { date: string; count: number }[];
  totalActivities: number;
  activeDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
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
