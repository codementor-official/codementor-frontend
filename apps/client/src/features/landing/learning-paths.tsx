import Link from "next/link";
import { ArrowRight, Clock, Layers } from "lucide-react";
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
      {/* Một lưới liền theo thứ tự trình độ: nhóm theo cột từng để trống cả khoảng lớn khi một bậc chỉ có một lộ trình. */}
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.flatMap((stage, index) =>
          stage.roadmaps.map((roadmap) => (
            <li key={roadmap.id}>
              <Link
                href={`/roadmaps/${roadmap.id}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-navy"
              >
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="flex size-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-surface" aria-hidden>
                    {index + 1}
                  </span>
                  {LEVEL_LABEL[stage.level]} · {FIELD_LABEL[roadmap.field] ?? roadmap.field}
                  <ArrowRight className="ml-auto size-4 shrink-0 text-text-faint group-hover:text-navy" aria-hidden />
                </span>
                <span className="mt-3 text-lg font-semibold text-navy">{roadmap.title}</span>
                {roadmap.shortDescription && (
                  <span className="mt-1 line-clamp-2 text-sm leading-6 text-text-muted">{roadmap.shortDescription}</span>
                )}
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                  <span className="inline-flex items-center gap-1.5"><Layers className="size-4" aria-hidden />{roadmap.courseCount} khóa học</span>
                  {roadmap.estimatedHours != null && (
                    <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{roadmap.estimatedHours} giờ</span>
                  )}
                </span>
                {roadmap.pricing && (
                  <span className="mt-auto pt-4">
                    <RoadmapPrice pricing={roadmap.pricing} className="border-t border-border-soft pt-3 text-sm" />
                  </span>
                )}
              </Link>
            </li>
          )),
        )}
      </ol>
    </LandingSection>
  );
}
