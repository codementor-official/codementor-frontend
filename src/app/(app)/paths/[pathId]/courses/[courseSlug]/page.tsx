import Link from "next/link";
import { BarChart3, Check, Clock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseCurriculumOutline } from "@/components/roadmap/course-curriculum-outline";
import { roadmapService } from "@/lib/roadmap/roadmap-service";
import { LEVEL_DISPLAY_LABEL } from "@/lib/roadmap/roadmap-stats";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ pathId: string; courseSlug: string }>;
}) {
  const { pathId, courseSlug } = await params;
  const result = await roadmapService.getCourse(pathId, courseSlug);

  if (!result) {
    return (
      <div>
        <Link href={`/paths/${pathId}`} className="mb-3.5 inline-block text-sm text-text-muted hover:text-navy">
          ← Quay lại lộ trình học
        </Link>
        <Card className="p-8 text-center text-sm text-text-faint">
          Không tìm thấy khóa học này trong lộ trình.
        </Card>
      </div>
    );
  }

  const { roadmap, course } = result;
  const started = course.progressPercent > 0;

  return (
    <div>
      <Link
        href={`/paths/${roadmap.slug}#curriculum`}
        className="mb-3.5 inline-block text-sm text-text-muted hover:text-navy"
      >
        ← Quay lại {roadmap.title}
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-lg bg-navy p-6 text-white">
            <div className="mb-2 text-[10.5px] font-bold tracking-wide text-primary uppercase">
              Khóa học · {roadmap.title}
            </div>
            <h1 className="mb-2 text-2xl font-bold">{course.title}</h1>
            <p className="mb-3.5 max-w-xl text-sm leading-relaxed text-zinc-300">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-200">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> {LEVEL_DISPLAY_LABEL[course.level]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {course.durationHours} giờ
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> {course.totalChapters} chương · {course.totalLessons} bài học
              </span>
            </div>
            {course.technologies.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {course.technologies.map((t) => (
                  <span key={t} className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {course.outcomes.length > 0 && (
            <Card className="mb-3.5 p-5">
              <h2 className="mb-3 text-sm font-bold text-navy">Học xong bạn sẽ làm được gì</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <div key={o} className="flex items-start gap-2 text-xs text-text">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {o}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="mb-5 p-5">
            <div className="mb-2.5 text-sm font-bold text-navy">Yêu cầu đầu vào</div>
            <ul className="flex flex-col gap-1.5">
              {course.prerequisites.length > 0 ? (
                course.prerequisites.map((p) => (
                  <li key={p} className="flex gap-2 text-xs leading-relaxed text-text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))
              ) : (
                <li className="text-xs text-text-faint">Không yêu cầu kiến thức nền</li>
              )}
            </ul>
          </Card>

          <h2 id="curriculum" className="mb-1 text-base font-bold text-navy">
            Nội dung khóa học
          </h2>
          <p className="mb-3.5 text-xs text-text-faint">
            {course.totalChapters} chương · {course.totalLessons} bài học · {course.durationHours} giờ học
          </p>
          <CourseCurriculumOutline course={course} />
        </div>

        <div className="flex w-full flex-col gap-3.5 lg:w-80 lg:shrink-0">
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-navy">Tiến độ của bạn</div>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-primary">{course.progressPercent}%</span>
              <span className="text-xs text-text-faint">hoàn thành</span>
            </div>
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
            </div>
            <Link
              href="#curriculum"
              className="mt-1 block w-full rounded-md bg-primary py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover"
            >
              {started ? "Học tiếp bài đang dở →" : "Bắt đầu học ngay →"}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
