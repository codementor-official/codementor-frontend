"use client";

import type { ReactNode } from "react";
import {
  Check,
  FileText,
  ListChecks,
  Loader2,
  Play,
  Search,
  Sparkles,
  Tags,
  TriangleAlert,
} from "lucide-react";
import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

/**
 * Tool call hiện thành một dòng có nhãn tiếng Việt, không phải một khoảng trắng.
 *
 * Không đăng ký renderer thì CopilotKit vẽ tool call thành RỖNG: người soạn thấy Lecter im lặng
 * ba mươi giây rồi đột nhiên trả lời, và không có cách nào biết nó vừa chạy thử lời giải hay
 * vừa bỏ cuộc. Đây là nửa còn lại của "thấy agent đang làm gì".
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
    <div className="my-1.5 flex items-start gap-2.5 rounded-md border border-border-soft bg-surface px-3 py-2 text-sm">
      <span className="mt-0.5 shrink-0 text-text-muted">
        {done ? (
          failed ? (
            <TriangleAlert aria-hidden="true" className="size-4 text-danger" />
          ) : (
            <Check aria-hidden="true" className="size-4 text-primary" />
          )
        ) : (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium text-navy">
          {icon}
          {label}
        </span>
        {detail && (
          <span className="mt-0.5 block whitespace-pre-wrap break-words text-xs text-text-muted">
            {detail}
          </span>
        )}
      </span>
    </div>
  );
}

/** Dòng đầu của kết quả đủ để biết pass hay fail; phần còn lại là chi tiết cho model. */
function firstLine(result: string | undefined, max = 160): string | undefined {
  const line = result?.split("\n")[0]?.trim();
  if (!line) return undefined;
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

/** Đăng ký renderer cho tám tool server của bề mặt nhóm học. Gọi một lần trong CopilotKitProvider. */
export function LecterToolRenderers() {
  useRenderTool(
    {
      name: "search_workspace_exercises",
      parameters: z.object({ query: z.string().optional() }),
      render: ({ status, parameters, result }) => (
        <ToolRow
          icon={<Search aria-hidden="true" className="size-3.5" />}
          label={`Tìm bài trong nhóm: “${parameters?.query ?? ""}”`}
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "read_workspace_exercise",
      parameters: z.object({ exercise_id: z.string().optional() }),
      render: ({ status }) => (
        <ToolRow
          icon={<Search aria-hidden="true" className="size-3.5" />}
          label="Đọc một bài của nhóm"
          status={status}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "read_workspace_document",
      parameters: z.object({ document_id: z.string().optional() }),
      render: ({ status, result }) => (
        <ToolRow
          icon={<FileText aria-hidden="true" className="size-3.5" />}
          label="Đọc tài liệu đính kèm"
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "search_workspace_document",
      parameters: z.object({ query: z.string().optional() }),
      render: ({ status, parameters }) => (
        <ToolRow
          icon={<FileText aria-hidden="true" className="size-3.5" />}
          label={`Tìm trong tài liệu: “${parameters?.query ?? ""}”`}
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
          label="Kiểm nội dung trước khi đưa vào form"
          status={status}
          detail={status === "complete" ? firstLine(result) : undefined}
          failed={Boolean(result?.startsWith("CHƯA LƯU ĐƯỢC"))}
        />
      ),
    },
    [],
  );

  return null;
}
