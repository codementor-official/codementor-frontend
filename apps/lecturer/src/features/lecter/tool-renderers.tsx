"use client";

import type { ReactNode } from "react";
import { Check, ListChecks, Loader2, Play, Search, Sparkles, Tags, TriangleAlert } from "lucide-react";
import { useDefaultRenderTool, useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

/**
 * Toolcall hiện thành một dòng có nhãn tiếng Việt, không phải JSON thô.
 *
 * Đây là nửa còn lại của yêu cầu "thấy agent đang làm gì thay vì xem indicator quay": trạng thái
 * tổng thể nằm ở `StatusBadge` trên đầu khung chat, còn từng bước cụ thể nằm ở đây.
 */
function ToolRow({
  icon,
  label,
  status,
  detail,
  failed,
}: {
  icon: ReactNode;
  label: string;
  status: "inProgress" | "executing" | "complete";
  detail?: string;
  failed?: boolean;
}) {
  const done = status === "complete";
  return (
    <div className="my-1.5 flex items-start gap-2.5 rounded-md border border-border bg-card px-3 py-2 text-sm">
      <span className="mt-0.5 shrink-0 text-muted-foreground">
        {done ? (
          failed ? (
            <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
          ) : (
            <Check aria-hidden="true" className="size-4 text-success" />
          )
        ) : (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        {detail && (
          <span className="mt-0.5 block whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
    </div>
  );
}

/** Dòng đầu của kết quả judge đã đủ để biết pass hay fail; phần còn lại là chi tiết cho model. */
function firstLine(result: string | undefined, max = 160): string | undefined {
  if (!result) return undefined;
  const line = result.split("\n")[0]?.trim();
  if (!line) return undefined;
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

/** Đăng ký renderer cho từng tool phía server. Gọi một lần trong cây con của CopilotKitProvider. */
export function ToolRenderers() {
  useRenderTool(
    {
      name: "search_exercises",
      parameters: z.object({ query: z.string() }),
      render: ({ status, parameters, result }) => (
        <ToolRow
          icon={<Search aria-hidden="true" className="size-3.5" />}
          label={`Tìm bài đã có: “${parameters?.query ?? ""}”`}
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "read_exercise",
      parameters: z.object({ exercise_id: z.string() }),
      render: ({ status }) => (
        <ToolRow
          icon={<Search aria-hidden="true" className="size-3.5" />}
          label="Đọc chi tiết một bài"
          status={status}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "list_topics",
      parameters: z.object({}),
      render: ({ status }) => (
        <ToolRow
          icon={<Tags aria-hidden="true" className="size-3.5" />}
          label="Lấy danh sách chủ đề"
          status={status}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "generate_starter",
      parameters: z.object({ languages: z.array(z.string()).optional() }),
      render: ({ status, parameters }) => (
        <ToolRow
          icon={<Sparkles aria-hidden="true" className="size-3.5" />}
          label={`Sinh mã khởi tạo${parameters?.languages?.length ? ` (${parameters.languages.join(", ")})` : ""}`}
          status={status}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "run_solution",
      parameters: z.object({ language: z.string().optional() }),
      render: ({ status, parameters, result }) => (
        <ToolRow
          icon={<Play aria-hidden="true" className="size-3.5" />}
          label={`Chạy thử lời giải${parameters?.language ? ` bằng ${parameters.language}` : ""}`}
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
          failed={Boolean(result && !result.startsWith("verdict=accepted"))}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "validate_exercise_content",
      parameters: z.object({}),
      render: ({ status, result }) => (
        <ToolRow
          icon={<ListChecks aria-hidden="true" className="size-3.5" />}
          label="Kiểm nội dung trước khi lưu"
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
          failed={Boolean(result?.startsWith("CHƯA LƯU ĐƯỢC"))}
        />
      ),
    },
    [],
  );

  // Tool nào chưa có renderer riêng vẫn hiện được, thay vì biến mất khỏi hội thoại.
  useDefaultRenderTool();
  return null;
}

export { ToolRow };
