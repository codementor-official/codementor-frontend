"use client";

import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Circle, Code2, FileText, Lock, PlayCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { CourseDetail, CourseLesson, LessonProgress } from "@/types/catalogue";

const LESSON_ICON: Record<string, typeof FileText> = {
  video: PlayCircle,
  article: FileText,
  exercise: Code2,
  quiz: Code2,
  challenge: Code2,
  project: Code2,
};

export interface FlatLesson extends CourseLesson {
  chapterTitle: string;
  chapterPosition: number;
}

/**
 * Chapters flattened into the order a learner walks them — the same
 * `(chapter.position, lesson.position)` ordering the backend gates on. Prev/next and the
 * table of contents both read from this, so they can never disagree about what "next" is.
 */
export function flattenLessons(course: CourseDetail): FlatLesson[] {
  return [...course.chapters]
    .sort((a, b) => a.position - b.position)
    .flatMap((chapter) =>
      [...chapter.lessons]
        .sort((a, b) => a.position - b.position)
        .map((lesson) => ({
          ...lesson,
          chapterTitle: chapter.title,
          chapterPosition: chapter.position,
        })),
    );
}

/**
 * The frame every lesson type shares: table of contents on the left, body in the middle,
 * prev/next underneath. A theory lesson and a code-exercise preview differ only in what
 * goes in `children` — same chrome, so moving between them does not feel like a new screen.
 */
export function LessonShell({
  course,
  lessons,
  progressByLesson,
  current,
  footer,
  children,
}: {
  course: CourseDetail;
  lessons: FlatLesson[];
  progressByLesson: Map<string, LessonProgress>;
  current: FlatLesson;
  /** The completion control — differs per lesson type, so the page owns it. */
  footer: ReactNode;
  children: ReactNode;
}) {
  const index = lessons.findIndex((lesson) => lesson.id === current.id);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const nextProgress = next ? progressByLesson.get(next.id) : undefined;
  const nextLocked = Boolean(next) && nextProgress?.isAvailable === false;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-5 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <Link
          href={`/courses/${course.id}`}
          className="mb-3 block min-w-0 text-sm font-bold text-navy hover:underline"
        >
          <span className="line-clamp-2">{course.title}</span>
        </Link>

        <ol className="flex flex-col gap-0.5">
          {lessons.map((lesson, position) => {
            const progress = progressByLesson.get(lesson.id);
            const done = progress?.status === "completed";
            const locked = progress?.isAvailable === false;
            const active = lesson.id === current.id;
            const Icon = LESSON_ICON[lesson.type] ?? FileText;
            const showsChapter =
              position === 0 || lessons[position - 1].chapterPosition !== lesson.chapterPosition;

            const row = (
              <span className="flex items-center gap-2">
                {done ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : locked ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-text-faint" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-text-faint" />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0 text-text-faint" />
                <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
              </span>
            );

            return (
              <li key={lesson.id}>
                {showsChapter && (
                  <p className="mt-3 mb-1 px-2 text-2xs font-bold tracking-wide text-text-faint uppercase">
                    {lesson.chapterTitle}
                  </p>
                )}
                {locked ? (
                  // Not a link: the server would reject it, so offering the click would
                  // only teach the learner that the app sometimes says no for no reason.
                  <span className="block cursor-not-allowed rounded-md px-2 py-1.5 text-xs text-text-faint">
                    {row}
                  </span>
                ) : (
                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                      active ? "bg-bg font-semibold text-navy" : "text-text hover:bg-bg"
                    }`}
                  >
                    {row}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="min-w-0">
        {children}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          {previous ? (
            <Link
              href={`/courses/${course.id}/lessons/${previous.id}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-bg"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Bài trước
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {footer}
            {next &&
              (nextLocked ? (
                <span
                  title="Hoàn thành bài này để mở bài tiếp theo"
                  className="flex cursor-not-allowed items-center gap-1.5 rounded-md bg-border-soft px-3.5 py-2 text-xs font-semibold text-text-faint"
                >
                  Bài tiếp theo <Lock className="h-3.5 w-3.5" />
                </span>
              ) : (
                <Link
                  href={`/courses/${course.id}/lessons/${next.id}`}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-on-ink transition-colors hover:bg-primary-hover"
                >
                  Bài tiếp theo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
