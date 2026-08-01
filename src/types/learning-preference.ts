export type CurrentLevel = "none" | "basic" | "intermediate" | "experienced";

export type ContentPriority = "theory" | "practice" | "project";

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
};
