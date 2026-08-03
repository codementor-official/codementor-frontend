import type { PracticeItem } from "@/data/practice-items";
import type { LearningPreference } from "@/types/learning-preference";

const LEVEL_VALUE = { none: 0, basic: 1, intermediate: 2, experienced: 3 } as const;
const DIFFICULTY_VALUE = { "Cơ bản": 0, "Trung bình": 1, "Nâng cao": 2 } as const;

function goalSignal(learningGoal: string | null) {
  if (learningGoal === "Chuẩn bị phỏng vấn") return "interview";
  if (learningGoal === "Luyện thi đấu thuật toán") return "algorithm";
  if (learningGoal === "Ôn tập trên lớp") return "fundamental";
  return "workplace";
}

export function practiceMatchScore(item: PracticeItem, preference: LearningPreference) {
  const fieldMatches = item.fields.filter((field) => preference.interestedFields.includes(field)).length;
  const technologyMatches = item.technologies.filter((technology) => preference.interestedTechnologies.includes(technology)).length;
  const goalMatches = item.goals.includes(goalSignal(preference.learningGoal));
  const learnerLevel = preference.currentLevel ? LEVEL_VALUE[preference.currentLevel] : 1;
  const levelDistance = Math.abs(DIFFICULTY_VALUE[item.difficulty] - learnerLevel);

  return item.popularity + fieldMatches * 28 + technologyMatches * 12 + (goalMatches ? 16 : 0)
    + (preference.contentPriority === "practice" ? 5 : 0) - levelDistance * 5;
}

export function personalizedPractice(items: PracticeItem[], preference: LearningPreference) {
  return [...items].sort((left, right) => practiceMatchScore(right, preference) - practiceMatchScore(left, preference)).slice(0, 2);
}

export function practiceRecommendationReason(item: PracticeItem, preference: LearningPreference) {
  const matchedTechnology = item.technologies.find((technology) => preference.interestedTechnologies.includes(technology));
  if (matchedTechnology) return `Khớp công nghệ ${matchedTechnology} bạn đã chọn`;
  const matchedField = item.fields.find((field) => preference.interestedFields.includes(field));
  if (matchedField) return `Phù hợp hướng ${matchedField.replace("data-ai", "Data & AI")}`;
  return "Độ khó phù hợp với trình độ hiện tại";
}
