"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { resolveVideo } from "@codementor/utils";
import { Card } from "@/components/ui/card";
import type { LessonContent, LessonProgress } from "@/types/catalogue";
import type { FlatLesson } from "./lesson-shell";

/** Long enough that skipping is deliberate, short enough not to punish a fast reader. */
const DWELL_SECONDS = 5;

/**
 * Reading gate: the finish button unlocks once the learner has either scrolled to the end
 * of the body or stayed for a few seconds.
 *
 * It is a nudge, not proof. Anyone can call the progress endpoint directly, and the server
 * has no way to tell reading from waiting. It exists to stop a reflexive click-through, and
 * claiming more for it would be dishonest.
 */
function useReadingGate(bodyRef: React.RefObject<HTMLElement | null>) {
  const [dwelled, setDwelled] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDwelled(true), DWELL_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = bodyRef.current;
    if (!element) return;
    // The sentinel is the end of the body, so a short lesson that never scrolls counts as
    // read the moment it renders — otherwise the gate would punish brevity.
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setScrolledToEnd(true),
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [bodyRef]);

  return dwelled || scrolledToEnd;
}

export function TheoryLesson({
  lesson,
  content,
  progress,
  enrolled,
  onComplete,
  saving,
}: {
  lesson: FlatLesson;
  content: LessonContent | null;
  progress: LessonProgress | undefined;
  enrolled: boolean;
  onComplete: (secondsSpent: number) => void;
  saving: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const canFinish = useReadingGate(endRef);
  const isVideo = lesson.type === "video";
  // `resolveVideo` trả `null` cho URL rỗng hoặc sai — nên một bài video chưa soạn xong
  // rơi đúng vào nhánh "chưa có nội dung" bên dưới thay vì vẽ một khung phát rỗng.
  const video = isVideo ? resolveVideo(content?.media?.url) : null;
  // Stamped in an effect, not during render: `Date.now()` is impure, and under strict mode
  // a render can run twice, which would put the clock start in the wrong place.
  const openedAt = useRef(0);
  const done = progress?.status === "completed";

  useEffect(() => {
    openedAt.current = Date.now();
  }, [lesson.id]);

  const finish = useCallback(() => {
    const elapsed = openedAt.current === 0 ? 0 : Math.round((Date.now() - openedAt.current) / 1000);
    onComplete(elapsed);
  }, [onComplete]);

  return (
    <>
      <article>
        <p className="mb-1 text-2xs font-bold tracking-wide text-text-faint uppercase">
          {lesson.chapterTitle}
        </p>
        <h1 className="text-2xl font-bold text-navy">{lesson.title}</h1>
        {content?.summary && <p className="mt-2 text-sm text-text-muted">{content.summary}</p>}

        {content?.objectives && content.objectives.length > 0 && (
          <Card className="mt-4 p-4">
            <h2 className="mb-2 text-sm font-bold text-navy">Bạn sẽ học được gì</h2>
            <ul className="flex flex-col gap-1.5">
              {content.objectives.map((objective) => (
                <li key={objective} className="flex gap-2 text-xs leading-relaxed text-text">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {objective}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Bài video: khung phát đứng TRƯỚC thân bài, không thay thế nó. Giảng viên vẫn
          * viết được ghi chú, dàn ý hay mã nguồn kèm theo bên dưới video. */}
        {video && (
          <div className="mt-5">
            {video.kind === "file" ? (
              <video
                className="w-full rounded-lg border border-border-soft bg-ink-fixed"
                controls
                preload="metadata"
                src={video.src}
              />
            ) : (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-lg border border-border-soft"
                src={video.src}
                title={lesson.title}
              />
            )}
          </div>
        )}

        {content?.contentHtml ? (
          // The body is TipTap output authored in the studio, and `.rich-text` is the same
          // stylesheet the studio previews with — so what the author saw is what renders.
          <div
            className="rich-text mt-5"
            dangerouslySetInnerHTML={{ __html: content.contentHtml }}
          />
        ) : (
          // Bài video có khung phát rồi thì KHÔNG phải "chưa có nội dung": thân bài là
          // phần thêm, không bắt buộc. Thiếu điều kiện này thì mọi bài video đều hiện
          // thêm một ô "Giảng viên đang biên soạn" ngay dưới video đang phát được.
          !video && (
            <Card className="mt-5 border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-navy">
                {isVideo ? "Bài học chưa có video" : "Bài học chưa có nội dung"}
              </p>
              <p className="mt-1 text-xs text-text-faint">Giảng viên đang biên soạn.</p>
            </Card>
          )
        )}
        <div ref={endRef} aria-hidden />
      </article>

      {!enrolled ? (
        <p className="mt-5 text-xs text-text-faint">
          Đăng ký khóa học để lưu tiến độ của bạn.
        </p>
      ) : done ? (
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary-tint px-3 py-2 text-xs font-semibold text-primary">
          <Check className="h-3.5 w-3.5" /> Đã hoàn thành
        </span>
      ) : (
        <button
          type="button"
          onClick={finish}
          disabled={!canFinish || saving}
          title={canFinish ? undefined : `Đọc hết bài hoặc đợi ${DWELL_SECONDS} giây`}
          className="mt-5 flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-2 text-xs font-semibold text-on-ink transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Đánh dấu đã hoàn thành
        </button>
      )}
    </>
  );
}
