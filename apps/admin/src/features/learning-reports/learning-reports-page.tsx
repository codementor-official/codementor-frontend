"use client";

import { useCallback, useState } from "react";
import { ChartBarIcon as ChartBar } from "@phosphor-icons/react/ssr";
import { LearningReport, PageHeader, RefreshButton, SegmentedTabs, useSummary } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { learningReportsApi } from "@/lib/api";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

/** Báo cáo học tập toàn nền tảng — cùng component và định nghĩa với trang của giảng viên. */
export function LearningReportsPage() {
  const request = useAdminApi();
  const [days, setDays] = useState<7 | 30>(30);
  const report = useSummary(useCallback(() => learningReportsApi.get(request, days), [request, days]));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={ChartBar}
        title="Báo cáo học tập"
        description="Hoàn thành, học dở, ngưng học, chứng chỉ và bỏ qua thứ tự lộ trình trên toàn nền tảng."
        center={<SegmentedTabs options={RANGES} value={String(days)} onChange={(v) => setDays(v === "7" ? 7 : 30)} />}
        action={<RefreshButton onRefresh={report.reload} />}
      />
      <LearningReport data={report.data} loading={report.loading} />
    </div>
  );
}
