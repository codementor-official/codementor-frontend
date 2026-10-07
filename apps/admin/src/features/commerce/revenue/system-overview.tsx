import type { RevenueInstructor, RevenueReport } from "@codementor/types";
import { COMMERCE_STATUS } from "@codementor/types";
import {
  Button,
  RevenueBreakdownChart,
  RevenueTrendChart,
  type RevenueMetric,
} from "@codementor/ui";
import { ArrowRight } from "lucide-react";

export function SystemRevenueOverview({
  report,
  instructors,
  selectedName,
  metric,
  onMetricChange,
  onNavigate,
  onCourseSelect,
  onInstructorSelect,
}: {
  report: RevenueReport;
  instructors: RevenueInstructor[];
  selectedName?: string;
  metric: RevenueMetric;
  onMetricChange: (metric: RevenueMetric) => void;
  onNavigate: (view: string) => void;
  onCourseSelect: (id: string) => void;
  onInstructorSelect: (id: string) => void;
}) {
  const lecturerShare = instructors.reduce((sum, i) => sum + i.revenue, 0);
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">
          {selectedName
            ? `Hoạt động kinh doanh · ${selectedName}`
            : "Hoạt động kinh doanh toàn hệ thống"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Theo dõi tiền thanh toán, nguồn đóng góp và tình trạng đơn trong cùng
          phạm vi đã chọn.
        </p>
      </div>
      <RevenueTrendChart
        report={report}
        metric={metric}
        onMetricChange={onMetricChange}
        compareGross
      />
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <RevenueBreakdownChart
          title="Tiền được phân bổ cho ai?"
          description="Phần được hưởng từ đơn đã thanh toán, trước phí; không gồm đơn đã hoàn"
          data={[
            {
              id: "lecturers",
              label: "Giảng viên",
              value: lecturerShare,
              color: "var(--chart-4)",
            },
            {
              id: "platform",
              label: "CodeMentor",
              value: report.totals.revenue,
              color: "var(--chart-3)",
            },
          ]}
        />
        <RevenueBreakdownChart
          title="Khóa học đóng góp cho CodeMentor"
          description="Xếp hạng theo phần hệ thống được hưởng, không phải toàn bộ tiền học viên trả"
          variant="ranking"
          data={report.courses.map((c) => ({
            id: c.id,
            label: c.title,
            value: c.revenue,
          }))}
          onSelect={onCourseSelect}
        />
      </div>
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <RevenueBreakdownChart
          title="Hoạt động bán hàng của giảng viên"
          description="Số đơn đã thanh toán / hoàn tiền; chọn giảng viên để thu hẹp toàn bộ báo cáo"
          variant="ranking"
          unit="đơn"
          data={instructors.map((i) => ({
            id: i.id,
            label: i.name,
            value: i.orders,
          }))}
          onSelect={onInstructorSelect}
        />
        <RevenueBreakdownChart
          title={
            selectedName
              ? "Tình trạng đơn của giảng viên"
              : "Tình trạng đơn toàn hệ thống"
          }
          description="Đếm đơn theo trạng thái, không phải phân bổ tiền. Đơn chưa thanh toán tính theo ngày tạo"
          unit="đơn"
          data={Object.entries(report.statuses).map(([id, value]) => ({
            id,
            label: COMMERCE_STATUS[id] ?? id,
            value,
          }))}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Đi sâu vào từng giảng viên hoặc xem số dư sổ cái toàn thời gian. Số dư
          khả dụng không phải phần thu trong kỳ.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onNavigate("instructors")}>
            So sánh giảng viên <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => onNavigate("balances")}>
            Số dư & khả năng rút
          </Button>
        </div>
      </div>
    </div>
  );
}
