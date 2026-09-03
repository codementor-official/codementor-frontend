"use client";

import { useCallback, useState } from "react";
import { Users } from "lucide-react";
import { useToast } from "@codementor/ui";
import { Card } from "@/components/ui/card";
import { CatalogueEmpty } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { toStudyGroup } from "@/lib/study-group/study-group-stats";
import type { StudyGroup } from "@/types/study-group";
import { useRecommendations } from "@/features/recommendations/use-recommendations";
import { inRecommendationOrder } from "@/features/recommendations/ranked-items";
import { RecommendationError, RecommendationNotice } from "@/features/recommendations/recommendation-feedback";
import { StudyGroupCard } from "./study-group-card";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function RecommendedGroups({ limit = 3 }: { limit?: number }) {
  const toast = useToast();
  const [joining, setJoining] = useState<string | null>(null);
  const load = useCallback(async () => {
    const ranked = await api.recommendations.groups(Math.min(limit, 20));
    if (!ranked.items.length) return { personalized: ranked.personalized, items: [] };
    const page = await api.workspaces.list({
      scope: "discover", ids: ranked.items.map((item) => item.id).join(","),
      limit: ranked.items.length,
    });
    return {
      personalized: ranked.personalized,
      items: inRecommendationOrder(ranked.items, page.items).map(({ item }) => toStudyGroup(item)),
    };
  }, [limit]);
  const { data, isLoading, error, reload } = useRecommendations(load);

  const requestAccess = async (group: StudyGroup) => {
    if (joining) return;
    setJoining(group.id);
    try {
      const result = await api.workspaces.requestJoin(group.id);
      if (result.status === "joined") {
        toast.success(`Đã tham gia nhóm “${group.name}”`);
        window.location.assign(`/workspace/${group.id}`);
      } else {
        toast.success(`Đã gửi yêu cầu tham gia “${group.name}”`);
        window.location.assign(`/workspace/${group.id}`);
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không thể gửi yêu cầu tham gia.");
    } finally {
      setJoining(null);
    }
  };

  if (error) return <RecommendationError message={error} onRetry={reload} />;
  if (isLoading) return <div className={GRID}>{Array.from({ length: limit }, (_, i) => <Card key={i} className="h-56 animate-pulse bg-border-soft" />)}</div>;
  if (!data) return null;
  if (!data.items.length) return <CatalogueEmpty icon={Users} title="Chưa có nhóm mới để đề xuất"
    description="Hiện chưa có nhóm công khai khác phù hợp để tham gia." />;
  return <>
    <RecommendationNotice personalized={data.personalized} />
    <ul className={GRID} aria-label="Nhóm có thể hợp với bạn" aria-busy={joining !== null}>
      {data.items.map((group) => <li key={group.id}><StudyGroupCard group={group}
        onRequestJoin={(target) => void requestAccess(target)} /></li>)}
    </ul>
  </>;
}
