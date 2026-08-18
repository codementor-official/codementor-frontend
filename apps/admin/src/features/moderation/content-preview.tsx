"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, FileText, Loader2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi } from "@/lib/api";
import {
  type ArticlePreview,
  type ContentKind,
  type CoursePreview,
  type ExercisePreview,
  type LessonContentPreview,
  type QueueItem,
  type RoadmapPreview,
} from "./types";

/**
 * Bản xem trước của nội dung đang chờ duyệt.
 *
 * Trước đây ngăn kiểm duyệt chỉ có tiêu đề, slug, tác giả và ngày gửi — tức là quản trị
 * viên bấm "Duyệt" mà chưa từng nhìn thấy thứ mình duyệt. Bốn loại nội dung có bốn hình
 * dạng khác nhau nên không có một bản xem trước chung; nhưng cả bốn đều đọc được từ chính
 * endpoint chi tiết mà `owns()` đã cho admin quyền vào.
 */
export function ContentPreview({ item }: { item: QueueItem }) {
  const request = useAdminApi();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    void moderationApi
      .detail(request, item.kind, item.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [request, item.kind, item.id]);

  if (error !== null) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
        Không đọc được nội dung để xem trước: {error}
      </p>
    );
  }
  if (data === null) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang tải nội dung…
      </p>
    );
  }

  return <Body contentId={item.id} data={data} kind={item.kind} />;
}

function Body({ data, kind, contentId }: { data: unknown; kind: ContentKind; contentId: string }) {
  if (kind === "articles") return <ArticleBody article={data as ArticlePreview} />;
  if (kind === "courses") return <CourseBody course={data as CoursePreview} courseId={contentId} />;
  if (kind === "roadmaps") return <RoadmapBody roadmap={data as RoadmapPreview} />;
  return <ExerciseBody exercise={data as ExercisePreview} />;
}

function ArticleBody({ article }: { article: ArticlePreview }) {
  return (
    <div>
      <Facts
        items={[
          ["Chủ đề", article.tagName ?? "chưa gắn — bài sẽ không lọc được bên trang người học"],
          ["Thời gian đọc", article.readMinutes ? `${article.readMinutes} phút` : "—"],
        ]}
      />
      {article.excerpt && <Quote label="Tóm tắt">{article.excerpt}</Quote>}
      {article.takeaway && <Quote label="Điều đọng lại">{article.takeaway}</Quote>}

      {/* Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản xem trước ở đây và bản
        * người học đọc trông giống nhau — bản xem trước lệch với bản thật thì duyệt bằng
        * nó cũng bằng không. */}
      {article.contentHtml ? (
        <div
          className="rich-text mt-4 max-h-96 overflow-y-auto rounded-lg border border-border p-4"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      ) : (
        <Empty>Bài chưa có nội dung.</Empty>
      )}
    </div>
  );
}

function CourseBody({ course, courseId }: { course: CoursePreview; courseId: string }) {
  const chapters = course.chapters ?? [];
  return (
    <div>
      <Facts
        items={[
          ["Trình độ", course.level],
          ["Thời lượng", course.durationHours ? `${course.durationHours} giờ` : "—"],
          ["Nội dung", `${course.totalChapters} chương · ${course.totalLessons} bài`],
        ]}
      />
      {course.description && <Quote label="Mô tả">{course.description}</Quote>}

      {chapters.length === 0 ? (
        <Empty>Khoá học chưa có chương nào.</Empty>
      ) : (
        <ol className="mt-4 grid gap-2">
          {chapters.map((chapter, index) => (
            <li className="rounded-lg border border-border p-3" key={chapter.id}>
              <p className="text-sm font-medium">
                {index + 1}. {chapter.title}
                {chapter.isOptional && (
                  <span className="ml-2 text-xs text-muted-foreground">(tuỳ chọn)</span>
                )}
              </p>
              {chapter.lessons.length === 0 ? (
                <p className="mt-1 text-xs text-destructive">Chương rỗng — không có bài học nào.</p>
              ) : (
                <ul className="mt-1.5 grid gap-1">
                  {chapter.lessons.map((lesson) => (
                    <LessonRow courseId={courseId} key={lesson.id} lesson={lesson} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * Một dòng bài học, mở ra được để đọc thân bài — chứ không chỉ tiêu đề.
 *
 * Chỉ bài LÝ THUYẾT mở ra tại chỗ: nội dung của nó (`contentHtml`) là thứ duy nhất một
 * dòng danh sách không thể hiện, và cùng lúc là thứ hay bị bỏ trống nhất — mục "Gợi ý
 * hoàn thiện" bên bảng điều khiển giảng viên đã phải suy nó ra chứ chưa từng hiện ra được.
 * Bài CODE không cần mở: nó đã có màn kiểm duyệt riêng khi tự nó đi qua hàng chờ, và tiêu
 * đề + trạng thái trên dòng này là đủ để biết bài đó dùng được hay chưa.
 */
function LessonRow({
  courseId,
  lesson,
}: {
  courseId: string;
  lesson: NonNullable<CoursePreview["chapters"]>[number]["lessons"][number];
}) {
  const request = useAdminApi();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<LessonContentPreview | null | undefined>(undefined);

  const isTheory = !lesson.exerciseTitle;
  const empty = isTheory && lesson.contentRef === null;

  useEffect(() => {
    if (!open || !isTheory || content !== undefined) return;
    void moderationApi.lessonContent(request, courseId, lesson.id).then(setContent);
  }, [open, isTheory, content, request, courseId, lesson.id]);

  return (
    <li className="text-xs text-muted-foreground">
      <button
        className="flex w-full items-center gap-2 rounded py-0.5 text-left hover:text-foreground disabled:cursor-default"
        disabled={!isTheory}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {isTheory ? (
          open ? (
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
          )
        ) : (
          <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
        )}
        {isTheory && !open && <FileText aria-hidden="true" className="size-3.5 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
        {/* Bài lý thuyết không có `contentRef` là một ô rỗng với học viên — đúng thứ mà
          * việc duyệt phải bắt được. */}
        {empty && <span className="shrink-0 text-destructive">chưa có nội dung</span>}
      </button>

      {open && isTheory && (
        <div className="mt-1 ml-5">
          {content === undefined ? (
            <p className="flex items-center gap-1.5 py-2">
              <Loader2 aria-hidden="true" className="size-3 animate-spin" />
              Đang tải…
            </p>
          ) : content === null || !content.contentHtml ? (
            <p className="py-2 text-destructive">Bài học chưa có nội dung.</p>
          ) : (
            <div
              className="rich-text max-h-64 overflow-y-auto rounded-md border border-border bg-background p-3 text-foreground"
              dangerouslySetInnerHTML={{ __html: content.contentHtml }}
            />
          )}
        </div>
      )}
    </li>
  );
}

function RoadmapBody({ roadmap }: { roadmap: RoadmapPreview }) {
  const courses = roadmap.courses ?? [];
  // Gửi duyệt lộ trình bị chặn khi còn khoá học chưa công khai (`Roadmap.submit()`), nên
  // ở đây con số này lẽ ra luôn là 0 — vẫn tính và hiện ra để bắt được trường hợp một
  // khoá học bị gỡ SAU KHI lộ trình đã vào hàng chờ, thứ mà không màn nào khác báo.
  const blocking = courses.filter((course) => course.status !== "published").length;
  return (
    <div>
      <Facts
        items={[
          ["Lĩnh vực", roadmap.field],
          ["Trình độ", roadmap.level],
          ["Thời lượng", roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "—"],
        ]}
      />
      {roadmap.shortDescription && <Quote label="Mô tả ngắn">{roadmap.shortDescription}</Quote>}
      {roadmap.description && <Quote label="Mô tả">{roadmap.description}</Quote>}

      {courses.length === 0 ? (
        <Empty>Lộ trình chưa có khoá học nào.</Empty>
      ) : (
        <ol className="mt-4 grid gap-1.5">
          {courses.map((course, index) => (
            <li
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              key={course.courseId}
            >
              <span className="text-muted-foreground">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{course.title}</span>
              {course.isOptional && <span className="text-xs text-muted-foreground">tuỳ chọn</span>}
              <StatusBadge tone={course.status === "published" ? "success" : "warning"}>
                {course.status === "published" ? "đã đăng" : course.status}
              </StatusBadge>
            </li>
          ))}
        </ol>
      )}
      {blocking > 0 && (
        <p className="mt-2 text-xs text-warning">
          {blocking} khoá học trong lộ trình này chưa công khai.
        </p>
      )}
    </div>
  );
}

function ExerciseBody({ exercise }: { exercise: ExercisePreview }) {
  const content = exercise.content ?? {};
  const testCases = content.testCases ?? [];
  return (
    <div>
      <Facts
        items={[
          ["Dạng bài", exercise.kind],
          ["Độ khó", exercise.difficulty],
          ["Phạm vi", exercise.visibility === "public" ? "công khai" : "trong nhóm"],
          ["Bộ test", `${testCases.length} ca`],
          ["Ngôn ngữ", (content.languages ?? []).map((item) => item.label).join(", ") || "—"],
        ]}
      />
      {exercise.summary && <Quote label="Tóm tắt">{exercise.summary}</Quote>}

      {content.statement ? (
        <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-border p-4 text-sm whitespace-pre-wrap">
          {content.statement}
        </div>
      ) : (
        <Empty>Bài chưa có đề.</Empty>
      )}

      {(content.examples ?? []).length > 0 && (
        <div className="mt-3 grid gap-2">
          {(content.examples ?? []).map((example, index) => (
            <div className="rounded-lg border border-border p-3 text-xs" key={index}>
              <p className="font-medium">Ví dụ {index + 1}</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                {example.input}
                {"\n→ "}
                {example.output}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Mảnh dùng chung */

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-1.5 text-sm">
      {items.map(([label, value]) => (
        <div className="flex gap-3" key={label}>
          <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 flex-1 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Quote({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{children}</p>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "lỗi không rõ";
}

