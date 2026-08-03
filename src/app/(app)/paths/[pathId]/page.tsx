import Link from "next/link";
import { BarChart3, Check, Clock, Layers, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RoadmapCurriculum } from "@/components/roadmap/roadmap-curriculum";
import { roadmapService } from "@/lib/roadmap/roadmap-service";
import { LEVEL_DISPLAY_LABEL, formatEstimatedHours } from "@/lib/roadmap/roadmap-stats";

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const roadmap = await roadmapService.getBySlug(pathId);

  const totalLessons = roadmap.courses.reduce((t, c) => t + c.totalLessons, 0);
  const totalChapters = roadmap.courses.reduce((t, c) => t + c.totalChapters, 0);
  const started = roadmap.userProgress !== null;

  return (
    <div>
      <Link href="/paths" className="mb-3.5 inline-block text-sm text-text-muted hover:text-navy">
        ← Quay lại lộ trình học
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-lg bg-navy p-6 text-on-ink">
            <div className="mb-2 text-[10.5px] font-bold tracking-wide text-primary uppercase">Lộ trình học</div>
            <h1 className="mb-2 text-2xl font-bold">{roadmap.title}</h1>
            <p className="mb-3.5 max-w-xl text-sm leading-relaxed text-zinc-300">{roadmap.description}</p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-200">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> {LEVEL_DISPLAY_LABEL[roadmap.level]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatEstimatedHours(roadmap.estimatedHours)}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> {roadmap.courses.length} khóa học
              </span>
              {roadmap.targetAudience.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {roadmap.targetAudience[0]}
                </span>
              )}
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">{totalChapters} chương</span>
              <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">{totalLessons} bài học</span>
            </div>
          </div>

          {roadmap.learningOutcomes.length > 0 && (
            <Card className="mb-3.5 p-5">
              <h2 className="mb-3 text-sm font-bold text-navy">Bạn sẽ học được gì</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roadmap.learningOutcomes.map((w) => (
                  <div key={w} className="flex items-start gap-2 text-xs text-text">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {w}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="mb-5 flex flex-col gap-3.5 sm:flex-row">
            <Card className="flex-1 p-5">
              <div className="mb-2.5 text-sm font-bold text-navy">Điều kiện tiên quyết</div>
              <ul className="flex flex-col gap-1.5">
                {roadmap.prerequisites.length > 0 ? (
                  roadmap.prerequisites.map((p) => (
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
            {roadmap.technologies.length > 0 && (
              <Card className="flex-1 p-5">
                <div className="mb-2.5 text-sm font-bold text-navy">Công nghệ liên quan</div>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.technologies.map((t) => (
                    <span key={t} className="rounded-sm bg-border-soft px-2.5 py-1 text-xs font-semibold text-navy">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <h2 id="curriculum" className="mb-1 text-base font-bold text-navy">
            Khóa học trong lộ trình
          </h2>
          <p className="mb-3.5 text-xs text-text-faint">
            Chọn một khóa học để xem chương và bài học — mỗi bài học có nhiều dạng nội dung khác nhau.
          </p>
          {roadmap.courses.length > 0 ? (
            <RoadmapCurriculum roadmapSlug={roadmap.slug} courses={roadmap.courses} />
          ) : (
            <Card className="p-6 text-center text-sm text-text-faint">
              Chưa có khóa học nào trong lộ trình này.
            </Card>
          )}
        </div>

        <div className="flex w-full flex-col gap-3.5 lg:w-80 lg:shrink-0">
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-navy">Tiến độ của bạn</div>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-primary">{roadmap.userProgress?.percent ?? 0}%</span>
              <span className="text-xs text-text-faint">hoàn thành</span>
            </div>
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${roadmap.userProgress?.percent ?? 0}%` }}
              />
            </div>
            {roadmap.userProgress && (
              <div className="mb-3.5 flex justify-between text-xs text-text">
                <span>Khóa học đã hoàn thành</span>
                <b>
                  {roadmap.userProgress.completedCourses}/{roadmap.userProgress.totalCourses}
                </b>
              </div>
            )}
            <Link
              href="#curriculum"
              className="mt-1 block w-full rounded-md bg-primary py-2.5 text-center text-sm font-semibold text-on-ink hover:bg-primary-hover"
            >
              {started ? "Học tiếp bài đang dở →" : "Bắt đầu học ngay →"}
            </Link>
          </Card>

          {roadmap.targetAudience.length > 0 && (
            <Card className="p-4">
              <div className="mb-2.5 text-sm font-bold text-navy">Phù hợp với</div>
              <ul className="flex flex-col gap-1.5">
                {roadmap.targetAudience.map((a) => (
                  <li key={a} className="flex gap-2 text-xs leading-relaxed text-text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy" />
                    {a}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
