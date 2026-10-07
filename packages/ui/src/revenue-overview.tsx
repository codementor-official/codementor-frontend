"use client";
import { useState, type ReactNode } from "react";
import type { RevenueReport } from "@codementor/types";
import { COMMERCE_STATUS } from "@codementor/types";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";
import { RevenueSummary } from "./revenue/revenue-summary";
import { RevenueTrendChart } from "./revenue/revenue-trend-chart";
import { RevenueBreakdownChart } from "./revenue/revenue-breakdown-chart";
import {
  RevenueCourseTable,
  RevenueDetailTable,
} from "./revenue/revenue-detail-table";
import {
  revenueDate,
  revenueMoney,
  type RevenueMetric,
} from "./revenue/format";

export interface RevenueExtraView {
  id: string;
  label: string;
  content: ReactNode;
}

/** Callers own fetching and authorization; this surface never mutates financial records. */
export function RevenueOverview({
  report,
  days,
  onDaysChange,
  onExport,
  loading,
  scopeControl,
  extraViews = [],
  onResetScope,
  summaryContent,
  renderOverview,
}: {
  report: RevenueReport | null;
  days: number;
  onDaysChange: (days: number) => void;
  onExport: () => void;
  loading: boolean;
  scopeControl?: ReactNode;
  extraViews?: RevenueExtraView[];
  onResetScope?: () => void;
  summaryContent?: ReactNode;
  renderOverview?: (context: {
    report: RevenueReport;
    metric: RevenueMetric;
    onMetricChange: (metric: RevenueMetric) => void;
    onNavigate: (view: string) => void;
    onCourseSelect: (id: string) => void;
  }) => ReactNode;
}) {
  const [metric, setMetric] = useState<RevenueMetric>("revenue");
  const [view, setView] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseMetric, setCourseMetric] = useState<
    "revenue" | "gross" | "orders"
  >("revenue");
  const course = report?.courses.find((c) => c.id === selectedCourse);
  const share =
    report?.scope === "admin" ? "Phần CodeMentor" : "Doanh thu của bạn";
  const courseLabels = {
    revenue: share,
    gross: "Tiền học viên thanh toán",
    orders: "Số đơn",
  };
  const extra = extraViews.find((v) => v.id === view);
  const reset = () => {
    setMetric("revenue");
    setCourseMetric("revenue");
    setView("overview");
    setSelectedCourse("");
    onDaysChange(30);
    onResetScope?.();
  };
  return (
    <section
      className="min-w-0 space-y-5"
      aria-label="Tổng quan doanh thu"
      aria-busy={loading}
    >
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          {scopeControl}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Khoảng thời gian
            <select
              aria-label="Khoảng thời gian báo cáo"
              className="rounded-md border bg-background px-3 py-2 font-normal"
              value={days}
              onChange={(e) => {
                setSelectedCourse("");
                onDaysChange(Number(e.target.value));
              }}
            >
              <option value={7}>7 ngày gần nhất</option>
              <option value={30}>30 ngày gần nhất</option>
              <option value={90}>90 ngày gần nhất</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Góc nhìn
            <select
              aria-label="Góc nhìn báo cáo"
              className="rounded-md border bg-background px-3 py-2 font-normal"
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option value="overview">
                {renderOverview ? "Tổng quan hệ thống" : "Xu hướng doanh thu"}
              </option>
              <option value="courses">Hiệu quả khóa học</option>
              {extraViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
              <option value="statuses">Trạng thái đơn hàng</option>
              <option value="details">Số liệu chi tiết</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Đặt lại
            </Button>
            <Button
              variant="outline"
              disabled={loading || !report}
              onClick={onExport}
            >
              <Download className="size-4" />
              Xuất báo cáo CSV
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {report && !loading
            ? `${revenueDate(report.from)} – ${revenueDate(report.to)} · Giờ Việt Nam`
            : "Đang tải kỳ báo cáo…"}
        </p>
      </div>
      {loading ? (
        <div
          role="status"
          className="flex h-80 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground"
        >
          Đang tổng hợp báo cáo…
        </div>
      ) : !report ? (
        <p className="rounded-lg border p-5 text-sm text-muted-foreground">
          Chưa tải được báo cáo. Bấm Làm mới để thử lại.
        </p>
      ) : (
        <>
          {summaryContent ?? <RevenueSummary report={report} />}
          {view === "overview" &&
            (renderOverview ? (
              renderOverview({
                report,
                metric,
                onMetricChange: setMetric,
                onNavigate: setView,
                onCourseSelect: setSelectedCourse,
              })
            ) : (
              <>
                <RevenueTrendChart
                  report={report}
                  metric={metric}
                  onMetricChange={setMetric}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Muốn biết khóa học hoặc giảng viên nào đóng góp nhiều nhất?
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setView(
                        extraViews.some((v) => v.id === "instructors")
                          ? "instructors"
                          : "courses",
                      )
                    }
                  >
                    Xem phân bổ doanh thu
                  </Button>
                </div>
              </>
            ))}
          {view === "courses" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Hiệu quả khóa học</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    So sánh và xem tỷ trọng trong cùng kỳ báo cáo.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  Đo theo
                  <select
                    aria-label="Chỉ số khóa học"
                    className="rounded-md border bg-background px-3 py-2"
                    value={courseMetric}
                    onChange={(e) =>
                      setCourseMetric(e.target.value as typeof courseMetric)
                    }
                  >
                    {Object.entries(courseLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
                <RevenueBreakdownChart
                  title="Khóa học dẫn đầu"
                  description={courseLabels[courseMetric]}
                  data={report.courses.map((c) => ({
                    id: c.id,
                    label: c.title,
                    value: c[courseMetric],
                  }))}
                  unit={courseMetric === "orders" ? "đơn" : "VNĐ"}
                  variant="ranking"
                  onSelect={setSelectedCourse}
                />
                <RevenueBreakdownChart
                  title="Tỷ trọng theo khóa học"
                  description={courseLabels[courseMetric]}
                  data={report.courses.map((c) => ({
                    id: c.id,
                    label: c.title,
                    value: c[courseMetric],
                  }))}
                  unit={courseMetric === "orders" ? "đơn" : "VNĐ"}
                  onSelect={setSelectedCourse}
                />
              </div>
              <details>
                <summary className="w-fit cursor-pointer py-2 text-sm font-medium">
                  Mở bảng chi tiết {report.courses.length} khóa học
                </summary>
                <RevenueCourseTable
                  report={report}
                  onSelect={setSelectedCourse}
                />
              </details>
            </>
          )}
          {view === "statuses" && (
            <>
              <RevenueBreakdownChart
                title="Trạng thái đơn hàng trong kỳ"
                description="Phân bổ số đơn, không phải tỷ trọng doanh thu"
                data={Object.entries(report.statuses).map(([id, value]) => ({
                  id,
                  label: COMMERCE_STATUS[id] ?? id,
                  value,
                }))}
                unit="đơn"
              />
              <p className="text-sm text-muted-foreground">
                Đơn chưa thanh toán tính theo ngày tạo; đơn đã thanh toán tính
                theo ngày xác nhận. Đơn chờ, lỗi hoặc hủy không cộng vào doanh
                thu.
              </p>
            </>
          )}
          {view === "details" && <RevenueDetailTable report={report} />}
          {extra?.content}
          <Modal
            open={!!course}
            onClose={() => setSelectedCourse("")}
            title="Hiệu quả khóa học"
          >
            {course && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {revenueDate(report.from)} – {revenueDate(report.to)} · Cùng
                    phạm vi báo cáo
                  </p>
                </div>
                <dl className="space-y-3 text-sm">
                  {[
                    [
                      "Số đơn đã thanh toán / hoàn tiền",
                      course.orders.toLocaleString("vi-VN"),
                    ],
                    ["Giá trị đơn thanh toán", revenueMoney(course.gross)],
                    [share, revenueMoney(course.revenue)],
                    [
                      "Tỷ trọng phần thu",
                      `${(report.totals.revenue ? (course.revenue * 100) / report.totals.revenue : 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-2 border-b pb-3"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm text-muted-foreground">
                  Phần thu đã loại trừ đơn hoàn tiền, chưa trừ phí cổng thanh
                  toán. Giá trị đơn không phải giá niêm yết hiện tại.
                </p>
              </div>
            )}
          </Modal>
        </>
      )}
    </section>
  );
}
