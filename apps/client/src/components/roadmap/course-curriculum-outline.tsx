import Link from "next/link";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, getChapterDurationMinutes } from "@/lib/roadmap/roadmap-stats";
import type { Chapter, Course, Lesson } from "@/types/roadmap";

function findNextLessonId(course: Course): string | null {
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (!lesson.isCompleted && !lesson.isLocked) return lesson.id;
    }
  }
  return null;
}

function LessonRow({ lesson, isNext, href }: { lesson: Lesson; isNext: boolean; href: string }) {
  const content = <>
    {lesson.isLocked ? (
      <Lock className="h-4 w-4 shrink-0 text-text-faint" />
    ) : lesson.isCompleted ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-navy" />
    ) : (
      <Circle className="h-4 w-4 shrink-0 text-text-faint" />
    )}
    <span className={`flex-1 truncate ${isNext ? "font-semibold text-primary" : "text-navy"}`}>{lesson.title}</span>
    {lesson.isPreview && <Badge tone="neutral">Học thử</Badge>}
    <span className="shrink-0 text-xs text-text-faint">{formatMinutes(lesson.durationMinutes)}</span>
  </>;

  if (lesson.isLocked) {
    return <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm opacity-60">{content}</div>;
  }

  return (
    <Link href={href} className={`flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-bg ${isNext ? "bg-primary-tint" : ""}`}>
      {content}
    </Link>
  );
}

function ChapterBlock({
  chapter,
  index,
  nextLessonId,
  roadmapSlug,
  courseSlug,
  hrefForLesson,
}: {
  chapter: Chapter;
  index: number;
  nextLessonId: string | null;
  roadmapSlug: string;
  courseSlug: string;
  hrefForLesson?: (lesson: Lesson) => string;
}) {
  const doneCount = chapter.lessons.filter((l) => l.isCompleted).length;
  const containsNext = chapter.lessons.some((l) => l.id === nextLessonId);

  return (
    <details className="border-b border-border-soft last:border-b-0" open={index === 0 || containsNext}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-bg px-4 py-3">
        <span className="text-sm font-bold text-navy">
          {index + 1}. {chapter.title}
        </span>
        <span className="shrink-0 text-xs font-medium text-text-faint">
          {doneCount}/{chapter.lessons.length} · {formatMinutes(getChapterDurationMinutes(chapter))}
        </span>
      </summary>
      <div className="divide-y divide-border-soft">
        {chapter.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} isNext={lesson.id === nextLessonId} href={hrefForLesson?.(lesson) ?? `/paths/${roadmapSlug}/courses/${courseSlug}/learn/${lesson.id}`} />
        ))}
      </div>
    </details>
  );
}

export function CourseCurriculumOutline({
  course,
  roadmapSlug,
  hrefForLesson,
}: {
  course: Course;
  roadmapSlug: string;
  hrefForLesson?: (lesson: Lesson) => string;
}) {
  if (course.chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-text-faint">
        Nội dung chi tiết của khóa học này đang được biên soạn.
      </div>
    );
  }

  const nextLessonId = findNextLessonId(course);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {course.chapters.map((chapter, i) => (
        <ChapterBlock key={chapter.id} chapter={chapter} index={i} nextLessonId={nextLessonId} roadmapSlug={roadmapSlug} courseSlug={course.slug} hrefForLesson={hrefForLesson} />
      ))}
    </div>
  );
}
