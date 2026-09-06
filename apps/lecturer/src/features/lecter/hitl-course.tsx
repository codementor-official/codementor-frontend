"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { api } from "@/lib/api";
import {
  MAX_LESSONS_PER_BATCH,
  chapterSchema,
  lessonContentSchema,
  toCurriculumPayload,
  toLessonContentPayload,
} from "./curriculum-payload";
import {
  ProposalCard,
  SettledProposal,
  describeApiError,
  readOutcome,
  savedWithErrors,
} from "./proposal-card";

/**
 * Tool GHI của nghiệp vụ soạn khóa học. Cùng luật với `hitl.tsx`: khai ở TRÌNH DUYỆT, agent chỉ
 * phát ra lời gọi rồi dừng, và chính hộp xác nhận này gọi `api.courses.*` bằng token của người
 * đang ngồi trước màn hình.
 *
 * Không có `delete_course`, `submit`, `moderate`, `publish` — không phải vì prompt cấm, mà vì
 * chúng không tồn tại trong danh sách tool.
 *
 * Khóa học Lecter tạo ra mặc định là nháp: `courses.status @default(draft)` ở tầng cơ sở dữ liệu.
 *
 * `save_curriculum` là tool nguy hiểm nhất trong cả hệ thống: `PUT /courses/:id/curriculum` thay
 * TOÀN BỘ cây, nên chương hay bài nào vắng mặt trong payload sẽ bị xóa cùng `lesson_progress` của
 * mọi học viên đang học. Ba lớp chắn, không lớp nào là prompt:
 *   1. `check={…}` chạy `POST /ai/lecter/check/curriculum` trên ĐÚNG mảng sắp ghi, ngay khi thẻ
 *      hiện ra, và kết quả đi ngược về agent kể cả khi người soạn vẫn bấm lưu. Đây là lớp duy
 *      nhất agent không đi vòng được — tool `validate_curriculum` thì nó có thể bỏ qua, và
 *      payload đưa cho tool đó không nhất thiết là payload gửi đi lưu.
 *   2. Danh sách mục sẽ biến mất do SERVER tính, bằng cách so payload với cây thật. Trước đây thẻ
 *      tra tên từ `removeIds` do chính agent khai, nên một lượt quên echo id thì nó không hiện gì.
 *   3. `removeIds` tách Ý ĐỊNH xóa khỏi dữ liệu, và đó là thứ quyết định nút có bấm được không.
 *      Lỗi nội dung chỉ còn là cảnh báo — người soạn vẫn lưu được để khỏi mất công — nhưng một
 *      mục sắp biến mất mà agent CHƯA khai vào `removeIds` thì vẫn khoá nút: gần như luôn là nó
 *      quên echo id, và một cú bấm ở đó xóa `lesson_progress` của người khác, không lấy lại được.
 */

const level = z.enum(["none", "basic", "intermediate", "experienced"]);

export function LecterCourseHumanInTheLoop() {
  useHumanInTheLoop(
    {
      name: "create_course",
      description:
        "Tạo một khóa học MỚI ở trạng thái nháp. Chỉ tạo vỏ (tiêu đề, trình độ); chương và bài " +
        "lưu sau bằng save_curriculum. Người dùng phải xác nhận.",
      parameters: z.object({
        title: z.string().max(200).describe("Tên khóa học, tối đa 200 ký tự."),
        level: level.describe("Trình độ đầu vào: none là không yêu cầu gì."),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        const title = `Tạo khóa học nháp: ${args.title}`;
        const lines = [`Trình độ: ${args.level}`];
        if (status === "complete")
          return <SettledProposal lines={lines} outcome={readOutcome(result)} title={title} />;
        return (
          <ProposalCard
            title={title}
            lines={lines}
            confirmLabel="Tạo khóa nháp"
            onConfirm={async () => {
              const created = await api.courses.create({ title: args.title, level: args.level });
              await respond?.(
                JSON.stringify({
                  outcome: "applied",
                  id: created.id,
                  slug: created.slug,
                  title: created.title,
                  status: "draft",
                  note: "Đã tạo khóa nháp. Dùng id này cho các bước sau; gọi `read_course` trước khi soạn cây.",
                }),
              );
              return "Đã tạo khóa nháp";
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "KHÔNG tạo được khóa học. Sửa rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất tạo khóa học.",
                }),
              )
            }
          />
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "update_course_meta",
      description:
        "Sửa thông tin chung của một khóa học (tên, mô tả, trình độ, ghi chú điều kiện, chủ đề). " +
        "Trường nào không gửi thì giữ nguyên, TRỪ tagIds — gửi tagIds là thay cả tập chủ đề.",
      parameters: z.object({
        id: z.string(),
        title: z.string().max(200).optional(),
        description: z.string().max(5000).optional().describe("Bắt buộc có mới gửi duyệt được."),
        level: level.optional(),
        prerequisiteNote: z.string().max(1000).optional(),
        tagIds: z
          .array(z.string())
          .max(8)
          .optional()
          .describe("THAY CẢ TẬP, tối đa 8. Id có thật lấy từ list_topics; gửi thiếu là mất chủ đề cũ."),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        if (status === "complete")
          return (
            <SettledProposal
              outcome={readOutcome(result)}
              target={{ kind: "course", id: args.id }}
              title="Sửa thông tin khóa học"
            />
          );
        const { id, ...changes } = args;
        return (
          <ProposalCard
            title="Sửa thông tin khóa học"
            target={{ kind: "course", id }}
            lines={Object.entries(changes)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)}
            confirmLabel="Lưu thay đổi"
            onConfirm={async () => {
              await api.courses.update(id, changes as Record<string, unknown>);
              await respond?.(
                JSON.stringify({ outcome: "applied", id, note: "Đã lưu thông tin khóa học." }),
              );
              return "Đã lưu";
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "Thông tin CHƯA đổi. Sửa rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất sửa thông tin khóa học.",
                }),
              )
            }
          />
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "save_curriculum",
      description:
        "Lưu cây chương/bài của một khóa học. Chỉ gọi SAU KHI validate_curriculum trả về HỢP LỆ. " +
        "Lệnh này THAY TOÀN BỘ cây: chương hay bài nào không có trong mảng sẽ bị xóa cùng tiến độ " +
        "học viên, nên phải gửi lại đủ mọi mục kèm id đọc được từ read_course.",
      parameters: z.object({
        id: z.string(),
        chapters: z.array(chapterSchema),
        removeIds: z
          .array(z.string())
          .optional()
          .describe(
            "Id chương/bài mà giảng viên THẬT SỰ muốn xóa. Chỉ để khai ý định và hiện cảnh báo — " +
              "bỏ trống nếu không cố ý xóa gì.",
          ),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn cây chương trình…</p>;

        const lessons = args.chapters.flatMap((chapter) => chapter.lessons);
        const count = (type: string) => lessons.filter((lesson) => lesson.type === type).length;
        const lines = [
          `${args.chapters.length} chương, ${lessons.length} bài`,
          `Lý thuyết: ${count("article")} · Video: ${count("video")} · Bài code: ${count("exercise")}`,
        ];

        if (status === "complete")
          return (
            <SettledProposal
              lines={lines}
              outcome={readOutcome(result)}
              target={{ kind: "course", id: args.id }}
              title="Lưu cây chương trình"
            />
          );
        return (
          <ProposalCard
            title="Lưu cây chương trình"
            target={{ kind: "course", id: args.id }}
            check={() =>
              api.lecter.checkCurriculum({
                courseId: args.id,
                chapters: args.chapters,
                removeIds: args.removeIds,
              })
            }
            lines={lines}
            confirmLabel="Lưu cây chương trình"
            onConfirm={async (check) => {
              const saved = await api.courses.saveCurriculum(
                args.id,
                toCurriculumPayload(args.chapters),
              );
              await respond?.(
                JSON.stringify({
                  outcome: "applied",
                  id: args.id,
                  title: saved.title,
                  // Id bài học chỉ tồn tại SAU lệnh này, và `save_lesson_contents` không có đường
                  // nào khác để biết chúng. Không trả về đây thì bước soạn nội dung phải gọi
                  // `read_course` thêm một vòng chỉ để lấy đúng mấy cái id vừa sinh ra.
                  lessons: (saved.chapters ?? []).flatMap((chapter) =>
                    (chapter.lessons ?? []).map((lesson) => ({
                      id: lesson.id,
                      title: lesson.title,
                      type: lesson.type,
                      chapter: chapter.title,
                    })),
                  ),
                  note:
                    savedWithErrors(
                      check,
                      "Đọc lại bằng `read_course`, sửa, kiểm bằng `validate_curriculum` rồi lưu lại.",
                    ) ?? "Đã lưu cây. Dùng lessonId ở trên cho save_lesson_contents.",
                }),
              );
              return "Đã lưu cây chương trình";
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "Cây CHƯA lưu. Đọc lại bằng read_course, sửa, kiểm bằng validate_curriculum rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất lưu cây chương trình.",
                }),
              )
            }
          >
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {args.chapters.map((chapter, index) => (
                <li key={chapter.id ?? `${index}-${chapter.title}`}>
                  <span className="font-medium text-foreground">
                    {index + 1}. {chapter.title}
                  </span>
                  {chapter.lessons.length > 0 && (
                    <span> — {chapter.lessons.map((lesson) => lesson.title).join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </ProposalCard>
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "save_lesson_contents",
      description:
        "Lưu nội dung cho tối đa 5 bài học một lượt. lessonId phải là id CÓ THẬT, lấy từ kết quả " +
        "save_curriculum hoặc read_course. Ghi là MERGE: trường không gửi vẫn giữ giá trị cũ. " +
        "Bài article thì viết contentHtml; bài video chỉ viết summary/objectives làm dàn ý, " +
        "KHÔNG bịa media.url vì giảng viên tự tải video lên trong studio.",
      parameters: z.object({
        courseId: z.string(),
        items: z
          .array(
            z.object({
              lessonId: z.string(),
              title: z.string().describe("Tên bài, chỉ để hiện trên hộp xác nhận."),
              content: lessonContentSchema,
            }),
          )
          .max(MAX_LESSONS_PER_BATCH),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn nội dung bài học…</p>;

        const title = `Lưu nội dung ${args.items.length} bài học`;
        const lines = args.items.map(
          (item) =>
            `${item.title}: ${item.content.contentHtml?.length ?? 0} ký tự` +
            (item.content.objectives?.length ? `, ${item.content.objectives.length} mục tiêu` : ""),
        );

        if (status === "complete")
          return (
            <SettledProposal
              lines={lines}
              outcome={readOutcome(result)}
              target={{ kind: "course", id: args.courseId }}
              title={title}
            />
          );
        return (
          <ProposalCard
            title={title}
            target={{ kind: "course", id: args.courseId }}
            lines={lines}
            confirmLabel="Lưu nội dung"
            onConfirm={async () => {
              // Tuần tự, và ghi lại kết cục TỪNG bài. Hỏng giữa lô là chuyện thường (một lessonId
              // sai, một bài vừa bị xóa ở tab khác), và nếu chỉ báo "thất bại" thì model sẽ đề
              // xuất lại cả lô — ghi đè lên những bài vốn đã lưu đúng.
              const done: string[] = [];
              const failed: { title: string; reason: string }[] = [];
              for (const item of args.items) {
                try {
                  await api.courses.saveLessonContent(
                    args.courseId,
                    item.lessonId,
                    toLessonContentPayload(item.content),
                  );
                  done.push(item.title);
                } catch (cause) {
                  failed.push({ title: item.title, reason: describeApiError(cause) });
                }
              }

              // Hỏng sạch thì đi đường lỗi có sẵn của ProposalCard: `onFailure` báo ngược cho agent.
              if (done.length === 0) {
                throw new Error(failed[0]?.reason ?? "Không lưu được bài nào");
              }

              await respond?.(
                JSON.stringify({
                  outcome: "applied",
                  id: args.courseId,
                  saved: done,
                  failed,
                  note: failed.length
                    ? "Chỉ những bài trong `saved` đã lưu. Đề xuất lại RIÊNG các bài trong `failed`, đừng gửi lại cả lô."
                    : "Đã lưu nội dung các bài trên.",
                }),
              );
              return failed.length
                ? `Đã lưu ${done.length}/${args.items.length} bài — ${failed.length} bài lỗi`
                : `Đã lưu nội dung ${done.length} bài`;
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "Nội dung CHƯA lưu. Kiểm lại lessonId bằng read_course rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất lưu nội dung bài học.",
                }),
              )
            }
          >
            {args.items.map((item) => (
              <details className="mt-3" key={item.lessonId}>
                <summary className="cursor-pointer text-sm font-medium">{item.title}</summary>
                <div className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 text-xs">
                  {item.content.summary && <p className="mb-2">{item.content.summary}</p>}
                  {item.content.objectives && item.content.objectives.length > 0 && (
                    <ul className="mb-2 space-y-0.5">
                      {item.content.objectives.map((objective) => (
                        <li key={objective}>· {objective}</li>
                      ))}
                    </ul>
                  )}
                  {/* Văn bản thô, KHÔNG dangerouslySetInnerHTML: đây là HTML do model sinh ra từ
                      tài liệu người dùng tải lên, và hộp xác nhận không phải chỗ để nó chạy. */}
                  {item.content.contentHtml && (
                    <pre className="whitespace-pre-wrap">{item.content.contentHtml}</pre>
                  )}
                </div>
              </details>
            ))}
          </ProposalCard>
        );
      },
    },
    [],
  );

  return null;
}
