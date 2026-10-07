"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiErrorMessage } from "@codementor/api-client";
import type {
  RevenueDateRange,
  RevenueInstructor,
  RevenueReport,
} from "@codementor/types";
import { Button, Modal, PageHeader, RevenueOverview } from "@codementor/ui";
import { ChartNoAxesCombined, CircleHelp, RefreshCw } from "lucide-react";
import { downloadCsv, printDocument } from "@codementor/utils";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi as api, vnd } from "./api";
import { InstructorSelector } from "./revenue/instructor-selector";
import {
  InstructorPerformance,
  type InstructorRevenueMetric,
} from "./revenue/instructor-performance";
import { RevenueBalances } from "./revenue/revenue-balances";
import { SystemRevenueSummary } from "./revenue/system-summary";
import { SystemRevenueOverview } from "./revenue/system-overview";

export function RevenueScreen() {
  const request = useAdminApi();
  const [days, setDays] = useState(30);
  const [dateRange, setDateRange] = useState<RevenueDateRange | null>(null);
  const [instructorId, setInstructorId] = useState("");
  const [instructorMetric, setInstructorMetric] =
    useState<InstructorRevenueMetric>("revenue");
  const [instructors, setInstructors] = useState<RevenueInstructor[]>([]);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [help, setHelp] = useState(false);
  const [loadedScope, setLoadedScope] = useState("");
  const scopeKey = `${days}-${instructorId}-${refresh}-${dateRange?.from ?? ""}-${dateRange?.to ?? ""}`;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReport(null);
    setError("");
    Promise.all([
      api.analytics(request, days, instructorId, dateRange),
      api.revenueInstructors(request, days, dateRange),
    ])
      .then(([nextReport, nextInstructors]) => {
        if (active) {
          setReport(nextReport);
          setInstructors(nextInstructors);
        }
      })
      .catch((e) => {
        if (active) setError(apiErrorMessage(e));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadedScope(scopeKey);
        }
      });
    return () => {
      active = false;
    };
  }, [request, days, instructorId, refresh, dateRange, scopeKey]);
  const selected = instructors.find((i) => i.id === instructorId);
  const scopedInstructors = instructorId
    ? instructors.filter((i) => i.id === instructorId)
    : instructors;
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        icon={ChartNoAxesCombined}
        title="Doanh thu hệ thống"
        description="Quản lý doanh số toàn nền tảng, phần phân bổ cho CodeMentor và hiệu quả từng giảng viên."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setHelp(true)}>
              <CircleHelp className="size-4" />
              Hướng dẫn
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </div>
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <RevenueOverview
        report={report}
        days={days}
        onDaysChange={setDays}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        loading={loading || loadedScope !== scopeKey}
        summaryContent={
          report && (
            <SystemRevenueSummary
              report={report}
              instructors={scopedInstructors}
            />
          )
        }
        renderOverview={(context) => (
          <SystemRevenueOverview
            {...context}
            instructors={scopedInstructors}
            selectedName={selected?.name}
            onInstructorSelect={setInstructorId}
          />
        )}
        scopeControl={
          <InstructorSelector
            instructors={instructors}
            value={instructorId}
            onChange={setInstructorId}
          />
        }
        onResetScope={() => {
          setInstructorId("");
          setInstructorMetric("revenue");
        }}
        extraViews={[
          {
            id: "instructors",
            label: "Hiệu quả giảng viên",
            content: (
              <InstructorPerformance
                key={`${days}-${instructorId}-${dateRange?.from}-${dateRange?.to}`}
                instructors={instructors}
                selectedId={instructorId}
                onSelect={setInstructorId}
                metric={instructorMetric}
                onMetricChange={setInstructorMetric}
              />
            ),
          },
          {
            id: "balances",
            label: "Số dư & khả năng rút",
            content: (
              <RevenueBalances
                instructors={instructors}
                selectedId={instructorId}
              />
            ),
          },
        ]}
        onExport={() =>
          report &&
          downloadCsv(
            "bao-cao-doanh-thu-he-thong.csv",
            [
              "Phạm vi",
              "Ngày",
              "Số đơn",
              "Tiền học viên thanh toán",
              "Phần CodeMentor trước phí",
              "Hoàn tiền",
            ],
            report.daily.map((d) => [
              selected?.email ?? "Toàn hệ thống",
              d.date,
              d.orders,
              d.gross,
              d.revenue,
              d.refunded,
            ]),
          )
        }
      />
      <Link
        href="/commerce"
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        Quản lý giao dịch, đối soát & duyệt rút tiền →
      </Link>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="Hướng dẫn báo cáo doanh thu"
      >
        <div className="space-y-4 text-sm leading-6">
          <p>
            <strong>1. Chọn phạm vi:</strong> tìm giảng viên theo tên/email hoặc
            Tất cả giảng viên, chọn 7/30/90 ngày hoặc chọn ngày trên lịch và bấm
            Áp dụng ngày. Các số liệu và biểu đồ cập nhật cùng phạm vi. Đặt lại
            trở về toàn hệ thống trong 30 ngày.
          </p>
          <p>
            <strong>2. Chọn góc nhìn:</strong> Tổng quan hệ thống hiển thị xu
            hướng tiền học viên thanh toán và phần CodeMentor trên cùng biểu đồ,
            cùng phân bổ tiền, khóa học đóng góp, hoạt động giảng viên và trạng
            thái đơn. Hiệu quả khóa học/giảng viên để so sánh xếp hạng và tỷ
            trọng; Trạng thái để đếm đơn. Chọn tên hoặc mảnh biểu đồ để xem chi
            tiết. Mục Khác trong donut gom các mục còn lại, không che mất chúng
            trong bảng chi tiết.
          </p>
          <p>
            <strong>3. Phân biệt các loại tiền:</strong> Tiền học viên thanh
            toán là toàn bộ giá trị đơn, bao gồm cả đơn đã hoàn tiền. Phần phân
            bổ cho CodeMentor và giảng viên chỉ tính đơn đang ở trạng thái đã
            thanh toán; cả hai đều chưa trừ phí cổng thanh toán. Tỷ lệ lấy từ
            từng đơn, không tính lại theo chính sách mới. Đơn hoàn tiền không
            cộng vào phần thu.
          </p>
          <p>
            <strong>4. Số dư & khả năng rút:</strong> là sổ cái toàn thời gian,
            không thay đổi theo bộ lọc ngày. Đối soát không bỏ qua thời gian giữ
            doanh thu và không tự chi trả tiền.
          </p>
          <p>
            <strong>5. Xuất & tra cứu:</strong> CSV báo cáo xuất toàn kỳ; bảng
            chi tiết có tìm kiếm, sắp xếp và phân trang. Báo cáo không phải hóa
            đơn thuế.
          </p>
          <p className="text-muted-foreground">
            Khoảng tùy chọn tối đa 366 ngày, tính cả hai ngày theo giờ Việt Nam.
            Chọn góc nhìn Tất cả để xem đầy đủ các phần trên cùng trang. Chưa có
            dữ liệu so sánh kỳ trước nên không hiển thị tăng trưởng ước đoán.
          </p>
          <Button
            variant="outline"
            disabled={!report || loading}
            onClick={() =>
              report &&
              printDocument({
                title: "Báo cáo doanh thu",
                rows: [
                  ["Phạm vi", selected?.name ?? "Toàn hệ thống"],
                  ["Kỳ", `${report.from} – ${report.to}`],
                  ["Tiền học viên thanh toán", vnd(report.totals.gross)],
                  [
                    "Phần phân bổ cho giảng viên trước phí",
                    vnd(
                      scopedInstructors.reduce((sum, i) => sum + i.revenue, 0),
                    ),
                  ],
                  ["Phần CodeMentor trước phí", vnd(report.totals.revenue)],
                  ["Hoàn tiền", vnd(report.totals.refunded)],
                ],
              })
            }
          >
            In / lưu PDF báo cáo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
