"use client";

import { BookOpen, FileText, FlaskConical, Languages, ListTree, Route } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { DetailMeta, DetailRow, DetailSection, DrawerDetail, StatusBadge } from "@codementor/ui";
import { DIFFICULTY_LABELS, STATUS_LABELS, STATUS_TONES, showValue, type Difficulty, type ExerciseStatus } from "@codementor/solve";
import { FIELD_LABELS, LEVEL_LABELS, type Field, type Level } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { dateTimeFormat } from "@/features/moderation/vocabulary";
import { moderationApi, type ContentKind, type QueueItem } from "@/lib/api";

/**
 * Nội dung thật của bản ghi đang chọn, ngay trong drawer.
 *
 * Danh sách chỉ mang tiêu đề, tác giả và ngày gửi — đủ để tìm, không đủ để quyết định.
 * Cùng cách giảng viên đọc bài của mình: gọi endpoint chi tiết lúc mở drawer, chứ không
 * kéo cả đề bài và cây chương trình về cho hai mươi dòng bảng.
 *
 * Đây là bản đọc lướt. Chạy thử đề, mở thân từng bài học, xem trạng thái từng khóa trong
 * lộ trình thì vào trang kiểm tra — nút ở chân drawer.
 */
export function ModerationDrawerBody({ kind, row }: { kind: ContentKind; row: QueueItem }) {
  const request = useAdminApi();

  if (kind === "exercises") {
    return (
      <DrawerDetail key={row.id} load={() => moderationApi.exercise(request, row.id)}>
        {(exercise) => {
          const languages = exercise.content?.languages ?? [];
          const cases = exercise.content?.testCases ?? [];
          const publicCases = cases.filter((testCase) => testCase.visibility === "public");

          return (
            <>
              <DetailMeta>
                <DetailRow label="Slug" value={exercise.slug} />
                <DetailRow label="Độ khó" value={DIFFICULTY_LABELS[exercise.difficulty as Difficulty]} />
                <DetailRow
                  label="Trạng thái"
                  value={
                    <StatusBadge tone={STATUS_TONES[exercise.status as ExerciseStatus] ?? "neutral"}>
                      {STATUS_LABELS[exercise.status as ExerciseStatus] ?? exercise.status}
                    </StatusBadge>
                  }
                />
                <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
                <DetailRow
                  label="Giới hạn"
                  value={`${exercise.timeLimitMs} ms · ${Math.round(exercise.memoryLimitKb / 1024)} MB`}
                />
                <DetailRow label="Cập nhật" value={dateTimeFormat.format(new Date(exercise.updatedAt))} />
              </DetailMeta>

              <RejectionNote reason={exercise.rejectionReason} />

              <DetailSection icon={FileText} title="Đề bài">
                {exercise.content?.statement ? (
                  // `.rich-text` là bộ style thân bài dùng chung (ui/rich-text.css) — cùng
                  // thứ trình soạn thảo và trang học viên dùng.
                  <div className="rich-text text-sm">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                      {exercise.content.statement}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-warning">Bài này chưa có đề — không duyệt được.</p>
                )}
              </DetailSection>

              <DetailSection icon={Languages} title="Ngôn ngữ hỗ trợ">
                {languages.length === 0 ? (
                  <p className="text-sm text-warning">Chưa khai báo ngôn ngữ nào.</p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {languages.map((language) => (
                      <li className="rounded-md border px-2 py-1 text-xs font-medium" key={language.id}>
                        {language.label}
                        {/* Thiếu lời giải mẫu nghĩa là chưa ai chạy thử đề này lần nào. */}
                        {!language.referenceSolution && (
                          <span className="ml-1.5 text-warning">chưa có lời giải</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>

              <DetailSection
                icon={FlaskConical}
                title={`Test case (${publicCases.length} công khai · ${cases.length - publicCases.length} ẩn)`}
              >
                {publicCases.length === 0 ? (
                  <p className="text-sm text-warning">
                    Chưa có case công khai nào — học viên sẽ không thấy ví dụ.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {publicCases.map((testCase) => (
                      <li className="rounded-md border p-3 font-mono text-xs" key={testCase.order}>
                        <p className="font-sans text-muted-foreground">Đầu vào</p>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {showValue(testCase.args ?? testCase.input) || "(rỗng)"}
                        </pre>
                        <p className="mt-2 font-sans text-muted-foreground">Đầu ra</p>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {showValue(testCase.expected) || "(rỗng)"}
                        </pre>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>
            </>
          );
        }}
      </DrawerDetail>
    );
  }

  if (kind === "courses") {
    return (
      <DrawerDetail key={row.id} load={() => moderationApi.course(request, row.id)}>
        {(course) => {
          const chapters = course.chapters ?? [];
          const lessons = chapters.flatMap((chapter) => chapter.lessons);
          const unusable = lessons.filter(
            (lesson) => lesson.exerciseId !== null && lesson.exerciseStatus !== "published",
          ).length;
          const empty = lessons.filter(
            (lesson) => lesson.exerciseId === null && lesson.contentRef === null,
          ).length;

          return (
            <>
              <DetailMeta>
                <DetailRow label="Slug" value={course.slug} />
                <DetailRow label="Cấp độ" value={LEVEL_LABELS[course.level as Level] ?? course.level} />
                <DetailRow
                  label="Trạng thái"
                  value={
                    <StatusBadge tone={STATUS_TONES[course.status as ExerciseStatus] ?? "neutral"}>
                      {STATUS_LABELS[course.status as ExerciseStatus] ?? course.status}
                    </StatusBadge>
                  }
                />
                <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
                <DetailRow
                  label="Quy mô"
                  value={`${course.totalChapters} chương · ${course.totalLessons} bài`}
                />
                <DetailRow label="Cập nhật" value={dateTimeFormat.format(new Date(course.updatedAt))} />
              </DetailMeta>

              <RejectionNote reason={course.rejectionReason} />

              <DetailSection icon={BookOpen} title="Giới thiệu">
                <p className="text-sm whitespace-pre-wrap">
                  {course.description || (
                    <span className="text-warning">Chưa có mô tả — học viên không biết khóa này dạy gì.</span>
                  )}
                </p>
              </DetailSection>

              <DetailSection icon={ListTree} title={`Chương trình học (${chapters.length} chương)`}>
                {chapters.length === 0 ? (
                  <p className="text-sm text-warning">Khóa học chưa có chương nào.</p>
                ) : (
                  <ol className="grid gap-1.5">
                    {chapters.map((chapter, index) => (
                      <li
                        className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm"
                        key={chapter.id}
                      >
                        <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
                        <span
                          className={`shrink-0 text-xs ${chapter.lessons.length === 0 ? "text-warning" : "text-muted-foreground"}`}
                        >
                          {chapter.lessons.length} bài
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {(unusable > 0 || empty > 0) && (
                  <ul className="mt-2 grid gap-1 text-xs text-warning">
                    {empty > 0 && <li>{empty} bài lý thuyết chưa có nội dung.</li>}
                    {unusable > 0 && (
                      <li>{unusable} bài code được nhúng chưa công khai — học viên sẽ gặp bài trống.</li>
                    )}
                  </ul>
                )}
              </DetailSection>
            </>
          );
        }}
      </DrawerDetail>
    );
  }

  return (
    <DrawerDetail key={row.id} load={() => moderationApi.roadmap(request, row.id)}>
      {(roadmap) => {
        const courses = roadmap.courses ?? [];
        const unpublished = courses.filter((course) => course.status !== "published").length;

        return (
          <>
            <DetailMeta>
              <DetailRow label="Slug" value={roadmap.slug} />
              <DetailRow label="Lĩnh vực" value={FIELD_LABELS[roadmap.field as Field] ?? roadmap.field} />
              <DetailRow label="Cấp độ" value={LEVEL_LABELS[roadmap.level as Level] ?? roadmap.level} />
              <DetailRow
                label="Trạng thái"
                value={
                  <StatusBadge tone={STATUS_TONES[roadmap.status as ExerciseStatus] ?? "neutral"}>
                    {STATUS_LABELS[roadmap.status as ExerciseStatus] ?? roadmap.status}
                  </StatusBadge>
                }
              />
              <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
              <DetailRow label="Cập nhật" value={dateTimeFormat.format(new Date(roadmap.updatedAt))} />
            </DetailMeta>

            <RejectionNote reason={roadmap.rejectionReason} />

            <DetailSection icon={Route} title="Giới thiệu">
              <p className="text-sm whitespace-pre-wrap">
                {roadmap.description || roadmap.shortDescription || (
                  <span className="text-warning">Chưa có mô tả.</span>
                )}
              </p>
            </DetailSection>

            <DetailSection icon={ListTree} title={`Khóa học trong lộ trình (${courses.length})`}>
              {courses.length === 0 ? (
                <p className="text-sm text-warning">Lộ trình chưa có khóa học nào.</p>
              ) : (
                <ol className="grid gap-1.5">
                  {courses.map((course, index) => (
                    <li
                      className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm"
                      key={course.courseId}
                    >
                      <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {course.title}
                        {course.isOptional && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(tuỳ chọn)</span>
                        )}
                      </span>
                      <StatusBadge tone={STATUS_TONES[course.status as ExerciseStatus] ?? "neutral"}>
                        {STATUS_LABELS[course.status as ExerciseStatus] ?? course.status}
                      </StatusBadge>
                    </li>
                  ))}
                </ol>
              )}
              {unpublished > 0 && (
                <p className="mt-2 text-xs text-warning">
                  {unpublished} khóa chưa công khai — người học sẽ thấy lộ trình hụt.
                </p>
              )}
            </DetailSection>
          </>
        );
      }}
    </DrawerDetail>
  );
}

/** Lý do của lần quyết định trước. Đọc nó trước khi quyết định lần này. */
function RejectionNote({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
      <span className="font-medium text-warning">Lý do lần trước: </span>
      <span className="whitespace-pre-wrap">{reason}</span>
    </p>
  );
}
