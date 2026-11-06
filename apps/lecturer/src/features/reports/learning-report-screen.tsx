"use client";

import { useCallback, useState } from "react";
import { ChartBarIcon as ChartBar } from "@phosphor-icons/react/ssr";
import { LearningReport, PageHeader, RefreshButton, SegmentedTabs, useSummary } from "@codementor/ui";
import { api } from "@/lib/api";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

/** Báo cáo học tập trên khóa học và lộ trình của chính giảng viên. */
export function LearningReportScreen() {
  const [days, setDays] = useState<7 | 30>(30);
  const report = useSummary(useCallback(() => api.learningReport(days), [days]));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={ChartBar}
        title="Báo cáo học tập"
        description="Ai đang học, ai học dở hay đã ngưng, ai hoàn thành và nhận chứng chỉ — trên khóa học và lộ trình của bạn."
        center={<SegmentedTabs options={RANGES} value={String(days)} onChange={(v) => setDays(v === "7" ? 7 : 30)} />}
        action={<RefreshButton onRefresh={report.reload} />}
      />
      <LearningReport data={report.data} loading={report.loading} />
    </div>
  );
}
