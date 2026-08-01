import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEVEL_DISPLAY_LABEL, formatEstimatedHours } from "@/lib/roadmap/roadmap-stats";
import type { RankedRoadmap, RoadmapField } from "@/types/roadmap";

const TONE_BY_FIELD: Record<RoadmapField, "navy" | "primary"> = {
  frontend: "primary",
  backend: "navy",
  fullstack: "primary",
  mobile: "navy",
  "data-ai": "primary",
  foundation: "navy",
};

export function RoadmapCard({
  roadmap,
  showReason = false,
}: {
  roadmap: RankedRoadmap;
  showReason?: boolean;
}) {
  const tone = TONE_BY_FIELD[roadmap.field];
  const started = roadmap.userProgress !== null;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div
        className={`flex h-16 shrink-0 items-center justify-center font-mono text-base font-bold text-white ${
          tone === "primary" ? "bg-primary" : "bg-navy"
        }`}
      >
        {roadmap.thumbnail}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-navy">{roadmap.title}</h3>
          <Badge tone="neutral" className="shrink-0">
            {LEVEL_DISPLAY_LABEL[roadmap.level]}
          </Badge>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">{roadmap.shortDescription}</p>
        <div className="flex flex-wrap gap-1.5">
          {roadmap.technologies.slice(0, 3).map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-faint">
          <span>{roadmap.courses.length} khóa học</span>
          <span>{formatEstimatedHours(roadmap.estimatedHours)}</span>
        </div>
        {showReason && roadmap.matchedReasons[0] && (
          <p className="rounded-md bg-border-soft px-2.5 py-2 text-[11px] leading-relaxed text-text">
            {roadmap.matchedReasons[0]}
          </p>
        )}
        {started && roadmap.userProgress && (
          <div className="flex flex-col gap-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${roadmap.userProgress.percent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary">
              Hoàn thành {roadmap.userProgress.percent}%
            </span>
          </div>
        )}
        <Link
          href={`/paths/${roadmap.slug}`}
          className="mt-auto rounded-md bg-navy px-3.5 py-2 text-center text-xs font-semibold text-white hover:bg-navy/90"
        >
          {started ? "Tiếp tục học →" : "Xem chi tiết →"}
        </Link>
      </div>
    </Card>
  );
}
