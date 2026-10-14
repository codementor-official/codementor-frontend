import { COMMERCE_STATUS, type RevenueReport } from "@codementor/types";
import type { Workbook, Worksheet } from "exceljs";
import { revenueSummary, shareLabel, type RevenueCsvOptions } from "./report-csv";

type ExcelJs = typeof import("exceljs");
type Cell = string | number | Date | null;
type Format = "vnd" | "int" | "percent" | "date" | "text";

const BRAND = "FFEA580C"; // --primary của theme sáng
const BRAND_TINT = "FFFFF1E8";
const STRIPE = "FFF8FAFC";
const BORDER = { style: "thin" as const, color: { argb: "FFE2E8F0" } };
const NUM_FMT: Record<Format, string | undefined> = {
  vnd: '#,##0 "₫"',
  int: "#,##0",
  percent: "0.00%",
  date: "dd/mm/yyyy",
  text: undefined,
};

const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const viDate = (iso: string) => iso.split("-").reverse().join("/");
/**
 * Excel không có múi giờ: ô ngày giờ hiện đúng các con số được ghi. ExcelJS ghi theo thành
 * phần UTC, nên dời +7 giờ để ô hiện giờ Việt Nam thay vì giờ UTC (lệch 7 tiếng).
 */
const vietnamClock = (date: Date) => new Date(date.getTime() + 7 * 60 * 60 * 1000);

interface Column {
  header: string;
  format: Format;
  /** Dòng TỔNG cộng cột này bằng công thức SUM. */
  sum?: boolean;
  width?: number;
}

/**
 * Một bảng có định dạng trên một sheet: tiêu đề cam chữ trắng, dòng kẻ, sọc xen kẽ, định
 * dạng số theo cột, dòng TỔNG dùng công thức (người dùng sửa số vẫn tự cộng lại), cố định
 * tiêu đề và bật bộ lọc.
 */
function table(sheet: Worksheet, startRow: number, columns: Column[], rows: Cell[][], totals = true) {
  const header = sheet.getRow(startRow);
  columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle", horizontal: index === 0 ? "left" : "center", wrapText: true };
    cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
  });
  header.height = 30;

  rows.forEach((values, rowIndex) => {
    const row = sheet.getRow(startRow + 1 + rowIndex);
    values.forEach((value, index) => {
      const cell = row.getCell(index + 1);
      cell.value = value;
      const format = NUM_FMT[columns[index].format];
      if (format) cell.numFmt = format;
      cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
      if (rowIndex % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STRIPE } };
    });
  });

  const last = startRow + rows.length;
  if (totals && rows.length) {
    const row = sheet.getRow(last + 1);
    columns.forEach((column, index) => {
      const cell = row.getCell(index + 1);
      const letter = sheet.getColumn(index + 1).letter;
      if (index === 0) cell.value = "TỔNG";
      else if (column.sum) {
        const result = rows.reduce((acc, values) => acc + (Number(values[index]) || 0), 0);
        // `result` là giá trị đệm cho trình xem không tự tính; Excel vẫn tính lại khi mở.
        cell.value = { formula: `SUM(${letter}${startRow + 1}:${letter}${last})`, result };
      }
      const format = NUM_FMT[column.format];
      if (format && column.sum) cell.numFmt = format;
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_TINT } };
      cell.border = { top: { style: "medium", color: { argb: BRAND } }, left: BORDER, bottom: BORDER, right: BORDER };
    });
  }

  columns.forEach((column, index) => {
    const longest = Math.max(
      column.header.length,
      ...rows.map((values) => String(values[index] ?? "").length),
    );
    sheet.getColumn(index + 1).width = column.width ?? Math.min(Math.max(longest + 4, 12), 60);
  });
  sheet.views = [{ state: "frozen", ySplit: startRow }];
  if (rows.length) sheet.autoFilter = { from: { row: startRow, column: 1 }, to: { row: last, column: columns.length } };
}

function title(sheet: Worksheet, text: string, subtitle: string, span: number) {
  sheet.mergeCells(1, 1, 1, span);
  const head = sheet.getCell(1, 1);
  head.value = text;
  head.font = { bold: true, size: 16, color: { argb: BRAND } };
  sheet.mergeCells(2, 1, 2, span);
  const sub = sheet.getCell(2, 1);
  sub.value = subtitle;
  sub.font = { italic: true, color: { argb: "FF64748B" } };
}

/**
 * Báo cáo doanh thu thành một workbook nhiều sheet. Mọi số lấy từ CHÍNH `report` mà dashboard
 * đang vẽ (cùng bộ lọc), và phần TỔNG QUAN dùng chung `revenueSummary` với bản CSV.
 * Nhận module ExcelJS làm tham số để test được trong Node mà không cần trình duyệt.
 */
export function buildRevenueWorkbook(ExcelJS: ExcelJs, report: RevenueReport, options: RevenueCsvOptions): Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CodeMentor";
  workbook.created = options.exportedAt ?? new Date();
  // Buộc Excel tính lại mọi công thức khi mở: ExcelJS bỏ giá trị đệm bằng 0, ô TỔNG của cột
  // toàn số 0 sẽ trống nếu trình xem chỉ đọc giá trị đệm.
  workbook.calcProperties.fullCalcOnLoad = true;
  const share = shareLabel(report);
  const period = `${options.scopeLabel} · ${viDate(report.from)} – ${viDate(report.to)} · giờ Việt Nam`;

  // 1. Tổng quan
  const overview = workbook.addWorksheet("Tổng quan", { properties: { tabColor: { argb: BRAND } } });
  title(overview, "Báo cáo doanh thu", period, 3);
  const info: [string, Cell][] = [
    ["Phạm vi", options.scopeLabel],
    ["Từ ngày", toDate(report.from)],
    ["Đến ngày", toDate(report.to)],
    ["Số ngày", report.daily.length],
    ["Thời điểm xuất", vietnamClock(options.exportedAt ?? new Date())],
  ];
  info.forEach(([label, value], index) => {
    const row = overview.getRow(4 + index);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
    row.getCell(2).value = value;
    if (value instanceof Date) row.getCell(2).numFmt = label === "Thời điểm xuất" ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
    row.getCell(2).alignment = { horizontal: "left" };
  });
  const summaryStart = 4 + info.length + 1;
  const isIsoDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const summary = revenueSummary(report, options).map(([label, value, unit]): Cell[] => [
    label.trim(),
    unit === "%" ? Number(value) / 100 : isIsoDate(value) ? toDate(value) : value,
    unit === "VND" ? "" : unit === "%" ? "" : unit,
  ]);
  table(
    overview,
    summaryStart,
    [
      { header: "Chỉ số", format: "text", width: 46 },
      { header: "Giá trị", format: "text", width: 22 },
      { header: "Đơn vị", format: "text", width: 10 },
    ],
    summary,
    false,
  );
  // Định dạng từng ô giá trị theo đơn vị của chính dòng đó (cột trộn tiền, số đơn, tỷ lệ).
  revenueSummary(report, options).forEach(([, value, unit], index) => {
    const cell = overview.getCell(summaryStart + 1 + index, 2);
    cell.alignment = { horizontal: "right" };
    if (isIsoDate(value)) cell.numFmt = NUM_FMT.date!;
    if (typeof value !== "number") return;
    cell.numFmt = unit === "VND" ? NUM_FMT.vnd! : unit === "%" ? NUM_FMT.percent! : NUM_FMT.int!;
  });
  const note = overview.getCell(summaryStart + summary.length + 2, 1);
  note.value =
    "Đơn tính theo ngày xác nhận thanh toán. Doanh thu chưa trừ phí cổng thanh toán và đã loại đơn hoàn tiền; giá trị đơn gồm cả đơn đã hoàn.";
  note.font = { italic: true, color: { argb: "FF64748B" } };
  overview.mergeCells(summaryStart + summary.length + 2, 1, summaryStart + summary.length + 2, 3);
  note.alignment = { wrapText: true, vertical: "top" };
  overview.getRow(summaryStart + summary.length + 2).height = 32;
  overview.views = [{ state: "normal" }];

  // 2. Theo ngày
  const daily = workbook.addWorksheet("Theo ngày");
  title(daily, "Doanh thu theo ngày", period, 5);
  table(
    daily,
    4,
    [
      { header: "Ngày", format: "date", width: 14 },
      { header: "Số đơn", format: "int", sum: true },
      { header: "Giá trị đơn", format: "vnd", sum: true, width: 18 },
      { header: share, format: "vnd", sum: true, width: 30 },
      { header: "Hoàn tiền của đơn", format: "vnd", sum: true, width: 20 },
    ],
    report.daily.map((day) => [toDate(day.date), day.orders, day.gross, day.revenue, day.refunded]),
  );

  // 3. Theo khóa học
  const courses = workbook.addWorksheet("Theo khóa học");
  title(courses, "Doanh thu theo khóa học", period, 5);
  table(
    courses,
    4,
    [
      { header: "Khóa học", format: "text" },
      { header: "Số đơn", format: "int", sum: true },
      { header: "Giá trị đơn", format: "vnd", sum: true, width: 18 },
      { header: share, format: "vnd", sum: true, width: 30 },
      { header: "Tỷ trọng doanh thu", format: "percent", sum: true, width: 20 },
    ],
    report.courses.map((course) => [
      course.title,
      course.orders,
      course.gross,
      course.revenue,
      report.totals.revenue ? course.revenue / report.totals.revenue : 0,
    ]),
  );

  // 4. Trạng thái đơn
  const statuses = workbook.addWorksheet("Trạng thái đơn");
  title(statuses, "Trạng thái đơn trong kỳ", period, 3);
  const statusTotal = Object.values(report.statuses).reduce((acc, count) => acc + count, 0);
  table(
    statuses,
    4,
    [
      { header: "Trạng thái", format: "text", width: 24 },
      { header: "Số đơn", format: "int", sum: true },
      { header: "Tỷ lệ", format: "percent", sum: true },
    ],
    Object.entries(report.statuses)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => [COMMERCE_STATUS[status] ?? status, count, statusTotal ? count / statusTotal : 0]),
  );

  // 5. Theo giảng viên (Admin)
  if (options.instructors?.length) {
    const sheet = workbook.addWorksheet("Theo giảng viên");
    title(sheet, "Doanh thu theo giảng viên", `${period} · số dư là số dư hiện tại của ví, không theo kỳ`, 10);
    table(
      sheet,
      4,
      [
        { header: "Giảng viên", format: "text" },
        { header: "Email", format: "text" },
        { header: "Số đơn", format: "int", sum: true },
        { header: "Giá trị đơn", format: "vnd", sum: true, width: 18 },
        { header: "Phần giảng viên", format: "vnd", sum: true, width: 18 },
        { header: "Phần CodeMentor", format: "vnd", sum: true, width: 18 },
        { header: "Chờ khả dụng", format: "vnd", sum: true, width: 16 },
        { header: "Có thể rút", format: "vnd", sum: true, width: 16 },
        { header: "Đang giữ để rút", format: "vnd", sum: true, width: 16 },
        { header: "Đã chi trả", format: "vnd", sum: true, width: 16 },
      ],
      [...options.instructors]
        .sort((a, b) => b.revenue - a.revenue)
        .map((item) => [
          item.name,
          item.email,
          item.orders,
          item.gross,
          item.revenue,
          item.platformRevenue,
          item.pending,
          item.available,
          item.reserved,
          item.paid,
        ]),
    );
  }
  return workbook;
}

/** Tạo và tải tệp .xlsx. ExcelJS (~1 MB) chỉ được nạp khi người dùng bấm xuất. */
export async function downloadRevenueReportXlsx(
  prefix: string,
  report: RevenueReport,
  options: RevenueCsvOptions,
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default as unknown as ExcelJs;
  const buffer = await buildRevenueWorkbook(ExcelJS, report, options).xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${prefix}_${report.from}_${report.to}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
