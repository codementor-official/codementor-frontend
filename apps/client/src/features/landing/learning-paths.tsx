import Link from "next/link";
import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react/ssr";
import { RoadmapPrice } from "@/components/roadmap-price";
import { FIELD_LABEL, LEVEL_OPTIONS } from "@/lib/catalogue/level";
import type { RoadmapSummary } from "@/types/catalogue";
import { LandingSection } from "./section";
import { roadmapsByLevel } from "./data";

const LEVEL_LABEL = Object.fromEntries(LEVEL_OPTIONS.map((o) => [o.value, o.label]));

export function LandingLearningPaths({ roadmaps }: { roadmaps: RoadmapSummary[] }) {
  const stages = roadmapsByLevel(roadmaps);
  if (stages.length === 0) return null;
  return (
    <LandingSection
      id="roadmaps"
      eyebrow="Lộ trình"
      title="Chọn lộ trình theo trình độ hiện tại"
      description="Mỗi lộ trình xếp sẵn nhiều khóa học theo thứ tự. Danh sách dưới đây đi từ chưa có nền tới trung cấp."
      action={{ label: "Xem tất cả lộ trình", href: "/roadmaps" }}
    >
      {/* Một danh sách theo thứ tự trình độ: người xem đang tìm một lộ trình hợp mình, không so thẻ cạnh nhau. */}
      <ol className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        {stages.flatMap((stage) => stage.roadmaps).map((roadmap, index) => (
          <li key={roadmap.id} className="border-b border-border-soft last:border-b-0">
            <Link href={`/roadmaps/${roadmap.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-on-ink" aria-hidden>
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-navy">{roadmap.title}</span>
                <span className="mt-0.5 block truncate text-xs text-text-muted">
                  {[
                    LEVEL_LABEL[roadmap.level],
                    FIELD_LABEL[roadmap.field] ?? roadmap.field,
                    `${roadmap.courseCount} khóa học`,
                    roadmap.estimatedHours != null && `${roadmap.estimatedHours} giờ`,
                  ].filter(Boolean).join(" · ")}
                </span>
              </span>
              {roadmap.pricing && <RoadmapPrice pricing={roadmap.pricing} className="shrink-0 text-sm max-sm:hidden" />}
              <ChevronRight className="size-4 shrink-0 text-text-faint" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
