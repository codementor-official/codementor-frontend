import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LEVEL_DISPLAY_LABEL } from "@/lib/roadmap/roadmap-stats";
import type { Course } from "@/types/roadmap";

const TILE_TONE = ["bg-navy", "bg-primary"];

function CourseSummaryCard({ roadmapSlug, course, index }: { roadmapSlug: string; course: Course; index: number }) {
  const tone = TILE_TONE[index % TILE_TONE.length];
  const hasCurriculum = course.chapters.length > 0;

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-navy">
        {index + 1}. {course.title}
      </h3>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg font-mono text-lg font-bold text-white ${tone}`}
        >
          {course.thumbnail}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{LEVEL_DISPLAY_LABEL[course.level]}</Badge>
            {course.status === "completed" && <Badge tone="navy">Hoàn thành</Badge>}
            {course.status === "in-progress" && <Badge tone="primary">{course.progressPercent}%</Badge>}
            {course.status === "locked" && <Badge tone="neutral">Đã khóa</Badge>}
          </div>
          <p className="mb-1.5 text-xs leading-relaxed text-text-muted">{course.description}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-text-faint">
            <span>
              {course.totalChapters} chương · {course.totalLessons} bài học
            </span>
            <span>{course.durationHours} giờ</span>
          </div>
        </div>
        <Link
          href={`/paths/${roadmapSlug}/courses/${course.slug}`}
          className={`shrink-0 rounded-md px-4 py-2 text-xs font-semibold text-white ${
            hasCurriculum ? "bg-navy hover:bg-navy/90" : "bg-text-faint hover:bg-text-muted"
          }`}
        >
          {hasCurriculum ? "Xem khóa học →" : "Sắp ra mắt"}
        </Link>
      </div>
    </section>
  );
}

export function RoadmapCurriculum({ roadmapSlug, courses }: { roadmapSlug: string; courses: Course[] }) {
  return (
    <div className="flex flex-col gap-5">
      {courses.map((course, i) => (
        <CourseSummaryCard key={course.id} roadmapSlug={roadmapSlug} course={course} index={i} />
      ))}
    </div>
  );
}
