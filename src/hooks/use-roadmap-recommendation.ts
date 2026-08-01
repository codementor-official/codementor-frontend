"use client";

import { useEffect, useMemo, useState } from "react";
import { rankRoadmaps } from "@/lib/roadmap/recommendation";
import { roadmapService } from "@/lib/roadmap/roadmap-service";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import type { LearningRoadmap, RankedRoadmap } from "@/types/roadmap";

export function useRoadmapRecommendation() {
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[] | null>(null);
  const preference = useLearningPreferenceStore((s) => s.preference);
  const hasCompletedOnboarding = useLearningPreferenceStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    let cancelled = false;
    roadmapService.getAll().then((data) => {
      if (!cancelled) setRoadmaps(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rankedRoadmaps = useMemo<RankedRoadmap[]>(() => {
    if (!roadmaps) return [];
    return rankRoadmaps(roadmaps, hasCompletedOnboarding ? preference : null);
  }, [roadmaps, preference, hasCompletedOnboarding]);

  return {
    rankedRoadmaps,
    isLoading: roadmaps === null,
    hasPreference: hasCompletedOnboarding,
  };
}
