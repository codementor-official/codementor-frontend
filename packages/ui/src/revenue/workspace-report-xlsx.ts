import type { ReportBucket, WorkspaceRevenueReport } from "@codementor/types";
import type { Workbook } from "exceljs";
import { BRAND, table, title, toDate, viDate, vietnamClock, type Cell, type ExcelJs } from "./report-xlsx";

const PRICING = { free: "Miễn phí", paid: "Tính phí", unpublished: "Chưa xuất bản" } as const;
const PLAN_STATUS = { active: "Hiện trên bảng giá", hidden: "Đang ẩn", archived: "Lưu trữ" } as const;
const KIND = { new: "Mua mới", renewal: "Gia hạn", upgrade: "Nâng cấp" } as const;
const ORDER_STATUS: Record<string, string> = {
  paid: "Đã thanh toán", refunded: "Đã hoàn tiền", review: "Chờ kiểm tra", pending: "Chờ thanh toán",
  failed: "Thất bại", cancelled: "Đã huỷ", expired: "Hết hạn",
};
const BUCKET: Record<ReportBucket, string> = { day: "Ngày", month: "Tháng", quarter: "Quý", year: "Năm" };

/** "2026-04-01" → "04/2026", "Q2/2026", "2026" or "01/04/2026" for the bucket. */
export function bucketLabel(bucket: ReportBucket, iso: string): string {
  const [y, m, d] = iso.split("-");
  if (bucket === "year") return y;
  if (bucket === "quarter") return `Q${Math.floor((Number(m) - 1) / 3) + 1}/${y}`;
  if (bucket === "month") return `${m}/${y}`;
  return `${d}/${m}/${y}`;
}

const at = (iso: string | null): Cell => (iso ? vietnamClock(new Date(iso)) : null);

/**
 * The workspace plan report as a workbook: overview, per plan, per bucket, the orders behind
 * the numbers, and how they are counted. Every figure comes from the same `report` the admin
 * screen shows. Takes the ExcelJS module so it is testable in Node.
 */
export function buildWorkspaceReportWorkbook(ExcelJS: ExcelJs, report: WorkspaceRevenueReport, exportedAt = new Date()): Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CodeMentor";
  workbook.created = exportedAt;
  workbook.calcProperties.fullCalcOnLoad = true;
  const period = `${viDate(report.from)} – ${viDate(report.to)} · giờ Việt Nam · theo ${BUCKET[report.bucket].toLowerCase()}`;
  const t = report.totals;

  const overview = workbook.addWorksheet("Tổng quan", { properties: { tabColor: { argb: BRAND } } });
  title(overview, "Báo cáo doanh thu gói Workspace", period, 3);
  const lines: [string, Cell, "vnd" | "int" | "date" | "time"][] = [
    ["Từ ngày", toDate(report.from), "date"],
    ["Đến ngày", toDate(report.to), "date"],
    ["Thời điểm xuất", vietnamClock(exportedAt), "time"],
    ["Tiền thu (gộp)", t.grossVnd, "vnd"],
    ["Đã hoàn", t.refundedVnd, "vnd"],
    ["Doanh thu thuần", t.netVnd, "vnd"],
    ["Giảm giá đã cấp (đơn trả trong kỳ)", t.discountVnd, "vnd"],
    ["Trừ từ gói cũ khi nâng cấp", t.creditVnd, "vnd"],
    ["Số lần thanh toán", t.payments, "int"],
    ["Số lần hoàn tiền", t.refunds, "int"],
    ["Mua mới", t.newSubscriptions, "int"],
    ["Gia hạn", t.renewals, "int"],
    ["Nâng cấp", t.upgrades, "int"],
    ["Tài khoản đang trả phí (hiện tại)", t.payingAccounts, "int"],
    ["Tài khoản dùng Free (hiện tại)", t.freeAccounts, "int"],
  ];
  lines.forEach(([label, value, format], index) => {
    const row = overview.getRow(4 + index);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
    const cell = row.getCell(2);
    cell.value = value;
    cell.numFmt = { vnd: '#,##0 "₫"', int: "#,##0", date: "dd/mm/yyyy", time: "dd/mm/yyyy hh:mm" }[format];
    if (label === "Doanh thu thuần") cell.font = { bold: true, color: { argb: BRAND } };
  });
  overview.getColumn(1).width = 38;
  overview.getColumn(2).width = 22;

  const plans = workbook.addWorksheet("Theo gói");
  title(plans, "Doanh thu theo gói", `${period} · số tài khoản là hiện tại`, 16);
  table(
    plans,
    4,
    [
      { header: "Gói", format: "text" },
      { header: "Mã", format: "text" },
      { header: "Loại", format: "text" },
      { header: "Bảng giá", format: "text" },
      { header: "Đang bán", format: "text" },
      { header: "Giá tháng", format: "vnd" },
      { header: "Giá năm", format: "vnd" },
      { header: "Tài khoản đang dùng", format: "int", sum: true },
      { header: "Mua mới", format: "int", sum: true },
      { header: "Gia hạn", format: "int", sum: true },
      { header: "Nâng cấp", format: "int", sum: true },
      { header: "Tiền thu", format: "vnd", sum: true },
      { header: "Giảm giá", format: "vnd", sum: true },
      { header: "Đã hoàn", format: "vnd", sum: true },
      { header: "Doanh thu thuần", format: "vnd", sum: true },
      { header: "Tỷ trọng", format: "percent" },
    ],
    report.plans.map((p) => [
      p.name, p.code, PRICING[p.pricing], PLAN_STATUS[p.status], p.isDefault ? "—" : p.isPurchasable ? "Có" : "Không",
      p.monthlyPriceVnd, p.annualPriceVnd, p.activeAccounts, p.newSubscriptions, p.renewals, p.upgrades,
      p.grossVnd, p.discountVnd, p.refundedVnd, p.netVnd, t.netVnd ? p.netVnd / t.netVnd : null,
    ]),
  );

  const series = workbook.addWorksheet(`Theo ${BUCKET[report.bucket].toLowerCase()}`);
  title(series, `Doanh thu theo ${BUCKET[report.bucket].toLowerCase()}`, period, 9);
  table(
    series,
    4,
    [
      { header: BUCKET[report.bucket], format: "text" },
      { header: "Thanh toán", format: "int", sum: true },
      { header: "Mua mới", format: "int", sum: true },
      { header: "Gia hạn", format: "int", sum: true },
      { header: "Nâng cấp", format: "int", sum: true },
      { header: "Hoàn tiền", format: "int", sum: true },
      { header: "Tiền thu", format: "vnd", sum: true },
      { header: "Đã hoàn", format: "vnd", sum: true },
      { header: "Doanh thu thuần", format: "vnd", sum: true },
    ],
    report.series.map((s) => [
      bucketLabel(report.bucket, s.bucket), s.payments, s.newSubscriptions, s.renewals, s.upgrades, s.refunds,
      s.grossVnd, s.refundedVnd, s.netVnd,
    ]),
  );

  const orders = workbook.addWorksheet("Chi tiết đơn");
  title(orders, "Đơn có thu hoặc hoàn tiền trong kỳ", report.ordersTruncated ? `${period} · chỉ 5 000 đơn đầu` : period, 18);
  table(
    orders,
    4,
    [
      { header: "Mã đơn", format: "text", width: 12 },
      { header: "Thanh toán lúc", format: "text", width: 18 },
      { header: "Hoàn lúc", format: "text", width: 18 },
      { header: "Người mua", format: "text" },
      { header: "Email", format: "text" },
      { header: "Gói", format: "text" },
      { header: "Loại", format: "text" },
      { header: "Chu kỳ", format: "text" },
      { header: "Giá niêm yết", format: "vnd", sum: true },
      { header: "Mã giảm giá", format: "text" },
      { header: "Giảm giá", format: "vnd", sum: true },
      { header: "Trừ gói cũ", format: "vnd", sum: true },
      { header: "Đã trả", format: "vnd", sum: true },
      { header: "Đã hoàn", format: "vnd", sum: true },
      { header: "Thu trong kỳ", format: "vnd", sum: true },
      { header: "Hoàn trong kỳ", format: "vnd", sum: true },
      { header: "Trạng thái", format: "text" },
      { header: "Mã giao dịch cổng", format: "text" },
    ],
    report.orders.map((o) => [
      o.id.slice(0, 8).toUpperCase(), at(o.paidAt), at(o.refundedAt), o.buyer.name, o.buyer.email, o.planName,
      KIND[o.kind], o.billingCycle === "year" ? "Năm" : "Tháng", o.listPriceVnd, o.coupon, o.discountVnd, o.creditVnd,
      o.amountVnd, o.refundedVnd ?? 0, o.collectedInPeriodVnd, o.refundedInPeriodVnd, ORDER_STATUS[o.status] ?? o.status,
      o.reference,
    ]),
  );
  for (const column of [2, 3]) orders.getColumn(column).numFmt = "dd/mm/yyyy hh:mm";

  const notes = workbook.addWorksheet("Cách tính");
  title(notes, "Cách tính các số", period, 2);
  [
    "Số tiền lấy từ sổ cái: một khoản thu tính vào ngày cổng thanh toán xác nhận, một khoản hoàn tính vào ngày ghi nhận hoàn.",
    "Doanh thu thuần = tiền thu − đã hoàn trong cùng kỳ; một đơn mua kỳ trước và hoàn kỳ này làm doanh thu kỳ này âm.",
    "Hoàn tiền theo số ngày chưa dùng của kỳ; số đã hoàn của từng đơn ở sheet Chi tiết đơn.",
    "Giảm giá và phần trừ gói cũ tính theo các đơn thanh toán trong kỳ; chúng không phải tiền thu.",
    "Tài khoản đang dùng là số tại thời điểm xuất (gói đang hiệu lực, kể cả đang ân hạn); Free là mọi tài khoản chưa có gói trả phí.",
    "Giờ Việt Nam (UTC+7), tính cả ngày đầu và ngày cuối.",
  ].forEach((text, index) => {
    const cell = notes.getCell(4 + index, 1);
    cell.value = `${index + 1}. ${text}`;
    cell.alignment = { wrapText: true, vertical: "top" };
  });
  notes.getColumn(1).width = 110;
  return workbook;
}

/** Builds and downloads the .xlsx; ExcelJS loads only when the admin clicks export. */
export async function downloadWorkspaceReportXlsx(report: WorkspaceRevenueReport): Promise<void> {
  const ExcelJS = (await import("exceljs")).default as unknown as ExcelJs;
  const buffer = await buildWorkspaceReportWorkbook(ExcelJS, report).xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bao-cao-goi-workspace_${report.from}_${report.to}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
