"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Loader2, X } from "lucide-react";
import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { messageOf } from "../exercise-authoring";
import { useLecterContext } from "./context";
import { changedFields, patchEntries, type PatchEntry } from "./patch";
import type { LecterContentCheck, LecterDraftPatch } from "./types";

/**
 * Tool GHI duy nhất của Lecter phía học viên — và nó không ghi vào hệ thống.
 *
 * Nó đổ nội dung vào BIỂU MẪU soạn bài đang mở, rồi dừng. Người soạn tự bấm "Lưu bài tập" ở
 * studio như mọi lần. Vì sao không cho Lecter gọi thẳng API nhóm: `POST /workspaces/:slug/exercises`
 * tạo bài rồi đặt luôn `status = published`, gắn vào nhóm và bắn thông báo cho thành viên được
 * giao — nhóm học không có trạng thái nháp. Một lời gọi tool sai ở đó không tạo ra bản nháp, nó
 * tạo ra một bài tập cả nhóm nhìn thấy. Trong khi biểu mẫu ngay sau lưng drawer đã LÀ vùng nháp.
 *
 * Không có `create`, `save`, `delete`, `publish`, `assign` ở đây — không phải vì prompt cấm, mà
 * vì chúng không tồn tại trong danh sách tool.
 */

const typeIr = z.record(z.string(), z.unknown());

const signature = z.object({
  functionName: z.string(),
  parameters: z.array(
    z.object({ name: z.string(), type: typeIr, description: z.string().optional() }),
  ),
  returnType: typeIr,
});

/**
 * Khớp `ExerciseContent`, mọi trường đều tuỳ chọn: đây là một PATCH. Trường vắng mặt nghĩa là
 * "giữ nguyên thứ người soạn đang có" — xem `patch.ts`.
 */
const contentSchema = z.object({
  statement: z.string().optional(),
  ioMode: z.enum(["stdin_stdout", "function"]).optional(),
  signature: signature.optional(),
  constraints: z.array(z.string()).optional(),
  hints: z
    .array(
      z.object({ order: z.number().int(), text: z.string(), xpPenalty: z.number().int().optional() }),
    )
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

const APPLIED_NOTE =
  "Nội dung đã nằm trong biểu mẫu soạn bài. NGƯỜI SOẠN CHƯA LƯU — họ sẽ tự bấm 'Lưu bài tập' ở " +
  "studio. Đừng nói là đã tạo hay đã lưu bài.";

/** Chạy chính lời giải trong patch qua bộ chấm, nếu patch có lời giải để chạy. */
function useContentCheck(content: Record<string, unknown> | undefined, enabled: boolean) {
  const [check, setCheck] = useState<LecterContentCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    const languages = (content?.languages ?? []) as { referenceSolution?: string }[];
    // Không có lời giải thì không có gì để chạy — patch chỉ sửa đề bài chẳng hạn.
    if (!enabled || asked.current || !languages.some((item) => item.referenceSolution)) return;
    asked.current = true;
    setRunning(true);
    api.lecter
      .checkExerciseContent(content ?? {})
      .then(setCheck)
      .catch((cause) => setError(messageOf(cause, "Không chạy thử được lời giải.")))
      .finally(() => setRunning(false));
  }, [content, enabled]);

  return { check, error, running };
}

/**
 * Nội dung đề xuất, gập lại.
 *
 * Mở sẵn thì một bài đầy đủ (đề bài + 5 test case + hai lời giải mẫu) đẩy hai cái nút xuống
 * dưới màn hình, và người soạn phải cuộn qua thứ họ chưa muốn đọc để tìm chỗ bấm. Gập lại thì
 * mặc định là "tin và bấm", mở ra là "đọc rồi bấm" — cả hai đều nhanh.
 */
function EntryDisclosure({ entry }: { entry: PatchEntry }) {
  return (
    <details className="group border-t border-border-soft py-1.5 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-navy marker:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 text-text-muted transition-transform group-open:rotate-90"
        />
        <span className="font-medium">{entry.label}</span>
        {entry.current !== undefined && (
          <span className="text-2xs text-danger">ghi đè</span>
        )}
      </summary>
      <pre className="mt-1.5 max-h-56 overflow-auto rounded-md bg-bg px-2.5 py-2 text-2xs leading-5 whitespace-pre-wrap break-words text-navy">
        {entry.preview}
      </pre>
      {entry.current !== undefined && (
        <details className="mt-1">
          <summary className="cursor-pointer text-2xs text-text-muted">
            Nội dung bạn đang có
          </summary>
          <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-bg px-2.5 py-2 text-2xs leading-5 whitespace-pre-wrap break-words text-text-muted">
            {entry.current}
          </pre>
        </details>
      )}
    </details>
  );
}

function CheckLine({
  check,
  error,
  running,
}: {
  check: LecterContentCheck | null;
  error: string | null;
  running: boolean;
}) {
  if (running)
    return (
      <p className="flex items-center gap-2 text-xs text-text-muted">
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        Đang chạy thử lời giải qua bộ chấm…
      </p>
    );
  if (error) return <p className="text-xs text-text-muted">{error}</p>;
  if (!check) return null;
  const failed = check.errors.length > 0;
  const runs = check.runs
    .map((run) =>
      run.verdict
        ? `${run.language}: ${run.verdict} ${run.passedTests ?? 0}/${run.totalTests ?? 0}`
        : `${run.language}: ${run.error ?? "không chạy được"}`,
    )
    .join(" · ");
  return (
    <div className={`text-xs ${failed ? "text-danger" : "text-text-muted"}`}>
      <p>{runs || (failed ? "Nội dung còn lỗi" : "Đã kiểm nội dung")}</p>
      {check.errors.map((line) => (
        <p key={line}>• {line}</p>
      ))}
    </div>
  );
}

export function LecterApplyTool() {
  useHumanInTheLoop(
    {
      name: "apply_exercise_draft",
      description:
        "Đưa nội dung bạn vừa soạn vào BIỂU MẪU soạn bài đang mở. KHÔNG lưu vào hệ thống — " +
        "người soạn tự bấm Lưu. Sửa TỪNG PHẦN: chỉ gửi những trường muốn đổi, trường không gửi " +
        "thì giữ nguyên. Mảng (testCases, languages, constraints) thì thay cả mảng, nên khi sửa " +
        "test case phải gửi lại đủ cả case cũ.",
      parameters: z.object({
        title: z.string().max(200).optional(),
        summary: z.string().max(500).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        estimatedMinutes: z.number().int().optional(),
        timeLimitMs: z.number().int().optional(),
        memoryLimitKb: z.number().int().optional(),
        tagIds: z.array(z.string()).optional().describe("Id chủ đề có thật, lấy từ list_topics."),
        content: contentSchema.optional(),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-text-muted">Đang soạn đề xuất…</p>;

        const patch = args as LecterDraftPatch;
        const fields = changedFields(patch);

        // Đã xử lý xong, nạp lại từ lịch sử: KHÔNG vẽ lại nút, nếu không thì mở lại hội thoại cũ
        // là một hàng nút "Đưa vào form" cho những đề xuất đã áp từ hôm trước.
        if (status === "complete") {
          const outcome = ((): string => {
            try {
              return (JSON.parse(String(result ?? "{}")) as { outcome?: string }).outcome ?? "";
            } catch {
              return "";
            }
          })();
          return (
            <div className="my-2 flex items-center gap-2 rounded-lg border border-border-soft bg-surface px-3 py-2 text-xs text-text-muted">
              {outcome === "applied" ? (
                <Check aria-hidden="true" className="size-3.5 text-primary" />
              ) : (
                <X aria-hidden="true" className="size-3.5" />
              )}
              {outcome === "applied"
                ? `Đã đưa vào biểu mẫu: ${fields.join(", ") || "nội dung bài"}`
                : "Người soạn đã bỏ qua đề xuất này"}
            </div>
          );
        }

        return (
          <ApplyCard
            fields={fields}
            patch={patch}
            onApplied={() =>
              void respond?.(JSON.stringify({ outcome: "applied", fields, note: APPLIED_NOTE }))
            }
            onReject={() =>
              void respond?.(
                JSON.stringify({
                  outcome: "rejected",
                  note: "Người soạn bỏ qua đề xuất. Hỏi họ muốn đổi gì trước khi đề xuất lại.",
                }),
              )
            }
          />
        );
      },
    },
    // Deps RỖNG có chủ đích. `useFrontendTool` gỡ rồi đăng ký lại tool mỗi lần mảng này đổi, và
    // bản nháp studio đổi theo TỪNG PHÍM GÕ — đăng ký lại giữa lúc một lượt đang chờ người dùng
    // bấm nút sẽ huỷ chính lời hứa đang giữ lượt đó. Giá trị mới lấy qua context bên trong thẻ.
    [],
  );

  return null;
}

function ApplyCard({
  fields,
  patch,
  onApplied,
  onReject,
}: {
  fields: string[];
  patch: LecterDraftPatch;
  onApplied: () => void;
  onReject: () => void;
}) {
  // Đọc context TRONG thẻ, không đóng gói vào closure lúc đăng ký tool: thẻ này có thể sống qua
  // nhiều lần người soạn sửa form, và một `draft` cũ sẽ báo sai chỗ nào sắp bị ghi đè.
  const { draft, applyPatch, editingSaved } = useLecterContext();
  const entries = patchEntries(draft, patch);
  const clashes = entries.filter((entry) => entry.current !== undefined).map((entry) => entry.label);
  const { check, error, running } = useContentCheck(
    patch.content as Record<string, unknown> | undefined,
    true,
  );

  return (
    <div className="my-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-sm font-semibold text-navy">Đưa vào biểu mẫu soạn bài</p>
      <p className="mt-1 text-xs text-text-muted">
        Thay đổi {entries.length} phần: {fields.join(", ") || "không có gì"}
      </p>
      {editingSaved && (
        <p className="mt-1 text-xs text-text-muted">
          Bài này đã đăng trong nhóm — thay đổi chỉ có hiệu lực sau khi bạn bấm Lưu.
        </p>
      )}

      {entries.length > 0 && (
        <div className="mt-2 rounded-md border border-border-soft px-2.5 py-1">
          {entries.map((entry) => (
            <EntryDisclosure entry={entry} key={entry.key} />
          ))}
        </div>
      )}

      <div className="mt-2 border-t border-border-soft pt-2">
        <CheckLine check={check} error={error} running={running} />
      </div>

      {clashes.length > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Ghi đè nội dung bạn đang có ở: {clashes.join(", ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={running}
          onClick={() => {
            applyPatch(patch);
            onApplied();
          }}
        >
          Đưa vào form
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          Bỏ qua
        </Button>
      </div>
      <p className="mt-2 text-2xs text-text-faint">
        Lecter không lưu bài. Bấm “Lưu bài tập” ở studio khi bạn thấy ổn.
      </p>
    </div>
  );
}
