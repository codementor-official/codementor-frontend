"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Braces,
  CheckCheck,
  Cpu,
  MemoryStick,
  Send,
  Timer,
} from "lucide-react";
import { LANGUAGES, VERDICT_LABELS } from "@codementor/solve";
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
import { DailyBarCard } from "@/features/shared/daily-bar-card";
import { KpiStrip, useSummary } from "@/features/shared/kpi-strip";
import { judgeApi, type JudgeConfig, type SubmissionStats } from "@/lib/api";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((language) => [language.id, language.label]),
);

// `pending` là trạng thái của bài nộp, không phải verdict của judge, nên không có trong
// `VERDICT_LABELS` của gói solve.
const verdictLabel = (verdict: string) =>
  verdict === "pending" ? "Đang chấm" : (VERDICT_LABELS as Record<string, string>)[verdict] ?? verdict;

const percent = (part: number, whole: number) => (whole ? Math.round((part * 100) / whole) : null);

/**
 * Trang Chấm bài: số liệu từ bảng `submissions` (submission-service) và cấu hình đang chạy
 * của judge-service. Hai nguồn nạp riêng — judge sập thì phần số liệu bài nộp vẫn hiện.
 */
export function CodeJudgePage() {
  const request = useAdminApi();
  const [days, setDays] = useState<7 | 30>(7);
  const stats = useSummary(useCallback(() => judgeApi.stats(request, days), [request, days]));
  const config = useSummary(useCallback(() => judgeApi.config(request), [request]));
  const data = stats.data;

  return (
    <div>
      <PageHeader
        action={<RefreshButton onRefresh={() => Promise.all([stats.reload(), config.reload()])} />}
        center={
          <SegmentedTabs
            onChange={(value) => setDays(value === "30" ? 30 : 7)}
            options={RANGES}
            value={String(days)}
          />
        }
        icon={Braces}
        title="Chấm bài"
      />

      <KpiStrip
        loading={stats.loading}
        metrics={[
          { icon: Send, label: "Lượt nộp", value: data?.total ?? null },
          { icon: CheckCheck, label: "Tỉ lệ đạt (%)", value: data ? percent(data.accepted, data.completed) : null },
          { icon: Timer, label: "Thời gian chạy p95 (ms)", value: data?.runtimeMs.p95 ?? null },
          { icon: MemoryStick, label: "Bộ nhớ p95 (KB)", value: data?.memoryKb.p95 ?? null },
          { icon: AlertTriangle, label: "Kẹt ở Đang chấm", value: data?.stuckPending ?? null },
        ]}
      />

      {data && data.stuckPending > 0 && (
        <p
          className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {data.stuckPending} lượt nộp nằm ở &quot;Đang chấm&quot; quá 5 phút. Chấm là đồng bộ, nên
          đây là những lượt judge-service lỗi hoặc không trả lời — chúng sẽ không tự xong.
        </p>
      )}

      {!stats.loading && !data && (
        <Card className="mt-3 px-4 py-8 text-center text-sm text-muted-foreground">
          Không tải được số liệu bài nộp. Bấm Làm mới để thử lại.
        </Card>
      )}

      {data && (
        <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DailyBarCard
            data={data.daily}
            describe={(point) => `${point.total} lượt nộp · ${point.accepted} đạt`}
            title="Lượt nộp theo ngày"
            value="total"
          />
          <VerdictCard stats={data} />
          <LanguageCard stats={data} />
          <JudgeConfigCard config={config.data} loading={config.loading} />
        </div>
      )}
    </div>
  );
}

function VerdictCard({ stats }: { stats: SubmissionStats }) {
  const rows = Object.entries(stats.byVerdict).sort(([, a], [, b]) => b - a);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-sm font-semibold">Kết quả chấm</h2>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lượt nộp.</p>}
        {rows.map(([verdict, count]) => (
          <div key={verdict}>
            <div className="flex justify-between gap-2 text-sm">
              <span>{verdictLabel(verdict)}</span>
              <span className="tabular-nums text-muted-foreground">
                {count} · {percent(count, stats.total)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-3"
                style={{ width: `${percent(count, stats.total) ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LanguageCard({ stats }: { stats: SubmissionStats }) {
  return (
    <Card className="min-w-0 overflow-x-auto">
      <CardHeader>
        <h2 className="text-sm font-semibold">Theo ngôn ngữ</h2>
      </CardHeader>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2 font-medium">Ngôn ngữ</th>
            <th className="px-4 py-2 text-right font-medium">Lượt nộp</th>
            <th className="px-4 py-2 text-right font-medium">Tỉ lệ đạt</th>
            <th className="px-4 py-2 text-right font-medium">Thời gian chạy TB</th>
          </tr>
        </thead>
        <tbody>
          {stats.byLanguage.length === 0 && (
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                Chưa có lượt nộp.
              </td>
            </tr>
          )}
          {stats.byLanguage.map((row) => (
            <tr className="border-b last:border-0" key={row.language}>
              <td className="px-4 py-2">{LANGUAGE_LABELS[row.language] ?? row.language}</td>
              <td className="px-4 py-2 text-right tabular-nums">{row.total}</td>
              <td className="px-4 py-2 text-right tabular-nums">{percent(row.accepted, row.total) ?? "—"}%</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {row.avgRuntimeMs === null ? "—" : `${row.avgRuntimeMs} ms`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function JudgeConfigCard({ config, loading }: { config: JudgeConfig | null; loading: boolean }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Cpu aria-hidden="true" className="size-4" />
          Cấu hình judge-service
          <InfoHint text="Đổi bằng biến môi trường của judge-service (EXECUTION_ENGINE, DOCKER_EXECUTION_CONCURRENCY, MAX_*) rồi restart." />
        </h2>
      </CardHeader>
      <CardContent className="pb-4 text-sm">
        {loading ? (
          <p className="text-muted-foreground">Đang tải…</p>
        ) : !config ? (
          <p className="text-destructive">Không đọc được cấu hình — judge-service có thể đang tắt.</p>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Engine</dt>
              <dd className="font-mono">{config.engine}</dd>
              <dt className="text-muted-foreground">Chạy song song</dt>
              <dd>{config.dockerExecutionConcurrency} container</dd>
              <dt className="text-muted-foreground">Mã nguồn tối đa</dt>
              <dd>{Math.round(config.maxSourceBytes / 1000)} KB</dd>
              <dt className="text-muted-foreground">Test case tối đa</dt>
              <dd>
                {config.maxTestCases} case · {Math.round(config.maxTestCaseBytes / 1000)} KB/case
              </dd>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Ngôn ngữ: {config.languages.map((language) => LANGUAGE_LABELS[language.id] ?? language.id).join(", ")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
