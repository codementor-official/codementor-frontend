import { Map } from "lucide-react";
import { EntityCard } from "@/components/entity-card";
import { LEVEL_DISPLAY_LABEL, formatEstimatedHours } from "@/lib/roadmap/roadmap-stats";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { RankedRoadmap, RoadmapField } from "@/types/roadmap";

const TONE_BY_FIELD: Record<RoadmapField, "ink" | "primary"> = {
  frontend: "primary",
  backend: "ink",
  fullstack: "primary",
  mobile: "ink",
  "data-ai": "primary",
  foundation: "ink",
};

const RECENT_DAYS_THRESHOLD = 5;
const POPULAR_THRESHOLD = 80;

function roadmapEyebrow(roadmap: RankedRoadmap): string | undefined {
  const daysSinceUpdate = (Date.now() - Date.parse(roadmap.updatedAt)) / 86_400_000;
  if (daysSinceUpdate <= RECENT_DAYS_THRESHOLD) return "Mới";
  if (roadmap.popularity >= POPULAR_THRESHOLD) return "Phổ biến";
  return undefined;
}

function roadmapStatus(roadmap: RankedRoadmap): string {
  if (!roadmap.userProgress) return "Chưa bắt đầu";
  return roadmap.userProgress.percent >= 100 ? "Hoàn thành" : `Đang học · ${roadmap.userProgress.percent}%`;
}

/**
 * Thin wrapper around `EntityCard` — kept for call-site compatibility (paths, dashboard,
 * quick-list modal all import `RoadmapCard` directly). See `entity-card.tsx` for the shared implementation.
 * Whole card is a link with a minimal two-part footer (level / status) — Kaggle's
 * competition-card anatomy, no in-card CTA button or progress bar.
 */
export function RoadmapCard({ roadmap }: { roadmap: RankedRoadmap }) {
  return (
    <EntityCard
      tile={roadmap.thumbnail}
      tileVariant={TONE_BY_FIELD[roadmap.field]}
      tileHeight="sm"
      eyebrow={roadmapEyebrow(roadmap)}
      coverImage={placeholderCoverUrl(roadmap.slug)}
      kind={{ icon: Map, label: "Lộ trình" }}
      title={roadmap.title}
      description={roadmap.shortDescription}
      tags={roadmap.technologies.slice(0, 3)}
      stats={[
        { label: "khóa học", value: roadmap.courses.length },
        { label: "", value: formatEstimatedHours(roadmap.estimatedHours) },
      ]}
      footer={
        <>
          <span className="font-semibold text-navy">{LEVEL_DISPLAY_LABEL[roadmap.level]}</span>
          <span>{roadmapStatus(roadmap)}</span>
        </>
      }
      href={`/paths/${roadmap.slug}`}
    />
  );
}
