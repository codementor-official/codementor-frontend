/** Hydrate only the selected IDs, preserving rank rather than the catalogue's sort. */
export function inRecommendationOrder<T extends { id: string }, R extends { id: string }>(
  ranked: R[],
  records: T[],
): Array<{ item: T; recommendation: R }> {
  const byId = new Map(records.map((item) => [item.id, item]));
  return ranked.flatMap((recommendation) => {
    const item = byId.get(recommendation.id);
    // Content can be unpublished between ranking and hydration. Never restore it
    // from recommendation metadata or fill the gap with unrelated records.
    return item ? [{ item, recommendation }] : [];
  });
}
