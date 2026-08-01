import Link from "next/link";
import { Clock, Compass, Layers, TrendingUp } from "lucide-react";
import { LEVEL_DISPLAY_LABEL, formatEstimatedHours } from "@/lib/roadmap/roadmap-stats";
import type { RankedRoadmap } from "@/types/roadmap";

export function RoadmapHero({ roadmap }: { roadmap: RankedRoadmap }) {
  const started = roadmap.userProgress !== null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl bg-navy p-7 text-white">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Compass className="h-6 w-6" />
      </div>
      <div className="min-w-[280px] flex-1">
        <div className="mb-2 text-[10.5px] font-bold tracking-wide text-primary uppercase">
          Đề xuất phù hợp nhất với bạn
        </div>
        <h2 className="mb-2 text-xl font-bold sm:text-2xl">{roadmap.title}</h2>
        <p className="mb-3 max-w-xl text-sm leading-relaxed text-zinc-300">{roadmap.shortDescription}</p>
        <ul className="mb-3 flex flex-col gap-1">
          {roadmap.matchedReasons.map((reason) => (
            <li key={reason} className="flex items-start gap-1.5 text-xs text-zinc-200">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {reason}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-300">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {LEVEL_DISPLAY_LABEL[roadmap.level]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatEstimatedHours(roadmap.estimatedHours)}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> {roadmap.courses.length} khóa học
          </span>
        </div>
        {started && roadmap.userProgress && (
          <div className="mt-3 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-zinc-300">
              <span>Tiến độ của bạn</span>
              <span>{roadmap.userProgress.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-primary" style={{ width: `${roadmap.userProgress.percent}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <Link
          href={`/paths/${roadmap.slug}`}
          className="rounded-md bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {started ? "Tiếp tục học →" : "Bắt đầu học →"}
        </Link>
        <Link
          href={`/paths/${roadmap.slug}`}
          className="rounded-md border border-white/25 px-5 py-2.5 text-center text-sm font-semibold hover:bg-white/10"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
