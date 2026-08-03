import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, Clock, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAuthoredProblem } from "@/data/authored-problems";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getAuthoredProblem(lessonId);
  // Code problems live in the solve workspace, so only theory resolves here.
  if (!lesson || lesson.kind !== "theory") notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách bài tập
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary">
          {lesson.chapter}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" /> {lesson.durationMinutes} phút
        </span>
        {lesson.status === "draft" && (
          <span className="text-xs text-text-faint">Bản nháp — chưa hiển thị với người học</span>
        )}
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-navy">{lesson.title}</h1>
      <p className="mt-1.5 text-sm text-text-muted">{lesson.summary}</p>

      <Card className="mt-5 border-primary/20 bg-primary-tint p-4 shadow-none">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">
          <Trophy className="h-4 w-4 text-primary" /> Sau bài này bạn có thể
        </p>
        <ul className="flex flex-col gap-1.5">
          {lesson.objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2 text-sm text-text">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {objective}
            </li>
          ))}
        </ul>
      </Card>

      {/* Authored by our own Tiptap editor and never fetched from elsewhere; revisit if
       * lessons ever load from an API. `.rich-text` is the same block the editor uses,
       * so the reader matches what the author saw. */}
      <div
        className="rich-text mt-6"
        dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
      />

      {lesson.assignedGroups.length > 0 && (
        <section className="mt-8 border-t border-border-soft pt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
            <Users className="h-3.5 w-3.5" /> Nhóm đã bàn giao
          </h2>
          <p className="text-sm text-text">{lesson.assignedGroups.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
