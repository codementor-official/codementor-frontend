"use client";

import { useCallback, useState } from "react";
import { ChartBarIcon as ChartBar, FileXlsIcon as FileXls } from "@phosphor-icons/react/ssr";
import { apiErrorMessage } from "@codementor/api-client";
import {
  Button,
  LearningReport,
  PageHeader,
  RefreshButton,
  SegmentedTabs,
  downloadLearningReportXlsx,
  useSummary,
  useToast,
} from "@codementor/ui";
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
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const exportXlsx = async () => {
    if (!report.data) return;
    setExporting(true);
    try {
      await downloadLearningReportXlsx(report.data);
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={ChartBar}
        title="Báo cáo học tập"
        description="Hoàn thành, học dở, ngưng học, chứng chỉ và bỏ qua thứ tự lộ trình trên toàn nền tảng."
        center={<SegmentedTabs options={RANGES} value={String(days)} onChange={(v) => setDays(v === "7" ? 7 : 30)} />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onRefresh={report.reload} />
            <Button type="button" variant="outline" disabled={!report.data || exporting} onClick={() => void exportXlsx()}>
              <FileXls className="size-4" aria-hidden /> {exporting ? "Đang tạo file…" : "Xuất Excel"}
            </Button>
          </div>
        }
      />
      <LearningReport data={report.data} loading={report.loading} />
    </div>
  );
}
