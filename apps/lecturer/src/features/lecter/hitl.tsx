"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { ExerciseContent } from "@codementor/solve";
import { api } from "@/lib/api";
import { ProposalCard } from "./proposal-card";

/**
 * Ba tool GHI, và chỉ ba. Chúng được khai báo ở TRÌNH DUYỆT, không ở ai-service: agent phát ra
 * lời gọi rồi dừng, hộp xác nhận hiện lên, và chính hộp đó gọi `api.exercises.*` bằng token của
 * người dùng.
 *
 * Không có `delete_exercise`, `submit`, `moderate`, `publish`, `fork` ở đây — không phải vì prompt
 * cấm, mà vì chúng không tồn tại trong danh sách tool. Một agent bị prompt injection cũng không
 * gọi được thứ không được đăng ký.
 *
 * Bài Lecter tạo ra mặc định là nháp: `exercises.status @default(draft)` ở tầng cơ sở dữ liệu,
 * nên "nội dung mới phải là nháp" không cần một dòng mã nào ở đây để đúng.
 */

const difficulty = z.enum(["easy", "medium", "hard"]);

const typeIr = z.record(z.string(), z.unknown());

const signature = z.object({
  functionName: z.string(),
  parameters: z.array(z.object({ name: z.string(), type: typeIr, description: z.string().optional() })),
  returnType: typeIr,
});

/**
 * Khớp 1-1 `ExerciseContent`. Collection `exercise_contents` bật `additionalProperties: false` ở
 * mọi tầng lồng, nên thừa một trường là Mongo từ chối cả lệnh ghi — và lỗi hiện ra ở Nest dưới
 * dạng 500, chỗ không ai nghĩ tới. Schema này vừa dạy model đúng hình dạng, vừa là hàng rào.
 */
const contentSchema = z.object({
  statement: z.string().optional(),
  ioMode: z.enum(["stdin_stdout", "function"]).optional(),
  signature: signature.optional(),
  constraints: z.array(z.string()).optional(),
  hints: z
    .array(z.object({ order: z.number().int(), text: z.string(), xpPenalty: z.number().int().optional() }))
    .optional(),
  examples: z
    .array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() }))
    .optional(),
  testCases: z
    .array(
      z.object({
        order: z.number().int(),
        input: z.string().optional(),
        args: z.array(z.unknown()).optional(),
        expected: z.unknown().optional(),
        visibility: z.enum(["public", "hidden"]),
        generated: z.boolean().optional(),
        weight: z.number().int().optional(),
      }),
    )
    .optional(),
  languages: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        monaco: z.string().optional(),
        starterCode: z.string().optional(),
        referenceSolution: z.string().optional(),
      }),
    )
    .optional(),
  evaluation: z
    .object({
      checker: z.enum(["exact", "trimmed", "float", "custom", "unordered"]).optional(),
      floatTolerance: z.number().optional(),
      customCheckerCode: z.string().optional(),
      stopOnFirstFailure: z.boolean().optional(),
    })
    .optional(),
});

export function LecterHumanInTheLoop() {
  useHumanInTheLoop(
    {
      name: "create_exercise",
      description:
        "Tạo một bài code MỚI ở trạng thái nháp. Chỉ tạo vỏ (tiêu đề, độ khó, tóm tắt); đề bài, " +
        "test case và lời giải mẫu lưu sau bằng save_exercise_content. Người dùng phải xác nhận.",
      parameters: z.object({
        title: z.string().max(200).describe("Tiêu đề bài, tối đa 200 ký tự."),
        difficulty,
        summary: z.string().max(500).optional().describe("Tóm tắt MỘT câu, tối đa 500 ký tự. Dài hơn là backend từ chối."),
        slug: z.string().max(80).optional().describe("Bỏ trống thì hệ thống tự sinh từ tiêu đề."),
      }),
      render: ({ status, args, respond }) => {
        if (status === "inProgress") return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        return (
          <ProposalCard
            title={`Tạo bài nháp: ${args.title}`}
            lines={[
              `Độ khó: ${args.difficulty}`,
              args.summary ? `Tóm tắt: ${args.summary}` : "Chưa có tóm tắt",
              args.slug ? `Slug: ${args.slug}` : "Slug: hệ thống tự sinh",
            ]}
            confirmLabel="Tạo bài nháp"
            onConfirm={async () => {
              const created = await api.exercises.create({
                title: args.title,
                kind: "code",
                difficulty: args.difficulty,
                summary: args.summary ?? null,
              });
              await respond?.(
                `Đã tạo bài nháp id=${created.id} slug=${created.slug}. Dùng id này cho các bước sau.`,
              );
              return "Đã tạo bài nháp";
            }}
            onFailure={(reason) =>
              respond?.(`Áp dụng thất bại, KHÔNG tạo được bài: ${reason}. Sửa rồi đề xuất lại.`)
            }
            onReject={() => respond?.("Người dùng bỏ qua đề xuất tạo bài.")}
          />
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "update_exercise_meta",
      description:
        "Sửa thông tin chung của một bài code đã có (tiêu đề, tóm tắt, độ khó, thời gian, bộ nhớ, " +
        "chủ đề). Trường nào không gửi thì giữ nguyên. tagIds phải là id có thật lấy từ list_topics.",
      parameters: z.object({
        id: z.string(),
        title: z.string().max(200).optional(),
        summary: z.string().max(500).optional(),
        difficulty: difficulty.optional(),
        estimatedMinutes: z.number().int().optional(),
        timeLimitMs: z.number().int().optional(),
        memoryLimitKb: z.number().int().optional(),
        tagIds: z.array(z.string()).optional(),
      }),
      render: ({ status, args, respond }) => {
        if (status === "inProgress") return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        const { id, ...changes } = args;
        return (
          <ProposalCard
            title="Sửa thông tin bài"
            exerciseId={id}
            lines={Object.entries(changes)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)}
            confirmLabel="Lưu thay đổi"
            onConfirm={async () => {
              await api.exercises.update(id, changes as Record<string, unknown>);
              await respond?.("Đã lưu thông tin chung.");
              return "Đã lưu";
            }}
            onFailure={(reason) =>
              respond?.(`Áp dụng thất bại, thông tin chưa đổi: ${reason}. Sửa rồi đề xuất lại.`)
            }
            onReject={() => respond?.("Người dùng bỏ qua đề xuất sửa thông tin.")}
          />
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "save_exercise_content",
      description:
        "Lưu đề bài, test case, lời giải mẫu và cấu hình chấm của một bài code. Chỉ gọi SAU KHI đã " +
        "chạy run_solution và validate_exercise_content trả về HỢP LỆ. Mọi language phải có " +
        "referenceSolution; cần ít nhất 3 test case và ít nhất một case visibility='public'.",
      parameters: z.object({ id: z.string(), content: contentSchema }),
      render: ({ status, args, respond }) => {
        if (status === "inProgress") return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề bài…</p>;
        const content = args.content as ExerciseContent;
        const cases = content.testCases ?? [];
        return (
          <ProposalCard
            title="Lưu đề bài và test case"
            exerciseId={args.id}
            lines={[
              `Chế độ: ${content.ioMode ?? "stdin_stdout"}`,
              `${cases.length} test case (${cases.filter((c) => c.visibility === "public").length} công khai)`,
              `Ngôn ngữ: ${(content.languages ?? []).map((l) => l.id).join(", ") || "chưa có"}`,
              `Chấm: ${content.evaluation?.checker ?? "exact"}`,
            ]}
            confirmLabel="Lưu nội dung"
            onConfirm={async () => {
              await api.exercises.saveContent(args.id, content);
              await respond?.("Đã lưu nội dung bài. Người dùng tự gửi duyệt khi thấy ổn.");
              return "Đã lưu nội dung";
            }}
            onFailure={(reason) =>
              respond?.(
                `Áp dụng thất bại, nội dung CHƯA lưu: ${reason}. Sửa nội dung, kiểm lại bằng ` +
                  "validate_exercise_content, rồi đề xuất lại.",
              )
            }
            onReject={() => respond?.("Người dùng bỏ qua đề xuất lưu nội dung.")}
          >
            {content.statement && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">Xem đề bài</summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-2.5 text-xs">
                  {content.statement}
                </pre>
              </details>
            )}
          </ProposalCard>
        );
      },
    },
    [],
  );

  return null;
}
