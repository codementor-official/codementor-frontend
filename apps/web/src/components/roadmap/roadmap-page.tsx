"use client";

import { useState } from "react";
import { Briefcase, ChevronUp, Code2, RefreshCw, Sparkles, Sprout, TrendingUp } from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { PAGE_ILLUSTRATIONS } from "@/lib/content-illustrations";
import { PageHeader } from "@/components/page-header";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import { useRoadmapRecommendation } from "@/hooks/use-roadmap-recommendation";
import { useRoadmapFilters } from "@/hooks/use-roadmap-filters";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { DEFAULT_ROADMAP_FILTERS, getAvailableTechnologies } from "@/lib/roadmap/roadmap-filter";
import { RoadmapCard } from "./roadmap-card";
import { RoadmapDiscoverRow, type QuickList } from "./roadmap-discover-row";
import { RoadmapFilterBar } from "./roadmap-filter-bar";
import { RoadmapList } from "./roadmap-list";
import { RoadmapLoadingState } from "./roadmap-loading";

function RoadmapCuratedSection({ list, onCollapse }: { list: QuickList; onCollapse: () => void }) {
  return (
    <section className="mb-8">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <list.icon className="h-4 w-4 text-navy" />
          <h2 className="text-base font-bold text-navy">{list.label}</h2>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Thu gọn <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-xs text-text-faint">{list.description}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.roadmaps.slice(0, 4).map((roadmap) => (
          <RoadmapCard key={roadmap.id} roadmap={roadmap} />
        ))}
      </div>
    </section>
  );
}

export function RoadmapPage() {
  const { rankedRoadmaps, isLoading, hasPreference } = useRoadmapRecommendation();
  const { filters, setFilters, resetFilters, visible, currentPage, pageCount, goToPage } = useRoadmapFilters(rankedRoadmaps);
  const preference = useLearningPreferenceStore((state) => state.preference);
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

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_ROADMAP_FILTERS);
  const quickLists: QuickList[] = [
    {
      key: "for-you",
      label: "Phù hợp nhất với bạn",
      icon: Sparkles,
      description: hasPreference
        ? "Xếp hạng theo thiết lập học tập và lĩnh vực bạn đã chọn."
        : "Xếp hạng theo mức độ phổ biến; hãy thiết lập gợi ý để kết quả sát hơn với bạn.",
      roadmaps: rankedRoadmaps.slice(0, 6),
    },
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
      roadmaps: rankedRoadmaps.filter((roadmap) => roadmap.level === "none" || roadmap.level === "basic").slice(0, 6),
    },
    ...(hasPreference && preference.careerGoal
      ? [{
          key: "career",
          label: `Theo mục tiêu “${preference.careerGoal}”`,
          icon: Briefcase,
          description: `Các lộ trình hướng đến mục tiêu nghề nghiệp “${preference.careerGoal}”.`,
          roadmaps: rankedRoadmaps
            .filter((roadmap) => roadmap.matchedReasons.some((reason) => reason.includes("mục tiêu nghề nghiệp")))
            .slice(0, 6),
        }]
      : []),
    ...(hasPreference && preference.interestedTechnologies.length > 0
      ? [{
          key: "technology",
          label: "Theo công nghệ bạn quan tâm",
          icon: Code2,
          description: `Có công nghệ bạn quan tâm: ${preference.interestedTechnologies.slice(0, 3).join(", ")}.`,
          roadmaps: rankedRoadmaps
            .filter((roadmap) => roadmap.technologies.some((technology) => preference.interestedTechnologies.includes(technology)))
            .slice(0, 6),
        }]
      : []),
  ].filter((list) => list.roadmaps.length > 0);

  const openList = quickLists.find((list) => list.key === activeQuickList) ?? null;

  return (
    <div>
      <PageBanner
        illustrationSrc={PAGE_ILLUSTRATIONS.paths}
        variant="paths"
        eyebrow={hasPreference ? "Đề xuất đang theo hồ sơ học tập" : "Chọn hướng đi phù hợp với bạn"}
        highlights={[
          { value: String(rankedRoadmaps.length), label: "lộ trình sẵn sàng" },
          { value: "6", label: "hướng chuyên môn" },
          { value: "1", label: "bước để bắt đầu" },
        ]}
        title="Lộ trình học"
        description="Học theo lộ trình có cấu trúc — mỗi lộ trình gộp nhiều khóa học theo một hướng nghề nghiệp, sắp xếp sẵn thứ tự để bạn không phải tự mò mẫm nên học gì trước."
        actions={
          <>
            <PersonalizationSettingsTrigger
              label={hasPreference ? "Chỉnh sửa gợi ý cá nhân" : "Thiết lập gợi ý cá nhân hóa"}
            />
            <a
              href="#all-roadmaps"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-navy hover:bg-bg"
            >
              Khám phá tất cả lộ trình
            </a>
          </>
        }
      />

      <RoadmapFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={resetFilters}
        technologyOptions={getAvailableTechnologies(rankedRoadmaps)}
      />

      <RoadmapDiscoverRow
        lists={quickLists}
        activeKey={activeQuickList}
        onSelect={(key) => setActiveQuickList((current) => (current === key ? null : key))}
      />

      {openList && <RoadmapCuratedSection list={openList} onCollapse={() => setActiveQuickList(null)} />}

      <h2 id="all-roadmaps" className="mb-3 scroll-mt-4 text-base font-bold text-navy">
        Toàn bộ lộ trình
      </h2>
      <RoadmapList
        roadmaps={visible}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={goToPage}
        isFiltered={isFiltered}
      />
    </div>
  );
}
