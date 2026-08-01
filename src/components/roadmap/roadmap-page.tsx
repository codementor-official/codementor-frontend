"use client";

import { useState } from "react";
import { Briefcase, ClipboardList, Code2, Pencil, RefreshCw, Sprout, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRoadmapRecommendation } from "@/hooks/use-roadmap-recommendation";
import { useRoadmapFilters } from "@/hooks/use-roadmap-filters";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { DEFAULT_ROADMAP_FILTERS, getAvailableTechnologies } from "@/lib/roadmap/roadmap-filter";
import { RoadmapHero } from "./roadmap-hero";
import { RoadmapDiscoverRow, type QuickList } from "./roadmap-discover-row";
import { RoadmapFilterBar } from "./roadmap-filter-bar";
import { RoadmapList } from "./roadmap-list";
import { RoadmapLoadingState } from "./roadmap-loading";
import { RoadmapQuickListModal } from "./roadmap-quick-list-modal";

export function RoadmapPage() {
  const { rankedRoadmaps, isLoading, hasPreference } = useRoadmapRecommendation();
  const { filters, setFilters, visible, hasMore, loadMore } = useRoadmapFilters(rankedRoadmaps);
  const { preference, hasSkippedOnboarding, openModal } = useLearningPreferenceStore();
  const [activeQuickList, setActiveQuickList] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Lộ trình học"
          subtitle="Học theo lộ trình có cấu trúc — mỗi lộ trình gộp nhiều khóa học theo một hướng nghề nghiệp"
        />
        <RoadmapLoadingState />
      </div>
    );
  }

  const [hero] = rankedRoadmaps;
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_ROADMAP_FILTERS);

  const quickLists: QuickList[] = [
    {
      key: "popular",
      label: "Lộ trình phổ biến",
      icon: TrendingUp,
      description: "Được nhiều học viên lựa chọn nhất trên toàn hệ thống.",
      roadmaps: [...rankedRoadmaps].sort((a, b) => b.popularity - a.popularity).slice(0, 6),
    },
    {
      key: "newest",
      label: "Mới cập nhật",
      icon: RefreshCw,
      description: "Lộ trình vừa được bổ sung hoặc chỉnh sửa nội dung gần đây.",
      roadmaps: [...rankedRoadmaps].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 6),
    },
    {
      key: "beginner",
      label: "Người mới bắt đầu",
      icon: Sprout,
      description: "Lộ trình phù hợp nếu bạn chưa có nhiều kinh nghiệm lập trình.",
      roadmaps: rankedRoadmaps.filter((r) => r.level === "none" || r.level === "basic").slice(0, 6),
    },
    ...(hasPreference && preference.careerGoal
      ? [
          {
            key: "career",
            label: `Theo mục tiêu "${preference.careerGoal}"`,
            icon: Briefcase,
            description: `Lộ trình hướng đến mục tiêu nghề nghiệp "${preference.careerGoal}" bạn đã chọn.`,
            roadmaps: rankedRoadmaps
              .filter((r) => r.matchedReasons.some((reason) => reason.includes("mục tiêu nghề nghiệp")))
              .slice(0, 6),
          },
        ]
      : []),
    ...(hasPreference && preference.interestedTechnologies.length > 0
      ? [
          {
            key: "technology",
            label: "Theo công nghệ bạn quan tâm",
            icon: Code2,
            description: `Có công nghệ bạn quan tâm: ${preference.interestedTechnologies.slice(0, 3).join(", ")}.`,
            roadmaps: rankedRoadmaps
              .filter((r) => r.technologies.some((t) => preference.interestedTechnologies.includes(t)))
              .slice(0, 6),
          },
        ]
      : []),
  ].filter((list) => list.roadmaps.length > 0);

  const openList = quickLists.find((l) => l.key === activeQuickList) ?? null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Lộ trình học"
          subtitle="Học theo lộ trình có cấu trúc — mỗi lộ trình gộp nhiều khóa học theo một hướng nghề nghiệp"
        />
        {hasPreference ? (
          <button
            type="button"
            onClick={openModal}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-navy hover:bg-bg"
          >
            <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa sở thích học tập
          </button>
        ) : (
          <button
            type="button"
            onClick={openModal}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {hasSkippedOnboarding ? "Thiết lập gợi ý cá nhân hóa" : "Khảo sát 2 phút để nhận gợi ý phù hợp"}
          </button>
        )}
      </div>

      {hero && <RoadmapHero roadmap={hero} />}

      <RoadmapDiscoverRow lists={quickLists} onSelect={setActiveQuickList} />

      <h2 className="mb-3 text-base font-bold text-navy">Toàn bộ lộ trình</h2>
      <RoadmapFilterBar filters={filters} onChange={setFilters} technologyOptions={getAvailableTechnologies(rankedRoadmaps)} />
      <RoadmapList roadmaps={visible} hasMore={hasMore} onLoadMore={loadMore} isFiltered={isFiltered} />

      {openList && (
        <RoadmapQuickListModal
          title={openList.label}
          description={openList.description}
          roadmaps={openList.roadmaps}
          onClose={() => setActiveQuickList(null)}
        />
      )}
    </div>
  );
}
