/**
 * Self-check for the revenue CSV. Run with `pnpm test report-csv`.
 */
import assert from "node:assert/strict";
import type { RevenueReport } from "@codementor/types";
import { revenueReportCsvRows, revenueReportFilename } from "./report-csv";
import { toCsv } from "@codementor/utils";

const report: RevenueReport = {
  scope: "lecturer",
  from: "2026-10-01",
  to: "2026-10-03",
  timezone: "Asia/Ho_Chi_Minh",
  totals: { gross: 3_000_000, revenue: 1_400_000, refunded: 1_000_000, paidOrders: 3 },
  daily: [
    { date: "2026-10-01", gross: 2_000_000, revenue: 1_400_000, refunded: 0, orders: 2 },
    { date: "2026-10-02", gross: 0, revenue: 0, refunded: 0, orders: 0 },
    { date: "2026-10-03", gross: 1_000_000, revenue: 0, refunded: 1_000_000, orders: 1 },
  ],
  courses: [{ id: "c1", title: "=HYPERLINK(\"x\")", gross: 3_000_000, revenue: 1_400_000, orders: 3 }],
  statuses: { paid: 2, refunded: 1, pending: 1 },
};

const rows = revenueReportCsvRows(report, { scopeLabel: "Khóa học của bạn", exportedAt: new Date("2026-10-14T05:00:00Z") });
const find = (label: string) => rows.find((row) => row[0] === label);

// Metadata and the summary are present, not only the daily table.
assert.deepEqual(find("Phạm vi"), ["Phạm vi", "Khóa học của bạn"]);
assert.deepEqual(find("Thời điểm xuất"), ["Thời điểm xuất", "2026-10-14 12:00"]);
assert.deepEqual(find("Doanh thu giảng viên trước phí"), ["Doanh thu giảng viên trước phí", 1_400_000, "VND"]);
assert.deepEqual(find("Giá trị đơn thực thu (sau hoàn tiền)")?.[1], 2_000_000);
assert.deepEqual(find("Tỷ lệ hoàn tiền theo giá trị")?.[1], 33.33);
assert.deepEqual(find("Ngày doanh thu cao nhất")?.[1], "2026-10-01");

// The daily TOTAL row equals the totals the dashboard shows.
const dailyTotal = rows.filter((row) => row[0] === "TỔNG").at(-1);
assert.deepEqual(dailyTotal, ["TỔNG", 3, 3_000_000, 1_400_000, 1_000_000]);

// Status shares add up across every status, not just paid ones.
assert.deepEqual(rows.find((row) => row[1] === "pending"), ["Đang chờ", "pending", 1, 25]);

// Admin scope labels the platform share and adds the per-instructor block.
const admin = revenueReportCsvRows({ ...report, scope: "admin" }, {
  scopeLabel: "Toàn hệ thống",
  instructors: [{ id: "i", name: "A", email: "a@x.vn", orders: 3, gross: 3, revenue: 2, platformRevenue: 1, pending: 0, available: 0, reserved: 0, paid: 0 }],
});
assert.ok(admin.some((row) => row[0] === "Phần CodeMentor trước phí"));
assert.ok(admin.some((row) => row[0] === "THEO GIẢNG VIÊN"));
assert.deepEqual(admin.find((row) => row[0] === "Phần phân bổ cho giảng viên trước phí"), ["Phần phân bổ cho giảng viên trước phí", 2, "VND"]);

// Serialized file: UTF-8 BOM, CRLF, formula injection neutralised, commas quoted.
const csv = toCsv(rows);
assert.equal(csv.charCodeAt(0), 0xfeff);
assert.ok(csv.includes("\r\n"));
assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
assert.equal(revenueReportFilename("bao-cao", report), "bao-cao_2026-10-01_2026-10-03.csv");

console.log("report-csv: ok");
