"use client";

import { useCallback } from "react";
import { useRecommendations } from "@/features/recommendations/use-recommendations";
import { inRecommendationOrder } from "@/features/recommendations/ranked-items";
import type { RecommendationList } from "@/types/recommendation";

export interface Ranked<T> {
  item: T;
  reason?: string;
}

export interface PersonalizedState<T> {
  items: Ranked<T>[];
  personalized: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Stable loaders reuse auth/preference invalidation and stale-response protection.
 * Catalogue hydration keeps the full card data, in backend ranking order. */
export function usePersonalized<T extends { id: string }>(
  loadRecommendations: () => Promise<RecommendationList>,
  loadCatalogue: (ids: string[]) => Promise<{ items: T[] }>,
  enabled = true,
): PersonalizedState<T> {
  const load = useCallback(async () => {
    if (!enabled) return { items: [], personalized: false };
    const ranking = await loadRecommendations();
    if (!ranking.items.length) return { items: [], personalized: ranking.personalized };
    const catalogue = await loadCatalogue(ranking.items.map((item) => item.id));
    return {
      personalized: ranking.personalized,
      items: inRecommendationOrder(ranking.items, catalogue.items)
        .map(({ item, recommendation }) => ({ item, reason: recommendation.reasons[0] })),
    };
  }, [loadRecommendations, loadCatalogue, enabled]);
  const { data, isLoading, error } = useRecommendations(load);
  if (!enabled) return { items: [], personalized: false, isLoading: false, error: null };
  return { items: data?.items ?? [], personalized: data?.personalized ?? false, isLoading, error };
}

export function hasPersonalizedContent<T>(state: PersonalizedState<T>): boolean {
  return state.personalized && state.items.length > 0;
}
