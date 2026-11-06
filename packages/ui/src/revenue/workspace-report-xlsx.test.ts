/**
 * Self-check for the workspace plan report workbook. Run with `pnpm test workspace-report`.
 */
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import type { WorkspaceRevenueReport } from "@codementor/types";
import { bucketLabel, buildWorkspaceReportWorkbook } from "./workspace-report-xlsx";

const zero = { grossVnd: 0, refundedVnd: 0, netVnd: 0, payments: 0, refunds: 0, newSubscriptions: 0, renewals: 0, upgrades: 0 };
const pro = { ...zero, grossVnd: 600_000, refundedVnd: 100_000, netVnd: 500_000, payments: 3, refunds: 1, newSubscriptions: 2, renewals: 1 };
const plan = { status: "active" as const, isPurchasable: true, discountVnd: 0, creditVnd: 0 };
const report: WorkspaceRevenueReport = {
  from: "2026-01-01",
  to: "2026-06-30",
  bucket: "quarter",
  generatedAt: "2026-07-01T00:00:00Z",
  totals: { ...pro, discountVnd: 50_000, creditVnd: 0, payingAccounts: 4, freeAccounts: 96 },
  plans: [
    { ...zero, ...plan, planId: "f", code: "free", name: "Free", pricing: "free", isDefault: true, monthlyPriceVnd: 0, annualPriceVnd: 0, activeAccounts: 96 },
    { ...pro, ...plan, planId: "p", code: "pro", name: "Pro", pricing: "paid", isDefault: false, monthlyPriceVnd: 200_000, annualPriceVnd: 2_000_000, activeAccounts: 4, discountVnd: 50_000 },
    { ...zero, ...plan, planId: "e", code: "enterprise", name: "enterprise", pricing: "unpublished", isDefault: false, monthlyPriceVnd: null, annualPriceVnd: null, activeAccounts: 0 },
  ],
  series: [
    { ...pro, bucket: "2026-01-01", refundedVnd: 0, netVnd: 600_000, refunds: 0 },
    { ...zero, bucket: "2026-04-01", refundedVnd: 100_000, netVnd: -100_000, refunds: 1 },
  ],
  orders: [
    {
      id: "abcdef12-0000", createdAt: "2026-01-02T02:00:00Z", paidAt: "2026-01-02T03:00:00Z", refundedAt: null, status: "paid",
      kind: "new", billingCycle: "month", planName: "Pro", buyer: { name: "A", email: "a@x.vn" }, listPriceVnd: 250_000,
      discountVnd: 50_000, creditVnd: 0, amountVnd: 200_000, refundedVnd: null, coupon: "TET", reference: "VNP1",
      collectedInPeriodVnd: 200_000, refundedInPeriodVnd: 0,
    },
  ],
  ordersTruncated: false,
};

assert.equal(bucketLabel("quarter", "2026-04-01"), "Q2/2026");
assert.equal(bucketLabel("month", "2026-04-01"), "04/2026");
assert.equal(bucketLabel("year", "2026-01-01"), "2026");
assert.equal(bucketLabel("day", "2026-04-09"), "09/04/2026");

(async () => {
  const built = buildWorkspaceReportWorkbook(ExcelJS, report, new Date("2026-07-01T05:00:00Z"));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await built.xlsx.writeBuffer());
  assert.deepEqual(workbook.worksheets.map((s) => s.name), ["Tổng quan", "Theo gói", "Theo quý", "Chi tiết đơn", "Cách tính"]);

  const plans = workbook.getWorksheet("Theo gói")!;
  assert.deepEqual([5, 6, 7].map((r) => plans.getCell(r, 3).value), ["Miễn phí", "Tính phí", "Chưa xuất bản"]);
  assert.equal(plans.getCell(6, 8).value, 4); // accounts on Pro
  assert.equal(plans.getCell(6, 15).numFmt, '#,##0 "₫"');
  assert.equal((plans.getCell(8, 15).value as { formula: string; result: number }).result, 500_000); // TỔNG net
  assert.equal((plans.getCell(8, 8).value as { result: number }).result, 100); // all accounts

  const series = workbook.getWorksheet("Theo quý")!;
  assert.deepEqual([series.getCell("A5").value, series.getCell("A6").value], ["Q1/2026", "Q2/2026"]);
  assert.equal(series.getCell("I6").value, -100_000); // a refund of an earlier sale makes the bucket negative

  const orders = workbook.getWorksheet("Chi tiết đơn")!;
  assert.equal(orders.getCell("A5").value, "ABCDEF12");
  assert.equal((orders.getCell("B5").value as Date).toISOString().slice(11, 16), "10:00"); // Vietnam clock
  assert.equal(orders.getCell("Q5").value, "Đã thanh toán");
  console.log("workspace-report: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
