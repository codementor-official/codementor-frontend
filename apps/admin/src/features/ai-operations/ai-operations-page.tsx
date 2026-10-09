"use client";

import { useCallback, useState } from "react";
import { Ban, Bot, Coins, MessagesSquare, Settings2, TriangleAlert, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  InfoHint,
  PageHeader,
  RefreshButton,
  SegmentedTabs,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { DailyBarCard } from "@codementor/ui";
import { KpiStrip, useSummary } from "@codementor/ui";
import { aiApi, type AiAgent, type AiStats } from "@/lib/api";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

const AGENT_LABELS: Record<AiAgent, string> = {
  codey: "Codey · học viên giải bài",
  lecter: "Lecter · giảng viên",
  lecter_workspace: "Lecter · nhóm học",
  tutor: "Trợ lý AI · tài liệu nhóm",
  rag: "Chatbot tài liệu (bản cũ, trước AG-UI)",
  rag_index: "Xử lý tài liệu (embedding)",
  suggest: "Gợi ý test case",
  dashboard: "Gợi ý dashboard",
};

const numberFormat = new Intl.NumberFormat("vi-VN");
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const format = (value: number | null) => (value === null ? "—" : numberFormat.format(value));
const sum = (rows: AiStats["agents"], pick: (row: AiStats["agents"][number]) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

/**
 * Trang Vận hành AI: mức dùng, token, độ trễ và lỗi của từng bề mặt AI, đọc từ
 * `ai_call_events` của ai-service. Số liệu chỉ có từ lúc telemetry được deploy.
 */
export function AiOperationsPage() {
  const request = useAdminApi();
  const [days, setDays] = useState<7 | 30>(7);
  const stats = useSummary(useCallback(() => aiApi.stats(request, days), [request, days]));
  const data = stats.data;
  const agents = data?.agents ?? [];

  return (
    <div>
      <PageHeader
        action={<RefreshButton onRefresh={stats.reload} />}
        center={
          <SegmentedTabs
            onChange={(value) => setDays(value === "30" ? 30 : 7)}
            options={RANGES}
            value={String(days)}
          />
        }
        icon={Bot}
        title="Vận hành AI"
      />

      <KpiStrip
        loading={stats.loading}
        metrics={[
          { icon: Zap, label: "Lời gọi model", value: data ? sum(agents, (row) => row.calls) : null },
          {
            icon: Coins,
            label: "Token (vào + ra)",
            value: data ? sum(agents, (row) => row.inputTokens + row.outputTokens) : null,
          },
          { icon: TriangleAlert, label: "Lỗi", value: data ? sum(agents, (row) => row.errors) : null },
          { icon: Ban, label: "Chạm hạn mức ngày", value: data ? sum(agents, (row) => row.limitHits) : null },
          {
            icon: MessagesSquare,
            label: "Hội thoại mới",
            value: data ? sum(agents, (row) => row.conversations ?? 0) : null,
          },
        ]}
      />

      {!stats.loading && !data && (
        <Card className="mt-3 px-4 py-8 text-center text-sm text-muted-foreground">
          Không tải được số liệu AI. Bấm Làm mới để thử lại.
        </Card>
      )}

      {data && (
        <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DailyBarCard
            data={data.daily}
            describe={(point) =>
              `${numberFormat.format(point.tokens)} token · ${point.calls} lời gọi · ${point.errors} lỗi`
            }
            title="Token theo ngày"
            value="tokens"
          />
          <AiConfigCard config={data.config} />
          <div className="xl:col-span-2">
            <AgentsCard agents={agents} />
          </div>
          <div className="xl:col-span-2">
            <ErrorsCard errors={data.recentErrors} />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentsCard({ agents }: { agents: AiStats["agents"] }) {
  const headers = ["Lời gọi", "Lỗi", "Token vào", "Token ra", "Độ trễ p50 / p95", "Người dùng", "Hội thoại", "Chạm hạn mức"];
  return (
    <Card className="min-w-0 overflow-x-auto">
      <CardHeader>
        <h2 className="text-sm font-semibold">Theo từng AI</h2>
      </CardHeader>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2 font-medium">Bề mặt</th>
            {headers.map((header) => (
              <th className="px-4 py-2 text-right font-medium whitespace-nowrap" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((row) => (
            <tr className="border-b last:border-0" key={row.agent}>
              <td className="px-4 py-2 whitespace-nowrap">{AGENT_LABELS[row.agent] ?? row.agent}</td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.calls)}</td>
              <td className={`px-4 py-2 text-right tabular-nums ${row.errors ? "font-medium text-destructive" : ""}`}>
                {format(row.errors)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.inputTokens)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.outputTokens)}</td>
              <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">
                {row.p50LatencyMs === null ? "—" : `${format(row.p50LatencyMs)} / ${format(row.p95LatencyMs)} ms`}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.users)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.conversations)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{format(row.limitHits)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ErrorsCard({ errors }: { errors: AiStats["recentErrors"] }) {
  return (
    <Card className="min-w-0 overflow-x-auto">
      <CardHeader>
        <h2 className="text-sm font-semibold">Lỗi gần nhất</h2>
      </CardHeader>
      {errors.length === 0 ? (
        <CardContent className="pb-4 text-sm text-muted-foreground">Không có lỗi trong khoảng này.</CardContent>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">Lúc</th>
              <th className="px-4 py-2 font-medium">Bề mặt</th>
              <th className="px-4 py-2 font-medium">Model</th>
              <th className="px-4 py-2 font-medium">Lỗi</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((row, index) => (
              <tr className="border-b last:border-0" key={`${row.at}-${index}`}>
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                  {dateTime.format(new Date(row.at))}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{AGENT_LABELS[row.agent] ?? row.agent}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.model ?? "—"}</td>
                <td className="px-4 py-2">
                  {row.errorType === "run_failed" ? "Lượt chạy agent hỏng giữa chừng" : (row.errorMessage ?? row.errorType)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function AiConfigCard({ config }: { config: AiStats["config"] }) {
  const limits = Object.entries(config.dailyLimits) as [AiAgent, number][];
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Settings2 aria-hidden="true" className="size-4" />
          Cấu hình ai-service
          <InfoHint text="Đổi bằng biến môi trường của ai-service (OPENAI_CHAT_MODEL, AI_MODEL_SMART, OPENAI_EMBEDDING_MODEL, AI_*_DAILY_LIMIT) rồi restart." />
        </h2>
      </CardHeader>
      <CardContent className="pb-4 text-sm">
        {!config.configured && (
          <p className="mb-3 text-destructive">Chưa có OPENAI_API_KEY — mọi tính năng AI đang tắt.</p>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Model thường</dt>
          <dd className="font-mono text-xs leading-5">{config.chatModel}</dd>
          <dt className="text-muted-foreground">Model suy luận</dt>
          <dd className="font-mono text-xs leading-5">{config.smartModel}</dd>
          <dt className="text-muted-foreground">Embedding</dt>
          <dd className="font-mono text-xs leading-5">{config.embeddingModel}</dd>
          <dt className="text-muted-foreground">Codey reasoning</dt>
          <dd className="font-mono text-xs leading-5">{config.codeyReasoningEffort}</dd>
        </dl>
        <p className="mt-4 mb-1.5 text-xs font-medium text-muted-foreground">Hạn mức mỗi người / ngày</p>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          {limits.map(([agent, limit]) => (
            <div className="contents" key={agent}>
              <dt className="truncate">{AGENT_LABELS[agent] ?? agent}</dt>
              <dd className="text-right tabular-nums">{limit}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
