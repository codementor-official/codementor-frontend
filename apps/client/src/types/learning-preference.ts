export type CurrentLevel = "none" | "basic" | "intermediate" | "experienced";

export type ContentPriority = "theory" | "practice" | "project";
export type StudyDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface StudySessionPlan {
  enabled: boolean;
  startTime: string;
  durationMinutes: number;
}

export type WeeklyStudySchedule = Record<StudyDay, StudySessionPlan>;

export const STUDY_DAYS: { key: StudyDay; label: string; shortLabel: string }[] = [
  { key: "mon", label: "Thứ 2", shortLabel: "T2" },
  { key: "tue", label: "Thứ 3", shortLabel: "T3" },
  { key: "wed", label: "Thứ 4", shortLabel: "T4" },
  { key: "thu", label: "Thứ 5", shortLabel: "T5" },
  { key: "fri", label: "Thứ 6", shortLabel: "T6" },
  { key: "sat", label: "Thứ 7", shortLabel: "T7" },
  { key: "sun", label: "Chủ nhật", shortLabel: "CN" },
];

export const DEFAULT_WEEKLY_STUDY_SCHEDULE: WeeklyStudySchedule = {
  mon: { enabled: true, startTime: "19:00", durationMinutes: 60 },
  tue: { enabled: true, startTime: "19:00", durationMinutes: 60 },
  wed: { enabled: true, startTime: "19:00", durationMinutes: 60 },
  thu: { enabled: true, startTime: "19:00", durationMinutes: 60 },
  fri: { enabled: true, startTime: "19:00", durationMinutes: 60 },
  sat: { enabled: false, startTime: "09:00", durationMinutes: 60 },
  sun: { enabled: false, startTime: "09:00", durationMinutes: 60 },
};

/** Personalization survey collected once via the onboarding modal. Shape is
 * designed to be posted directly to a future backend endpoint as-is. */
export interface LearningPreference {
  learningGoal: string;
  interestedFields: string[];
  currentLevel: CurrentLevel | null;
  interestedTechnologies: string[];
  weeklyStudyHours: number | null;
  careerGoal: string;
  preferredLearningStyle: string[];
  contentPriority: ContentPriority | null;
  weeklyStudySchedule: WeeklyStudySchedule;
  remindersEnabled: boolean;
  reminderTime: string;
  adaptiveRecommendations: boolean;
}

export const EMPTY_LEARNING_PREFERENCE: LearningPreference = {
  learningGoal: "",
  interestedFields: [],
  currentLevel: null,
  interestedTechnologies: [],
  weeklyStudyHours: null,
  careerGoal: "",
  preferredLearningStyle: [],
  contentPriority: null,
  weeklyStudySchedule: DEFAULT_WEEKLY_STUDY_SCHEDULE,
  remindersEnabled: true,
  reminderTime: "18:45",
  adaptiveRecommendations: true,
};
