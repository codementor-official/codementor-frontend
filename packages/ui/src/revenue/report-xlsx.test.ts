/**
 * Self-check for the Excel revenue report. Run with `pnpm test report-xlsx`.
 */
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import type { RevenueReport } from "@codementor/types";
import { buildRevenueWorkbook } from "./report-xlsx";

const report: RevenueReport = {
  scope: "admin",
  from: "2026-10-01",
  to: "2026-10-03",
  timezone: "Asia/Ho_Chi_Minh",
  totals: { gross: 3_000_000, revenue: 300_000, refunded: 1_000_000, paidOrders: 3 },
  daily: [
    { date: "2026-10-01", gross: 2_000_000, revenue: 300_000, refunded: 0, orders: 2 },
    { date: "2026-10-02", gross: 0, revenue: 0, refunded: 0, orders: 0 },
    { date: "2026-10-03", gross: 1_000_000, revenue: 0, refunded: 1_000_000, orders: 1 },
  ],
  courses: [
    { id: "c1", title: "Go cơ bản", gross: 2_000_000, revenue: 200_000, orders: 2 },
    { id: "c2", title: "Python cơ bản", gross: 1_000_000, revenue: 100_000, orders: 1 },
  ],
  statuses: { paid: 2, refunded: 1, expired: 1 },
};
const instructors = [
  { id: "i", name: "A", email: "a@x.vn", orders: 3, gross: 3_000_000, revenue: 2_700_000, platformRevenue: 300_000, pending: 0, available: 1, reserved: 0, paid: 0 },
];

(async () => {
  const built = buildRevenueWorkbook(ExcelJS, report, { scopeLabel: "Toàn hệ thống", instructors, exportedAt: new Date("2026-10-14T05:00:00Z") });
  // Round-trip through a real .xlsx buffer, as Excel would read it.
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await built.xlsx.writeBuffer());

  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ["Tổng quan", "Theo ngày", "Theo khóa học", "Trạng thái đơn", "Theo giảng viên"],
  );

  // Overview: the dashboard figures with currency / percent formats, not text.
  const overview = workbook.getWorksheet("Tổng quan")!;
  const find = (label: string) => {
    let hit: ExcelJS.Cell | undefined;
    overview.eachRow((row) => {
      if (row.getCell(1).value === label) hit = row.getCell(2);
    });
    assert.ok(hit, label);
    return hit!;
  };
  assert.equal(find("Phần CodeMentor trước phí").value, 300_000);
  assert.equal(find("Phần CodeMentor trước phí").numFmt, '#,##0 "₫"');
  assert.equal(find("Phần phân bổ cho giảng viên trước phí").value, 2_700_000);
  assert.equal(find("Tỷ lệ hoàn tiền theo giá trị").numFmt, "0.00%");
  assert.ok(Math.abs(Number(find("Tỷ lệ hoàn tiền theo giá trị").value) - 0.3333) < 0.001);
  assert.equal(find("Số đơn đã thanh toán hoặc đã hoàn").numFmt, "#,##0");

  // Export time is shown on the Vietnam clock (05:00Z → 12:00), the best day is a real date.
  assert.equal((find("Ngày doanh thu cao nhất").value as Date).toISOString().slice(0, 10), "2026-10-01");
  assert.equal(find("Ngày doanh thu cao nhất").numFmt, "dd/mm/yyyy");
  let exportedAt: Date | undefined;
  overview.eachRow((row) => {
    if (row.getCell(1).value === "Thời điểm xuất") exportedAt = row.getCell(2).value as Date;
  });
  assert.equal(exportedAt?.toISOString().slice(11, 16), "12:00");
  assert.equal(built.calcProperties.fullCalcOnLoad, true);

  // Daily: real dates, a SUM formula total that equals the dashboard total.
  const daily = workbook.getWorksheet("Theo ngày")!;
  assert.ok(daily.getCell("A5").value instanceof Date);
  assert.equal(daily.getCell("A5").numFmt, "dd/mm/yyyy");
  const total = daily.getCell("D8").value as { formula: string; result: number };
  assert.equal(total.formula, "SUM(D5:D7)");
  assert.equal(total.result, report.totals.revenue);
  assert.equal(daily.getCell("A8").value, "TỔNG");
  assert.equal(daily.views[0].state, "frozen");
  assert.equal((daily.views[0] as { ySplit?: number }).ySplit, 4);

  // Course shares add up to 100%.
  const courses = workbook.getWorksheet("Theo khóa học")!;
  assert.equal((courses.getCell("E7").value as { result: number }).result, 1);
  assert.equal(courses.getCell("E5").numFmt, "0.00%");

  // Statuses use Vietnamese labels.
  assert.equal(workbook.getWorksheet("Trạng thái đơn")!.getCell("A5").value, "Đã thanh toán");

  // Header row is styled (brand fill, white bold text).
  const head = daily.getCell("A4");
  assert.equal(head.font?.bold, true);
  assert.equal((head.fill as ExcelJS.FillPattern).fgColor?.argb, "FFEA580C");

  // Lecturer scope: no instructor sheet, lecturer share label.
  const lecturer = buildRevenueWorkbook(ExcelJS, { ...report, scope: "lecturer" }, { scopeLabel: "Các khóa học của bạn" });
  assert.equal(lecturer.worksheets.length, 4);
  assert.equal(lecturer.getWorksheet("Theo ngày")!.getCell("D4").value, "Doanh thu giảng viên trước phí");

  console.log("report-xlsx: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
