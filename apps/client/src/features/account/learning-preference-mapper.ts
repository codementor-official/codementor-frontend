import type { UserLearningPreferences } from "@/features/account/types";
import type { LearningPreference, WeeklyStudySchedule } from "@/types/learning-preference";
import { DEFAULT_WEEKLY_STUDY_SCHEDULE, STUDY_DAYS } from "@/types/learning-preference";

export function fromAccountPreferences(value: UserLearningPreferences): LearningPreference {
  const weeklyStudySchedule = Object.fromEntries(
    STUDY_DAYS.map((day) => {
      const slot = value.schedule.find((item) => item.weekday === day.key);
      return [day.key, slot ? { enabled: slot.enabled, startTime: slot.startTime, durationMinutes: slot.durationMinutes } : { ...DEFAULT_WEEKLY_STUDY_SCHEDULE[day.key] }];
    }),
  ) as WeeklyStudySchedule;
  return {
    learningGoal: value.learningGoal ?? "",
    careerGoal: value.careerGoal ?? "",
    currentLevel: value.currentLevel,
    contentPriority: value.contentPriority,
    weeklyStudyHours: value.weeklyStudyHours,
    interestedFields: [...value.interestedFields],
    interestedTechnologies: [...value.interestedTechnologies],
    preferredLearningStyle: [...value.preferredLearningStyle],
    remindersEnabled: value.remindersEnabled,
    reminderTime: value.reminderTime,
    adaptiveRecommendations: value.adaptiveRecommendations,
    weeklyStudySchedule,
  };
}

export function toAccountPreferences(value: LearningPreference): Omit<UserLearningPreferences, "completedAt"> {
  return {
    learningGoal: value.learningGoal || null,
    careerGoal: value.careerGoal || null,
    currentLevel: value.currentLevel,
    contentPriority: value.contentPriority,
    weeklyStudyHours: value.weeklyStudyHours,
    interestedFields: value.interestedFields,
    interestedTechnologies: value.interestedTechnologies,
    preferredLearningStyle: value.preferredLearningStyle,
    remindersEnabled: value.remindersEnabled,
    reminderTime: value.reminderTime,
    adaptiveRecommendations: value.adaptiveRecommendations,
    schedule: STUDY_DAYS.map((day) => ({ weekday: day.key, ...value.weeklyStudySchedule[day.key] })),
  };
}
