import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  Globe,
  Layers,
  PlayCircle,
  RefreshCw,
  Smartphone,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseCurriculumOutline } from "@/components/roadmap/course-curriculum-outline";
import { roadmapService } from "@/lib/roadmap/roadmap-service";
import { LEVEL_DISPLAY_LABEL, getLessonTypeCounts } from "@/lib/roadmap/roadmap-stats";
import { FIELD_FILTER_OPTIONS } from "@/lib/roadmap/roadmap-filter";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { Course, Lesson } from "@/types/roadmap";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < Math.round(rating) ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function courseIncludes(course: Course): { icon: LucideIcon; label: string }[] {
  const counts = getLessonTypeCounts(course);
  return [
    { icon: Clock, label: `${course.durationHours} giờ nội dung học theo yêu cầu` },
    counts.exercise > 0 ? { icon: Code2, label: `${counts.exercise} bài tập coding` } : null,
    counts.article > 0 ? { icon: FileText, label: `${counts.article} bài viết` } : null,
    { icon: Smartphone, label: "Truy cập trên thiết bị di động và máy tính" },
    { icon: Award, label: "Giấy chứng nhận hoàn thành" },
  ].filter((x): x is { icon: LucideIcon; label: string } => x !== null);
}

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
  const fieldLabel = FIELD_FILTER_OPTIONS.find((f) => f.value === roadmap.field)?.label ?? roadmap.field;
  const includes = courseIncludes(course);
  const relatedTopics = Array.from(new Set([fieldLabel, ...course.technologies]));
  const updatedLabel = new Date(roadmap.updatedAt).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" });
  const firstAvailableLesson = course.chapters.flatMap((chapter) => chapter.lessons).find((lesson) => !lesson.isLocked);
  const hrefForLesson = (lesson: Lesson) => {
    const lessonHref = `/paths/${roadmap.slug}/courses/${course.slug}/learn/${lesson.id}`;
    return course.slug === "java-core" && lesson.type === "exercise"
      ? `/solve/library-management-oop?returnTo=${encodeURIComponent(lessonHref)}`
      : lessonHref;
  };

  return (
    <div>
      <nav className="mb-3.5 flex flex-wrap items-center gap-1.5 text-xs text-text-faint">
        <Link href="/paths" className="hover:text-navy">
          Lộ trình học
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{fieldLabel}</span>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/paths/${roadmap.slug}#curriculum`} className="hover:text-navy">
          {roadmap.title}
        </Link>
      </nav>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-lg bg-navy p-6 text-on-ink">
            <div className="mb-2 text-[10.5px] font-bold tracking-wide text-primary uppercase">
              Khóa học · {roadmap.title}
            </div>
            <h1 className="mb-2 text-2xl font-bold">{course.title}</h1>
            <p className="mb-3.5 max-w-xl text-sm leading-relaxed text-zinc-300">{course.description}</p>

            {course.instructor && (
              <p className="mb-2.5 text-xs text-zinc-300">
                Được tạo bởi <span className="font-semibold text-white">{course.instructor}</span>
              </p>
            )}

            {course.rating && (
              <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-200">
                <span className="font-bold text-primary">{course.rating.toFixed(1)}</span>
                <StarRating rating={course.rating} />
                <span className="text-zinc-400">({course.ratingCount?.toLocaleString("vi-VN")} đánh giá)</span>
                {course.studentCount && (
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Users className="h-3.5 w-3.5" /> {course.studentCount.toLocaleString("vi-VN")} học viên
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-300">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> {LEVEL_DISPLAY_LABEL[course.level]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {course.durationHours} giờ
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> {course.totalChapters} chương · {course.totalLessons} bài học
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Cập nhật {updatedLabel}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Tiếng Việt
              </span>
            </div>
          </div>

          {course.outcomes.length > 0 && (
            <Card className="mb-3.5 p-5">
              <h2 className="mb-3 text-sm font-bold text-navy">Nội dung bài học</h2>
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

          {relatedTopics.length > 0 && (
            <div className="mb-3.5">
              <h2 className="mb-2 text-sm font-bold text-navy">Khám phá các chủ đề liên quan</h2>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map((t) => (
                  <Badge key={t} tone="neutral" className="rounded-full px-3 py-1">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Card className="mb-3.5 p-5">
            <h2 className="mb-3 text-sm font-bold text-navy">Khóa học này bao gồm:</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {includes.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs text-text">
                  <item.icon className="h-4 w-4 shrink-0 text-text-faint" />
                  {item.label}
                </div>
              ))}
            </div>
          </Card>

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
          <CourseCurriculumOutline course={course} roadmapSlug={roadmap.slug} hrefForLesson={hrefForLesson} />
        </div>

        <div className="flex w-full flex-col gap-3.5 lg:w-80 lg:shrink-0">
          <Card className="overflow-hidden p-0">
            <div className="relative h-40 w-full bg-border-soft">
              <Image
                src={placeholderCoverUrl(course.slug, 480, 270)}
                alt=""
                fill
                sizes="320px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-navy/25">
                <PlayCircle className="h-11 w-11 text-white drop-shadow" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-navy">Tiến độ của bạn</div>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-primary">{course.progressPercent}%</span>
              <span className="text-xs text-text-faint">hoàn thành</span>
            </div>
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-border-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
            </div>
            {firstAvailableLesson ? (
              <Link
                href={hrefForLesson(firstAvailableLesson)}
                className="mt-1 block w-full rounded-md bg-primary py-2.5 text-center text-sm font-semibold text-on-ink hover:bg-primary-hover"
              >
                {started ? "Học tiếp bài đang dở →" : "Bắt đầu học ngay →"}
              </Link>
            ) : (
              <span className="mt-1 block rounded-md bg-bg py-2.5 text-center text-sm font-semibold text-text-faint">Nội dung đang biên soạn</span>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
