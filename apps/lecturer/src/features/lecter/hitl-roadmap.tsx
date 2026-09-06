"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { api } from "@/lib/api";
import {
  MAX_ROADMAP_COURSES,
  assertRealCourseIds,
  roadmapCourseArgSchema,
  toRoadmapCoursesPayload,
} from "./roadmap-payload";
import { ProposalCard, SettledProposal, readOutcome } from "./proposal-card";

/**
 * Tool GHI của nghiệp vụ soạn lộ trình. Cùng luật với `hitl.tsx` và `hitl-course.tsx`: khai ở
 * TRÌNH DUYỆT, agent chỉ phát ra lời gọi rồi dừng, và chính hộp xác nhận này gọi `api.roadmaps.*`
 * bằng token của người đang ngồi trước màn hình.
 *
 * Không có `delete_roadmap`, `submit`, `moderate` — không phải vì prompt cấm, mà vì chúng không
 * tồn tại trong danh sách tool.
 *
 * Lộ trình Lecter tạo ra mặc định là nháp: `Roadmap.create` đặt cứng `status: 'draft'`.
 *
 * `save_roadmap_courses` là bản lộ trình của `save_curriculum`: `PUT /roadmaps/:id/courses` thay
 * TOÀN BỘ danh sách, nên khóa nào vắng mặt trong payload sẽ bị gỡ khỏi lộ trình. Ba lớp chắn
 * giống hệt bên khóa học, không lớp nào là prompt:
 *   1. `check={…}` chạy `POST /ai/lecter/check/roadmap-courses` trên ĐÚNG mảng sắp ghi. Còn lỗi
 *      thì nút bị khoá — lớp duy nhất agent không đi vòng được.
 *   2. Danh sách khóa sẽ biến mất do SERVER tính, bằng cách so payload với danh sách thật.
 *   3. `removeIds` chỉ để tách Ý ĐỊNH gỡ khỏi dữ liệu.
 *
 * Hậu quả nhẹ hơn cây chương trình một bậc và thẻ xác nhận nói đúng như vậy: `course_enrollments`
 * và `lesson_progress` treo ở khóa học, nên gỡ một khóa khỏi lộ trình KHÔNG xoá dữ liệu nào. Thứ
 * đổi là phái sinh — `fn_recalc_roadmap_progress` tính lại phần trăm trên số khóa còn lại.
 */

const field = z.enum(["frontend", "backend", "fullstack", "mobile", "data_ai", "foundation"]);
const level = z.enum(["none", "basic", "intermediate", "experienced"]);

export function LecterRoadmapHumanInTheLoop() {
  useHumanInTheLoop(
    {
      name: "create_roadmap",
      description:
        "Tạo một lộ trình MỚI ở trạng thái nháp. Chỉ tạo vỏ (tiêu đề, lĩnh vực, trình độ); danh " +
        "sách khóa học lưu sau bằng save_roadmap_courses. Người dùng phải xác nhận.",
      parameters: z.object({
        title: z.string().max(200).describe("Tên lộ trình, tối đa 200 ký tự."),
        field: field.describe("Lĩnh vực nghề nghiệp mà lộ trình này dẫn tới."),
        level: level.describe("Trình độ đầu vào: none là không yêu cầu gì."),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        const title = `Tạo lộ trình nháp: ${args.title}`;
        const lines = [`Lĩnh vực: ${args.field}`, `Trình độ: ${args.level}`];
        if (status === "complete")
          return <SettledProposal lines={lines} outcome={readOutcome(result)} title={title} />;
        return (
          <ProposalCard
            title={title}
            lines={lines}
            confirmLabel="Tạo lộ trình nháp"
            onConfirm={async () => {
              const created = await api.roadmaps.create({
                title: args.title,
                field: args.field,
                level: args.level,
              });
              await respond?.(
                JSON.stringify({
                  outcome: "applied",
                  id: created.id,
                  slug: created.slug,
                  title: created.title,
                  status: "draft",
                  note: "Đã tạo lộ trình nháp. Dùng id này cho các bước sau; gọi `read_roadmap` trước khi soạn danh sách khóa học.",
                }),
              );
              return "Đã tạo lộ trình nháp";
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "KHÔNG tạo được lộ trình. Sửa rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất tạo lộ trình.",
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
      name: "update_roadmap_meta",
      description:
        "Sửa thông tin chung của một lộ trình (tên, mô tả, lĩnh vực, trình độ, ghi chú điều kiện, " +
        "chủ đề). Trường nào không gửi thì giữ nguyên, TRỪ tagIds — gửi tagIds là thay cả tập chủ đề.",
      parameters: z.object({
        id: z.string(),
        title: z.string().max(200).optional(),
        shortDescription: z
          .string()
          .max(300)
          .optional()
          .describe("Một câu giới thiệu, hiện ở thẻ trong danh mục."),
        description: z.string().max(5000).optional().describe("Bắt buộc có mới gửi duyệt được."),
        field: field.optional(),
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
              target={{ kind: "roadmap", id: args.id }}
              title="Sửa thông tin lộ trình"
            />
          );
        const { id, ...changes } = args;
        return (
          <ProposalCard
            title="Sửa thông tin lộ trình"
            target={{ kind: "roadmap", id }}
            lines={Object.entries(changes)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)}
            confirmLabel="Lưu thay đổi"
            onConfirm={async () => {
              await api.roadmaps.update(id, changes as Record<string, unknown>);
              await respond?.(
                JSON.stringify({ outcome: "applied", id, note: "Đã lưu thông tin lộ trình." }),
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
                  note: "Người dùng bỏ qua đề xuất sửa thông tin lộ trình.",
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
      name: "save_roadmap_courses",
      description:
        "Lưu danh sách khóa học của một lộ trình. Chỉ gọi SAU KHI validate_roadmap_courses trả về " +
        "HỢP LỆ. Lệnh này THAY TOÀN BỘ danh sách: khóa nào không có trong mảng sẽ bị gỡ khỏi lộ " +
        "trình, nên phải gửi lại đủ mọi khóa kèm courseId đọc được từ read_roadmap. Thứ tự trong " +
        "mảng chính là thứ tự học.",
      parameters: z.object({
        id: z.string(),
        courses: z.array(roadmapCourseArgSchema).max(MAX_ROADMAP_COURSES),
        removeIds: z
          .array(z.string())
          .optional()
          .describe(
            "courseId mà giảng viên THẬT SỰ muốn gỡ khỏi lộ trình. Chỉ để khai ý định và hiện " +
              "cảnh báo — bỏ trống nếu không cố ý gỡ gì.",
          ),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn danh sách khóa học…</p>;

        const optional = args.courses.filter((course) => course.isOptional).length;
        const lines = [
          `${args.courses.length} khóa học` + (optional > 0 ? `, ${optional} khóa tuỳ chọn` : ""),
        ];

        if (status === "complete")
          return (
            <SettledProposal
              lines={lines}
              outcome={readOutcome(result)}
              target={{ kind: "roadmap", id: args.id }}
              title="Lưu danh sách khóa học"
            />
          );
        return (
          <ProposalCard
            title="Lưu danh sách khóa học"
            target={{ kind: "roadmap", id: args.id }}
            check={() =>
              api.lecter.checkRoadmapCourses({
                roadmapId: args.id,
                // Bỏ `title` trước khi kiểm: nó chỉ để hiện lên thẻ, còn `check` phải chạy trên
                // ĐÚNG mảng sắp ghi — thừa một trường là ai-service báo lỗi cho một thứ vốn
                // không bao giờ được gửi đi.
                courses: toRoadmapCoursesPayload(args.courses),
                removeIds: args.removeIds,
              })
            }
            lines={lines}
            confirmLabel="Lưu danh sách"
            onConfirm={async () => {
              assertRealCourseIds(args.courses);
              const saved = await api.roadmaps.replaceCourses(
                args.id,
                toRoadmapCoursesPayload(args.courses),
              );
              await respond?.(
                JSON.stringify({
                  outcome: "applied",
                  id: args.id,
                  title: saved.title,
                  estimatedHours: saved.estimatedHours,
                  // Tên và trạng thái từng khóa chỉ có SAU lệnh này. Trả về đây thì bước báo cáo
                  // và câu hỏi "sao chưa gửi duyệt được" không phải gọi `read_roadmap` thêm vòng.
                  courses: (saved.courses ?? []).map((course) => ({
                    courseId: course.courseId,
                    title: course.title,
                    status: course.status,
                    isOptional: course.isOptional,
                  })),
                  note: "Đã lưu danh sách. Tổng thời lượng do backend tự tính lại từ các khóa thành phần.",
                }),
              );
              return "Đã lưu danh sách khóa học";
            }}
            onFailure={(reason) =>
              respond?.(
                JSON.stringify({
                  outcome: "failed",
                  reason,
                  note: "Danh sách CHƯA lưu. Đọc lại bằng read_roadmap, sửa, kiểm bằng validate_roadmap_courses rồi đề xuất lại.",
                }),
              )
            }
            onReject={() =>
              respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người dùng bỏ qua đề xuất lưu danh sách khóa học.",
                }),
              )
            }
          >
            <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {args.courses.map((course, index) => (
                <li key={course.courseId}>
                  <span className="font-medium text-foreground">
                    {index + 1}. {course.title}
                  </span>
                  {course.isOptional && <span> — tuỳ chọn</span>}
                </li>
              ))}
            </ol>
          </ProposalCard>
        );
      },
    },
    [],
  );

  return null;
}
