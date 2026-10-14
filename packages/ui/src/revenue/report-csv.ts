import { COMMERCE_STATUS, type RevenueInstructor, type RevenueReport } from "@codementor/types";
import { csvDateTime, type CsvRow } from "@codementor/utils";

export interface RevenueCsvOptions {
  /** Ai/cái gì nằm trong báo cáo, ví dụ "Toàn hệ thống" hoặc "Nguyễn A <a@x.vn>". */
  scopeLabel: string;
  /** Admin: bảng theo giảng viên, cùng kỳ với báo cáo. */
  instructors?: RevenueInstructor[];
  /** Thời điểm xuất; truyền vào để test cố định được. */
  exportedAt?: Date;
}

/** Tên phần doanh thu của người xem: Admin thấy phần CodeMentor, giảng viên thấy phần mình. */
export const shareLabel = (report: Pick<RevenueReport, "scope">) =>
  report.scope === "admin" ? "Phần CodeMentor trước phí" : "Doanh thu giảng viên trước phí";

export const percent = (part: number, whole: number) =>
  whole ? Math.round((part * 10_000) / whole) / 100 : 0;

/**
 * Báo cáo doanh thu đầy đủ dưới dạng các dòng CSV, nhiều phần ngăn bằng một dòng trống:
 * thông tin kỳ, tổng quan, theo khóa học, trạng thái đơn, theo ngày (kèm dòng TỔNG) và — với
 * Admin — theo giảng viên.
 *
 * Mọi con số lấy từ CHÍNH `report` mà dashboard đang vẽ (cùng bộ lọc kỳ/giảng viên), không
 * gọi lại API, nên tệp không thể lệch với màn hình. Tiền là số nguyên VND thô để bảng tính
 * cộng được; tỷ lệ là số phần trăm (12.5 = 12,5%).
 */
export function revenueReportCsvRows(report: RevenueReport, options: RevenueCsvOptions): CsvRow[] {
  const { totals } = report;
  const share = shareLabel(report);
  const sum = (key: "orders" | "gross" | "revenue" | "refunded") =>
    report.daily.reduce((total, day) => total + day[key], 0);
  const statusTotal = Object.values(report.statuses).reduce((total, count) => total + count, 0);

  const rows: CsvRow[] = [
    ["BÁO CÁO DOANH THU"],
    ["Phạm vi", options.scopeLabel],
    ["Từ ngày", report.from],
    ["Đến ngày", report.to],
    ["Số ngày", report.daily.length],
    ["Múi giờ", report.timezone],
    ["Thời điểm xuất", csvDateTime(options.exportedAt ?? new Date())],
    [
      "Ghi chú",
      "Đơn tính theo ngày xác nhận thanh toán. Doanh thu chưa trừ phí cổng thanh toán và đã loại đơn hoàn tiền; giá trị đơn gồm cả đơn đã hoàn.",
    ],
    [],
    ["TỔNG QUAN", "Giá trị", "Đơn vị"],
    ...revenueSummary(report, options),
    [],
    ["THEO KHÓA HỌC"],
    ["Khóa học", "Mã khóa học", "Số đơn", "Giá trị đơn (VND)", `${share} (VND)`, "Tỷ trọng doanh thu (%)"],
    ...report.courses.map((course) => [
      course.title,
      course.id,
      course.orders,
      course.gross,
      course.revenue,
      percent(course.revenue, totals.revenue),
    ]),
    [
      "TỔNG",
      "",
      report.courses.reduce((total, course) => total + course.orders, 0),
      report.courses.reduce((total, course) => total + course.gross, 0),
      report.courses.reduce((total, course) => total + course.revenue, 0),
      report.courses.length ? 100 : 0,
    ],
    [],
    ["TRẠNG THÁI ĐƠN TRONG KỲ"],
    ["Trạng thái", "Mã", "Số đơn", "Tỷ lệ (%)"],
    ...Object.entries(report.statuses)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => [COMMERCE_STATUS[status] ?? status, status, count, percent(count, statusTotal)]),
    ["TỔNG", "", statusTotal, statusTotal ? 100 : 0],
    [],
    ["THEO NGÀY"],
    ["Ngày", "Số đơn", "Giá trị đơn (VND)", `${share} (VND)`, "Hoàn tiền của đơn trong ngày (VND)"],
    ...report.daily.map((day) => [day.date, day.orders, day.gross, day.revenue, day.refunded]),
    ["TỔNG", sum("orders"), sum("gross"), sum("revenue"), sum("refunded")],
  ];

  if (options.instructors?.length) {
    const list = options.instructors;
    const total = (key: keyof Omit<RevenueInstructor, "id" | "name" | "email">) =>
      list.reduce((acc, item) => acc + item[key], 0);
    rows.push(
      [],
      ["THEO GIẢNG VIÊN"],
      [
        "Ghi chú",
        "Doanh thu theo kỳ đã chọn; các cột số dư là số dư hiện tại của ví (mọi thời điểm), không theo kỳ.",
      ],
      [
        "Giảng viên",
        "Email",
        "Số đơn",
        "Giá trị đơn (VND)",
        "Phần giảng viên (VND)",
        "Phần CodeMentor (VND)",
        "Số dư chờ khả dụng (VND)",
        "Số dư có thể rút (VND)",
        "Đang giữ để rút (VND)",
        "Đã chi trả (VND)",
      ],
      ...list.map((item) => [
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
      [
        "TỔNG",
        "",
        total("orders"),
        total("gross"),
        total("revenue"),
        total("platformRevenue"),
        total("pending"),
        total("available"),
        total("reserved"),
        total("paid"),
      ],
    );
  }
  return rows;
}

/** Tên tệp có kỳ báo cáo, để nhiều lần xuất không đè lên nhau trong thư mục Tải về. */
export function revenueReportFilename(prefix: string, report: Pick<RevenueReport, "from" | "to">): string {
  return `${prefix}_${report.from}_${report.to}.csv`;
}

export type SummaryUnit = "VND" | "đơn" | "%" | "ngày" | "khóa" | "";

/**
 * Các chỉ số TỔNG QUAN — một nguồn cho cả CSV lẫn Excel, nên hai tệp không thể lệch nhau
 * hay lệch với dashboard (mọi số đều từ CHÍNH `report` đang vẽ).
 */
export function revenueSummary(report: RevenueReport, options: RevenueCsvOptions): [string, number | string, SummaryUnit][] {
  const { totals } = report;
  const share = shareLabel(report);
  const paid = report.statuses.paid ?? 0;
  const refundedOrders = report.statuses.refunded ?? 0;
  const activeDays = report.daily.filter((day) => day.orders > 0).length;
  const best = report.daily.reduce<RevenueReport["daily"][number] | null>(
    (top, day) => (day.revenue > (top?.revenue ?? 0) ? day : top),
    null,
  );
  return [
    [share, totals.revenue, "VND"],
    // Admin: dashboard hiện cả phần giảng viên cạnh phần CodeMentor, tệp phải có đủ cả hai.
    ...(report.scope === "admin" && options.instructors?.length
      ? [["Phần phân bổ cho giảng viên trước phí", options.instructors.reduce((acc, item) => acc + item.revenue, 0), "VND"]]
      : []),
    ["Giá trị đơn đã thanh toán (gồm đơn đã hoàn)", totals.gross, "VND"],
    ["Giá trị thuộc đơn đã hoàn tiền", totals.refunded, "VND"],
    ["Giá trị đơn thực thu (sau hoàn tiền)", totals.gross - totals.refunded, "VND"],
    ["Số đơn đã thanh toán hoặc đã hoàn", totals.paidOrders, "đơn"],
    ["  trong đó đang thanh toán", paid, "đơn"],
    ["  trong đó đã hoàn tiền", refundedOrders, "đơn"],
    ["Giá trị trung bình mỗi đơn", totals.paidOrders ? Math.round(totals.gross / totals.paidOrders) : 0, "VND"],
    ["Tỷ lệ hoàn tiền theo giá trị", percent(totals.refunded, totals.gross), "%"],
    ["Số ngày có đơn", activeDays, "ngày"],
    ["Doanh thu trung bình mỗi ngày", report.daily.length ? Math.round(totals.revenue / report.daily.length) : 0, "VND"],
    ["Ngày doanh thu cao nhất", best?.date ?? "", ""],
    ["Doanh thu ngày cao nhất", best?.revenue ?? 0, "VND"],
    ["Số khóa học có đơn", report.courses.length, "khóa"],
  ] as [string, number | string, SummaryUnit][];
}
