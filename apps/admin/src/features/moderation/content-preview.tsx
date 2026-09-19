"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { resolveVideo } from "@codementor/utils";
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
      <p
        className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
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

  const removable = data as {
    removalRequested?: boolean;
    rejectionReason?: string | null;
    submitNote?: string | null;
  };
  const asking =
    item.status === "published" && removable.removalRequested === true;
  // Ghi chú chỉ tồn tại trong lúc chờ duyệt — sau khi quyết, ô đó mang nghĩa khác.
  const note =
    item.status === "pending_review" ? removable.submitNote?.trim() : null;

  return (
    <>
      {/* Thẻ yêu cầu gỡ đứng TRƯỚC nội dung: khi mở một request ra, câu hỏi đầu tiên là
       * "ai xin gỡ cái gì, vì sao", còn bản thân nội dung là thứ để đối chiếu sau đó. */}
      {asking && (
        <RemovalRequestCard
          author={item.authorName}
          reason={removable.rejectionReason ?? ""}
          requestedAt={item.updatedAt}
          title={item.title}
        />
      )}
      {/* Tác giả đã nói họ sửa gì — đọc trước khi mở nội dung ra so, vì đó là thứ duy
       * nhất cho biết cần xem lại chỗ nào ở một bản đã từng bị trả lại. */}
      {note && (
        <section className="mb-4 rounded-lg border border-border bg-muted/40 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <MessageSquare
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            <h3 className="text-xs font-bold tracking-wide uppercase">
              Ghi chú của tác giả
            </h3>
          </div>
          <p className="text-sm whitespace-pre-line">{note}</p>
        </section>
      )}

      {/* `hideReason` khi đang xin gỡ: `rejectionReason` lúc này CHÍNH LÀ lý do xin gỡ,
       * và thẻ ở trên đã in nó ra rồi. Không chặn thì cùng một câu hiện hai lần trong
       * hai khối viền vàng giống hệt nhau — đúng chỗ nhìn vào thấy rối và trùng. */}
      <Body
        contentId={item.id}
        data={data}
        hideReason={asking || note !== null}
        kind={item.kind}
      />
    </>
  );
}

const requestDateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Một yêu cầu xin gỡ, đọc được trong một lượt nhìn: nội dung nào, ai gửi, vì sao, lúc
 * nào, đang ở trạng thái gì.
 *
 * KHÔNG có nút bấm ở đây. Trước kia khối này tự mang hai nút Duyệt/Từ chối, rồi ngăn kéo
 * lại có thêm hai nút y hệt ở chân — người duyệt thấy cùng một hành động hai lần và
 * không biết hai nút đó có khác nhau không. Hành động thuộc về chân ngăn kéo, giống mọi
 * khay khác; khối này chỉ trả lời "chuyện gì đang xảy ra".
 */
function RemovalRequestCard({
  title,
  author,
  reason,
  requestedAt,
}: {
  title: string;
  author: string | null;
  reason: string;
  requestedAt: string;
}) {
  return (
    <section className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Inbox aria-hidden="true" className="size-4 shrink-0 text-warning" />
        <h3 className="text-xs font-bold tracking-wide uppercase text-warning">
          Yêu cầu gỡ nội dung
        </h3>
        <StatusBadge tone="warning">Chờ quyết định</StatusBadge>
      </div>

      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Nội dung</dt>
        <dd className="font-medium">{title}</dd>

        <dt className="text-muted-foreground">Người gửi</dt>
        <dd>{author ?? "không rõ"}</dd>

        <dt className="text-muted-foreground">Thời gian gửi</dt>
        <dd>{requestDateFormat.format(new Date(requestedAt))}</dd>

        <dt className="text-muted-foreground">Lý do</dt>
        <dd className="whitespace-pre-line">{reason.trim() || "không nêu"}</dd>
      </dl>

      <p className="mt-2.5 text-xs text-muted-foreground">
        Nội dung vẫn đang công khai và học viên vẫn dùng bình thường cho tới khi
        bạn quyết.
      </p>
    </section>
  );
}

function Body({
  data,
  kind,
  contentId,
  hideReason,
}: {
  data: unknown;
  kind: ContentKind;
  contentId: string;
  hideReason: boolean;
}) {
  if (kind === "articles")
    return (
      <ArticleBody article={data as ArticlePreview} hideReason={hideReason} />
    );
  if (kind === "courses")
    return (
      <CourseBody
        course={data as CoursePreview}
        courseId={contentId}
        hideReason={hideReason}
      />
    );
  if (kind === "roadmaps")
    return (
      <RoadmapBody hideReason={hideReason} roadmap={data as RoadmapPreview} />
    );
  return (
    <ExerciseSummary
      exercise={data as ExercisePreview}
      hideReason={hideReason}
    />
  );
}

function ArticleBody({
  article,
  hideReason,
}: {
  article: ArticlePreview;
  hideReason: boolean;
}) {
  return (
    <div>
      <ArticleCover
        key={article.coverImageUrl ?? "without-cover"}
        title={article.title}
        url={article.coverImageUrl}
      />
      <Facts
        items={[
          [
            "Chủ đề",
            article.tagName ??
              "chưa gắn — bài sẽ không lọc được bên trang người học",
          ],
          [
            "Thời gian đọc",
            article.readMinutes ? `${article.readMinutes} phút` : "—",
          ],
        ]}
      />
      <ReasonNote hidden={hideReason} reason={article.rejectionReason} />
      {article.excerpt && <Quote label="Tóm tắt">{article.excerpt}</Quote>}
      {article.takeaway && (
        <Quote label="Điều đọng lại">{article.takeaway}</Quote>
      )}

      {/* Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản xem trước ở đây và bản
       * người học đọc trông giống nhau — bản xem trước lệch với bản thật thì duyệt bằng
       * nó cũng bằng không. Hiện TRỌN VẸN, không giới hạn chiều cao: ngăn kiểm duyệt đã
       * tự cuộn cả khối, giới hạn thêm một lớp bên trong chỉ khiến bài dài bị cắt oan. */}
      {article.contentHtml ? (
        <div
          className="rich-text mt-4 rounded-lg border border-border p-4"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      ) : (
        <Empty>Bài chưa có nội dung.</Empty>
      )}
    </div>
  );
}

/** Ảnh mà người học sẽ thấy trên feed và đầu bài phải được admin duyệt cùng nội dung. */
function ArticleCover({ title, url }: { title: string; url: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <div className="mb-4 flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        <ImageIcon aria-hidden="true" className="size-4" />
        Bài viết chưa có ảnh bìa
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className="mb-4 flex min-h-24 items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive"
        role="alert"
      >
        <ImageIcon aria-hidden="true" className="size-4" />
        Không tải được ảnh bìa — cần yêu cầu tác giả kiểm tra lại
      </div>
    );
  }

  return (
    <figure className="mb-4 overflow-hidden rounded-lg border border-border bg-muted">
      {/* Ảnh do storage/CDN của backend cấp URL; dùng img để không phụ thuộc allowlist host của Next Image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`Ảnh bìa bài viết ${title}`}
        className="aspect-[16/7] max-h-72 w-full object-cover"
        onError={() => setFailed(true)}
        src={url}
      />
      <figcaption className="border-t border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        Ảnh bìa hiển thị trên trang người học
      </figcaption>
    </figure>
  );
}

function CourseBody({
  course,
  courseId,
  hideReason,
}: {
  course: CoursePreview;
  courseId: string;
  hideReason: boolean;
}) {
  const chapters = course.chapters ?? [];
  return (
    <div>
      <Facts
        items={[
          ["Trình độ", course.level],
          [
            "Thời lượng",
            course.durationHours ? `${course.durationHours} giờ` : "—",
          ],
          [
            "Nội dung",
            `${course.totalChapters} chương · ${course.totalLessons} bài`,
          ],
        ]}
      />
      <ReasonNote hidden={hideReason} reason={course.rejectionReason} />
      {course.description && <Quote label="Mô tả">{course.description}</Quote>}

      {chapters.length === 0 ? (
        <Empty>Khoá học chưa có chương nào.</Empty>
      ) : (
        <ol className="mt-4 grid gap-2">
          {chapters.map((chapter, index) => (
            <li
              className="rounded-lg border border-border p-3"
              key={chapter.id}
            >
              <p className="text-sm font-medium">
                {index + 1}. {chapter.title}
                {chapter.isOptional && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (tuỳ chọn)
                  </span>
                )}
              </p>
              {chapter.lessons.length === 0 ? (
                <p className="mt-1 text-xs text-destructive">
                  Chương rỗng — không có bài học nào.
                </p>
              ) : (
                <ul className="mt-1.5 grid gap-1">
                  {chapter.lessons.map((lesson) => (
                    <LessonRow
                      courseId={courseId}
                      key={lesson.id}
                      lesson={lesson}
                    />
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
 * Một dòng bài học, mở ra được ngay tại chỗ — cho cả hai loại.
 *
 * Bài LÝ THUYẾT mở ra đọc thân bài (`contentHtml`): đây là chỗ hay bị bỏ trống nhất mà
 * trước kia không màn nào cho thấy. Bài CODE mở ra đọc luôn bài tập nó trỏ tới — đề bài,
 * test case, lời giải mẫu — như đang mở đúng bài đó trong Studio, không phải suy từ tiêu
 * đề và trạng thái trên dòng danh sách.
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
  const [lessonContent, setLessonContent] = useState<
    LessonContentPreview | null | undefined
  >(undefined);
  const [exercise, setExercise] = useState<ExercisePreview | null | undefined>(
    undefined,
  );

  const isVideo = lesson.type === "video";
  const isTheory = !lesson.exerciseTitle;
  const emptyTheory = isTheory && lesson.contentRef === null;
  // Video của bài nằm trong cùng document MongoDB với thân bài, nên nó đi về cùng lượt
  // đọc `lessonContent` — không có nhánh nạp riêng.
  const video = isVideo ? resolveVideo(lessonContent?.media?.url) : null;

  useEffect(() => {
    if (!open) return;
    if (isTheory) {
      if (lessonContent !== undefined) return;
      void moderationApi
        .lessonContent(request, courseId, lesson.id)
        .then(setLessonContent);
    } else if (lesson.exerciseId) {
      if (exercise !== undefined) return;
      void moderationApi
        .detail<ExercisePreview>(request, "exercises", lesson.exerciseId)
        .then(setExercise)
        .catch(() => setExercise(null));
    }
  }, [
    open,
    isTheory,
    lessonContent,
    exercise,
    request,
    courseId,
    lesson.id,
    lesson.exerciseId,
  ]);

  return (
    <li className="text-xs text-muted-foreground">
      <button
        className="flex w-full items-center gap-2 rounded py-0.5 text-left hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
        )}
        {isVideo ? (
          <PlayCircle aria-hidden="true" className="size-3.5 shrink-0" />
        ) : isTheory ? (
          <FileText aria-hidden="true" className="size-3.5 shrink-0" />
        ) : (
          <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
        {/* Bài lý thuyết không có `contentRef` là một ô rỗng với học viên — đúng thứ mà
         * việc duyệt phải bắt được. Bài code chưa công khai thì học viên mở ra cũng
         * không thấy gì, dù dòng chương trông như đã đủ bài. */}
        {emptyTheory && (
          <span className="shrink-0 text-destructive">chưa có nội dung</span>
        )}
        {!isTheory &&
          lesson.exerciseStatus &&
          lesson.exerciseStatus !== "published" && (
            <span className="shrink-0 text-warning">chưa công khai</span>
          )}
      </button>

      {open && (
        <div className="mt-1.5 mb-2 ml-5 border-l border-border pl-3">
          {isTheory ? (
            lessonContent === undefined ? (
              <Loading />
            ) : isVideo ? (
              // Bài video phải XEM ĐƯỢC ngay trong hàng chờ. Duyệt một bài video mà chỉ
              // nhìn thấy tiêu đề là duyệt một đường dẫn chưa ai mở thử.
              video === null ? (
                <p className="py-2 text-destructive">Bài học chưa có video.</p>
              ) : video.kind === "file" ? (
                <video
                  className="w-full rounded-md border border-border bg-ink-fixed"
                  controls
                  preload="metadata"
                  src={video.src}
                />
              ) : (
                <iframe
                  allowFullScreen
                  className="aspect-video w-full rounded-md border border-border"
                  src={video.src}
                  title={lesson.title}
                />
              )
            ) : lessonContent === null || !lessonContent.contentHtml ? (
              <p className="py-2 text-destructive">Bài học chưa có nội dung.</p>
            ) : (
              <div
                className="rich-text rounded-md border border-border bg-background p-3 text-foreground"
                dangerouslySetInnerHTML={{ __html: lessonContent.contentHtml }}
              />
            )
          ) : !lesson.exerciseId ? (
            <p className="py-2 text-destructive">
              Bài học chưa gắn bài code nào.
            </p>
          ) : exercise === undefined ? (
            <Loading />
          ) : exercise === null ? (
            <p className="py-2 text-destructive">
              Không đọc được bài code này.
            </p>
          ) : (
            <ExerciseSummary compact exercise={exercise} />
          )}
        </div>
      )}
    </li>
  );
}

function RoadmapBody({
  roadmap,
  hideReason,
}: {
  roadmap: RoadmapPreview;
  hideReason: boolean;
}) {
  const courses = roadmap.courses ?? [];
  // Gửi duyệt lộ trình bị chặn khi còn khoá học chưa công khai (`Roadmap.submit()`), nên
  // ở đây con số này lẽ ra luôn là 0 — vẫn tính và hiện ra để bắt được trường hợp một
  // khoá học bị gỡ SAU KHI lộ trình đã vào hàng chờ, thứ mà không màn nào khác báo.
  const blocking = courses.filter(
    (course) => course.status !== "published",
  ).length;
  return (
    <div>
      <Facts
        items={[
          ["Lĩnh vực", roadmap.field],
          ["Trình độ", roadmap.level],
          [
            "Thời lượng",
            roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "—",
          ],
        ]}
      />
      <ReasonNote hidden={hideReason} reason={roadmap.rejectionReason} />
      {roadmap.shortDescription && (
        <Quote label="Mô tả ngắn">{roadmap.shortDescription}</Quote>
      )}
      {roadmap.description && (
        <Quote label="Mô tả">{roadmap.description}</Quote>
      )}

      {courses.length === 0 ? (
        <Empty>Lộ trình chưa có khoá học nào.</Empty>
      ) : (
        <ol className="mt-4 grid gap-1.5">
          {courses.map((course, index) => (
            <RoadmapCourseRow
              course={course}
              index={index}
              key={course.courseId}
            />
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

/**
 * Một khoá trong lộ trình, mở ra được ngay tại chỗ — cùng kiểu mở-và-tải mà `LessonRow`
 * dùng cho bài học trong khoá học. Admin duyệt lộ trình cần đọc được TRỌN nội dung từng
 * khoá (mô tả, chương, bài, loại bài) trước khi quyết, không chỉ thấy mỗi cái tên.
 */
function RoadmapCourseRow({
  course,
  index,
}: {
  course: NonNullable<RoadmapPreview["courses"]>[number];
  index: number;
}) {
  const request = useAdminApi();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CoursePreview | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!open || detail !== undefined) return;
    void moderationApi
      .detail<CoursePreview>(request, "courses", course.courseId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [open, detail, request, course.courseId]);

  return (
    <li className="rounded-lg border border-border text-sm">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        )}
        <span className="text-muted-foreground">{index + 1}.</span>
        <span className="min-w-0 flex-1 truncate">{course.title}</span>
        {course.isOptional && (
          <span className="text-xs text-muted-foreground">tuỳ chọn</span>
        )}
        <StatusBadge
          tone={course.status === "published" ? "success" : "warning"}
        >
          {course.status === "published" ? "đã đăng" : course.status}
        </StatusBadge>
      </button>

      {open && (
        <div className="border-t border-border bg-background px-3 py-3">
          {detail === undefined ? (
            <Loading />
          ) : detail === null ? (
            <p className="py-2 text-xs text-destructive">
              Không đọc được khoá học này.
            </p>
          ) : (
            <CourseBody
              course={detail}
              courseId={course.courseId}
              hideReason={false}
            />
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Toàn bộ một bài code: đề bài, test case, lời giải mẫu — đúng những gì Studio cho tác
 * giả xem lúc soạn, không phải bản tóm lược.
 *
 * Dùng ở hai chỗ: đứng đầu ngăn kiểm duyệt khi CHÍNH bài code đó đang chờ duyệt, và lồng
 * bên trong một bài học khi khoá học đang chờ duyệt trỏ tới nó — `compact` chỉ bớt cỡ chữ
 * tiêu đề, nội dung hiện đủ như nhau ở cả hai nơi vì admin cần đọc thật, không phải liếc qua.
 */
function ExerciseSummary({
  exercise,
  compact = false,
  hideReason = false,
}: {
  exercise: ExercisePreview;
  compact?: boolean;
  hideReason?: boolean;
}) {
  const content = exercise.content ?? {};
  const testCases = content.testCases ?? [];
  const languagesWithSolution = (content.languages ?? []).filter((lang) =>
    lang.referenceSolution?.trim(),
  );

  return (
    <div>
      <Facts
        items={[
          ["Dạng bài", exercise.kind],
          ["Độ khó", exercise.difficulty],
          [
            "Phạm vi",
            exercise.visibility === "public" ? "công khai" : "trong nhóm",
          ],
          [
            "Ngôn ngữ",
            (content.languages ?? []).map((item) => item.label).join(", ") ||
              "—",
          ],
        ]}
      />
      {!compact && (
        <ReasonNote hidden={hideReason} reason={exercise.rejectionReason} />
      )}
      {exercise.summary && <Quote label="Tóm tắt">{exercise.summary}</Quote>}

      {content.statement ? (
        <div className="mt-4 rounded-lg border border-border p-4 text-sm whitespace-pre-wrap">
          {content.statement}
        </div>
      ) : (
        <Empty>Bài chưa có đề.</Empty>
      )}

      {(content.examples ?? []).length > 0 && (
        <div className="mt-3 grid gap-2">
          {(content.examples ?? []).map((example, index) => (
            <div
              className="rounded-lg border border-border p-3 text-xs"
              key={index}
            >
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

      {testCases.length > 0 && (
        <div className="mt-4">
          <p
            className={
              compact
                ? "text-xs font-medium text-muted-foreground"
                : "text-sm font-medium"
            }
          >
            Test case ({testCases.length})
          </p>
          <ol className="mt-1.5 grid gap-1.5">
            {[...testCases]
              .sort((a, b) => a.order - b.order)
              .map((testCase) => (
                <li
                  className="rounded-lg border border-border p-2.5 text-xs"
                  key={testCase.order}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Case {testCase.order}</span>
                    <StatusBadge
                      tone={
                        testCase.visibility === "public" ? "neutral" : "warning"
                      }
                    >
                      {testCase.visibility === "public" ? "công khai" : "ẩn"}
                    </StatusBadge>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Đầu vào</p>
                      <pre className="mt-0.5 overflow-x-auto rounded bg-muted px-1.5 py-1 whitespace-pre-wrap">
                        {formatCaseValue(testCase.input ?? testCase.args)}
                      </pre>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Đầu ra mong đợi</p>
                      <pre className="mt-0.5 overflow-x-auto rounded bg-muted px-1.5 py-1 whitespace-pre-wrap">
                        {formatCaseValue(testCase.expected)}
                      </pre>
                    </div>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      )}

      {languagesWithSolution.length > 0 && (
        <div className="mt-4 grid gap-3">
          {languagesWithSolution.map((lang) => (
            <div key={lang.id}>
              <p
                className={
                  compact
                    ? "text-xs font-medium text-muted-foreground"
                    : "text-sm font-medium"
                }
              >
                Lời giải mẫu — {lang.label}
              </p>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs">
                {lang.referenceSolution}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** `args` là mảng tham số vị trí ở chế độ chữ ký hàm; `input`/`expected` có thể là chuỗi
 * hoặc bất kỳ giá trị JSON nào — hiện cả hai dạng đọc được thay vì `[object Object]`. */
function formatCaseValue(value: unknown): string {
  if (value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
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

/**
 * Lý do từ chối/yêu cầu sửa/gỡ — MỘT ô dùng chung cho mọi quyết định, kể cả khi giảng
 * viên tự gỡ nội dung đang công khai của họ (bắt buộc nêu lý do, xem `ReasonButton` bên
 * app giảng viên). Admin cần đọc được câu này ngay khi mở xem trước, không phải đoán vì
 * sao nội dung không còn ở trạng thái ban đầu.
 */
function ReasonNote({
  reason,
  hidden = false,
}: {
  reason: string | null;
  hidden?: boolean;
}) {
  // `hidden` khi đang có yêu cầu xin gỡ: cùng một ô `rejection_reason` phục vụ hai nghĩa
  // (lý do bị trả lại, và lý do tác giả xin gỡ), nên khối kia đã in thì khối này phải im.
  if (!reason || hidden) return null;
  return (
    <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
      <strong>Lý do:</strong> {reason}
    </p>
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

function Loading() {
  return (
    <p className="flex items-center gap-1.5 py-2">
      <Loader2 aria-hidden="true" className="size-3 animate-spin" />
      Đang tải…
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
