import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, FileText, Lock, Play, PlayCircle, Trophy } from "lucide-react";
import { getLessonContent } from "@/data/lesson-content";
import { contentIllustration } from "@/lib/content-illustrations";
import { formatMinutes, getChapterDurationMinutes } from "@/lib/roadmap/roadmap-stats";
import type { Chapter, Course, Lesson } from "@/types/roadmap";

type LessonLocation = { chapter: Chapter; chapterIndex: number; lessonIndex: number; flatIndex: number };

function lessonHref(roadmapSlug: string, courseSlug: string, lessonId: string) {
  return `/paths/${roadmapSlug}/courses/${courseSlug}/learn/${lessonId}`;
}

function lessonTargetHref(roadmapSlug: string, course: Course, lesson: Lesson) {
  const returnTo = lessonHref(roadmapSlug, course.slug, lesson.id);
  if (course.slug === "java-core" && lesson.type === "exercise") {
    return `/solve/library-management-oop?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return returnTo;
}

function lessonIcon(lesson: Lesson) {
  if (lesson.isLocked) return <Lock className="h-3.5 w-3.5 text-text-faint" />;
  if (lesson.isCompleted) return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
  return lesson.type === "video" ? <PlayCircle className="h-3.5 w-3.5 text-text-muted" /> : <Circle className="h-3.5 w-3.5 text-text-faint" />;
}

function findLocation(course: Course, lessonId: string): LessonLocation | null {
  let flatIndex = 0;
  for (const [chapterIndex, chapter] of course.chapters.entries()) {
    for (const [lessonIndex, lesson] of chapter.lessons.entries()) {
      if (lesson.id === lessonId) return { chapter, chapterIndex, lessonIndex, flatIndex };
      flatIndex += 1;
    }
  }
  return null;
}

function allLessons(course: Course) {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

export function CourseLessonPlayer({ roadmapSlug, course, lessonId }: { roadmapSlug: string; course: Course; lessonId: string }) {
  const location = findLocation(course, lessonId);
  if (!location) return null;

  const lesson = location.chapter.lessons[location.lessonIndex];
  const content = getLessonContent(course, lesson);
  const lessons = allLessons(course);
  const previous = lessons[location.flatIndex - 1];
  const next = lessons[location.flatIndex + 1];
  const isVideo = lesson.type === "video";
  const isPractice = lesson.type === "exercise" || lesson.type === "project" || lesson.type === "challenge" || lesson.type === "quiz";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-navy px-4 py-3 text-on-ink sm:px-5">
        <Link href={`/paths/${roadmapSlug}/courses/${course.slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Quay lại khóa học
        </Link>
        <span className="hidden h-4 w-px bg-white/20 sm:block" />
        <span className="text-xs font-semibold text-white">{course.title}</span>
        <span className="text-xs text-zinc-400">Bài {location.flatIndex + 1}/{lessons.length}</span>
      </div>

      <div className="grid min-h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="min-w-0 border-b border-border lg:border-r lg:border-b-0">
          {isVideo ? (
            <div className="relative flex aspect-video min-h-70 items-center justify-center overflow-hidden bg-navy">
              <Image src={contentIllustration(`${course.slug}-${lesson.id}`)} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-contain opacity-65" />
              <div className="absolute inset-0 bg-linear-to-br from-navy/65 via-navy/20 to-primary/35" />
              <div className="relative z-10 text-center text-white">
                <button type="button" aria-label="Phát video minh họa" className="mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-full bg-white text-primary shadow-lg transition-transform hover:scale-105">
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                </button>
                <p className="text-sm font-semibold">Video minh họa · {formatMinutes(lesson.durationMinutes)}</p>
                <p className="mt-1 text-xs text-zinc-200">Nội dung video đang dùng mock asset cho bản prototype</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-70 items-center justify-center bg-linear-to-br from-primary-tint via-surface to-bg p-8 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-on-ink"><FileText className="h-6 w-6" /></div>
                <p className="text-sm font-bold text-navy">{isPractice ? "Không gian thực hành" : "Bài đọc có hướng dẫn"}</p>
                <p className="mt-1 text-xs text-text-muted">Đọc yêu cầu và theo dõi checklist bên dưới.</p>
                {isPractice && <Link href={lessonTargetHref(roadmapSlug, course, lesson)} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-ink hover:bg-primary-hover">Mở khung làm bài <ChevronRight className="h-4 w-4" /></Link>}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8 lg:px-10">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-text-faint">
              <span className="rounded-full bg-primary-tint px-2.5 py-1 font-semibold text-primary">Chương {location.chapterIndex + 1}</span>
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatMinutes(lesson.durationMinutes)}</span>
              {lesson.isCompleted && <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành</span>}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-navy sm:text-3xl">{lesson.title}</h1>
            <p className="mb-6 text-sm leading-relaxed text-text-muted">{content.summary}</p>

            <section className="mb-6 rounded-lg border border-primary/20 bg-primary-tint p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy"><Trophy className="h-4 w-4 text-primary" /> Sau bài này bạn có thể</h2>
              <ul className="space-y-1.5 text-sm text-text-muted">
                {content.objectives.map((objective) => <li key={objective} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{objective}</li>)}
              </ul>
            </section>

            {content.sections.map((section) => (
              <section key={section.heading} className="mb-6">
                <h2 className="mb-2 text-lg font-bold text-navy">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-2 text-sm leading-7 text-text-muted">{paragraph}</p>)}
              </section>
            ))}

            {content.code && (
              <section className="mb-6 overflow-hidden rounded-lg border border-border bg-navy">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-zinc-300"><span>{content.code.label}</span><span>{content.code.language}</span></div>
                <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-zinc-100"><code>{content.code.value}</code></pre>
              </section>
            )}

            {content.exerciseBrief && (
              <section className="mb-6 rounded-lg border border-border bg-bg p-4">
                <h2 className="mb-3 text-lg font-bold text-navy">Yêu cầu thực hành</h2>
                <ol className="space-y-2 text-sm leading-relaxed text-text-muted">
                  {content.exerciseBrief.map((item, index) => <li key={item} className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-on-ink">{index + 1}</span>{item}</li>)}
                </ol>
              </section>
            )}

            <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              {previous && !previous.isLocked ? <Link href={lessonTargetHref(roadmapSlug, course, previous)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-navy hover:bg-bg"><ChevronLeft className="h-4 w-4" /> Bài trước</Link> : <span />}
              {next && !next.isLocked ? <Link href={lessonTargetHref(roadmapSlug, course, next)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-ink hover:bg-primary-hover">Bài tiếp theo <ChevronRight className="h-4 w-4" /></Link> : <span className="text-xs font-medium text-text-faint">Bạn đã xem hết các bài đang mở.</span>}
            </nav>
          </div>
        </article>

        <aside className="bg-surface lg:sticky lg:top-0 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div className="border-b border-border px-4 py-4">
            <h2 className="text-base font-bold text-navy">Nội dung khóa học</h2>
            <p className="mt-1 text-xs text-text-faint">{course.totalChapters} chương · {course.totalLessons} bài học</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} /></div>
          </div>
          {course.chapters.map((chapter, chapterIndex) => {
            const isActiveChapter = chapter.id === location.chapter.id;
            const completed = chapter.lessons.filter((item) => item.isCompleted).length;
            return (
              <details key={chapter.id} open={isActiveChapter} className="border-b border-border-soft">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 hover:bg-bg">
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-navy">{chapterIndex + 1}. {chapter.title}</span><span className="mt-0.5 block text-xs text-text-faint">{completed}/{chapter.lessons.length} · {formatMinutes(getChapterDurationMinutes(chapter))}</span></span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-text-faint" />
                </summary>
                <div className="pb-1">
                  {chapter.lessons.map((chapterLesson) => {
                    const active = chapterLesson.id === lesson.id;
                    const row = <><span className="mt-0.5 shrink-0">{lessonIcon(chapterLesson)}</span><span className={`min-w-0 flex-1 text-xs leading-relaxed ${active ? "font-semibold text-primary" : "text-text"}`}>{chapterLesson.title}</span><span className="shrink-0 text-[11px] text-text-faint">{formatMinutes(chapterLesson.durationMinutes)}</span></>;
                    return chapterLesson.isLocked ? <div key={chapterLesson.id} className="flex gap-2 px-4 py-2.5 opacity-55">{row}</div> : <Link key={chapterLesson.id} href={lessonTargetHref(roadmapSlug, course, chapterLesson)} className={`flex gap-2 px-4 py-2.5 hover:bg-bg ${active ? "bg-primary-tint" : ""}`}>{row}</Link>;
                  })}
                </div>
              </details>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
