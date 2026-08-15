import type { CurrentLevel, LearningPreference } from "@/types/learning-preference";
import type { LearningRoadmap, RankedRoadmap, RecommendationResult } from "@/types/roadmap";

/** Configurable scoring weights — tune without touching the scoring logic. */
export const RECOMMENDATION_WEIGHTS = {
  field: 34,
  level: 20,
  technology: 20,
  careerGoal: 14,
  popularity: 12,
};

const FIELD_LABELS: Record<LearningRoadmap["field"], string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",
  "data-ai": "Data & AI",
  foundation: "Nền tảng lập trình",
};

const LEVEL_LABELS: Record<CurrentLevel, string> = {
  none: "chưa biết lập trình",
  basic: "cơ bản",
  intermediate: "trung cấp",
  experienced: "đã có kinh nghiệm",
};

const LEVEL_ORDER: CurrentLevel[] = ["none", "basic", "intermediate", "experienced"];

const CAREER_GOAL_KEYWORDS: Record<string, string> = {
  "Web Developer": "web",
  "Backend Developer": "backend",
  "Mobile Developer": "mobile",
  "Data/AI Engineer": "data",
};

function levelDistance(a: CurrentLevel, b: CurrentLevel) {
  return Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
}

/**
 * Rule-based match score between a roadmap and a user's onboarding
 * preferences. Deliberately not ML — swap the body for a real
 * recommendation-service call later without touching call sites.
 */
export function calculateRoadmapScore(
  roadmap: LearningRoadmap,
  preference: LearningPreference,
  weights: typeof RECOMMENDATION_WEIGHTS = RECOMMENDATION_WEIGHTS,
): RecommendationResult {
  let score = 0;
  const reasons: string[] = [];

  if (preference.interestedFields.includes(roadmap.field)) {
    score += weights.field;
    reasons.push(`Bạn đã chọn lĩnh vực ${FIELD_LABELS[roadmap.field]}`);
  }

  if (preference.currentLevel) {
    const distance = levelDistance(preference.currentLevel, roadmap.level);
    if (distance === 0) {
      score += weights.level;
      reasons.push(`Phù hợp với trình độ ${LEVEL_LABELS[preference.currentLevel]} của bạn`);
    } else if (distance === 1) {
      score += weights.level * 0.5;
    }
  }

  if (preference.interestedTechnologies.length > 0) {
    const overlap = roadmap.technologies.filter((t) => preference.interestedTechnologies.includes(t));
    if (overlap.length > 0) {
      score += weights.technology * (overlap.length / roadmap.technologies.length);
      reasons.push(`Có công nghệ bạn quan tâm: ${overlap.join(", ")}`);
    }
  }

  const careerKeyword = preference.careerGoal ? CAREER_GOAL_KEYWORDS[preference.careerGoal] : undefined;
  if (careerKeyword) {
    const haystack = `${roadmap.title} ${roadmap.targetAudience.join(" ")}`.toLowerCase();
    if (haystack.includes(careerKeyword)) {
      score += weights.careerGoal;
      reasons.push(`Hướng đến mục tiêu nghề nghiệp "${preference.careerGoal}" bạn đã chọn`);
    }
  }

  // Small always-on popularity tiebreaker so ties resolve toward proven roadmaps.
  score += (roadmap.popularity / 100) * weights.popularity;

  if (reasons.length === 0) {
    reasons.push("Lộ trình phổ biến trên hệ thống");
  }

  return { roadmapId: roadmap.id, score: Math.round(score), matchedReasons: reasons };
}

/** Ranks every roadmap for a user, highest match first. Falls back to a
 * popularity-only ranking when onboarding hasn't been completed yet. */
export function rankRoadmaps(
  roadmaps: LearningRoadmap[],
  preference: LearningPreference | null,
  weights: typeof RECOMMENDATION_WEIGHTS = RECOMMENDATION_WEIGHTS,
): RankedRoadmap[] {
  return roadmaps
    .map((roadmap) => {
      const result = preference
        ? calculateRoadmapScore(roadmap, preference, weights)
        : { roadmapId: roadmap.id, score: roadmap.popularity, matchedReasons: ["Lộ trình phổ biến trên hệ thống"] };
      return { ...roadmap, ...result };
    })
    .sort((a, b) => b.score - a.score || b.popularity - a.popularity);
}
