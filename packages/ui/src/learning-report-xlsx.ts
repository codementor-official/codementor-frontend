import { CONTENT_STATUS_LABELS, type ContentStatus } from "@codementor/types";
import type { Workbook } from "exceljs";
import type { LearningReportData } from "./learning-report";
import { BRAND, downloadWorkbook, facts, notes, table, title, vietnamClock, type Cell, type Column, type ExcelJs } from "./revenue/report-xlsx";

const status = (value: string) => CONTENT_STATUS_LABELS[value as ContentStatus] ?? value;
const ratio = (part: number, whole: number): Cell => (whole === 0 ? null : part / whole);
const clock = (date: Date) => {
  const vn = vietnamClock(date).toISOString();
  return `${vn.slice(8, 10)}/${vn.slice(5, 7)}/${vn.slice(0, 4)} ${vn.slice(11, 16)}`;
};

/**
 * Báo cáo học tập (admin, toàn nền tảng) thành workbook: tổng quan, theo khóa học, theo lộ
 * trình, phễu từng lộ trình và cách tính. Mọi số lấy từ CHÍNH `data` mà trang đang hiện (cùng
 * cửa sổ 7/30 ngày). Nhận module ExcelJS làm tham số để test được trong Node.
 */
export function buildLearningReportWorkbook(ExcelJS: ExcelJs, data: LearningReportData, exportedAt = new Date()): Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CodeMentor";
  workbook.created = exportedAt;
  workbook.calcProperties.fullCalcOnLoad = true;
  const s = data.summary;
  const window = `${data.days} ngày gần nhất`;
  const period = `Toàn nền tảng · số "mới" tính trong ${window} · xuất lúc ${clock(exportedAt)} (giờ Việt Nam)`;

  const overview = workbook.addWorksheet("Tổng quan", { properties: { tabColor: { argb: BRAND } } });
  title(overview, "Báo cáo học tập", period, 3);
  facts(overview, 4, [
    ["Thời điểm xuất", vietnamClock(exportedAt), "time"],
    ["Cửa sổ thời gian", window, "text"],
    ["Lượt ghi danh khóa học (còn hiệu lực)", s.courseEnrollments, "int"],
    ["Chưa bắt đầu", s.notStarted, "int"],
    ["Đang học dở", s.inProgress, "int"],
    [`Ngưng học (> ${data.stalledDays} ngày)`, s.stalled, "int"],
    ["Hoàn thành", s.completed, "int"],
    ["Tỉ lệ hoàn thành", s.completionRate / 100, "percent"],
    ["Bỏ học", s.dropped, "int"],
    [`Ghi danh mới ${window}`, s.newEnrollments, "int"],
    [`Hoàn thành ${window}`, s.recentCompletions, "int"],
    ["Chứng chỉ còn hiệu lực", s.certificates, "int"],
    [`Chứng chỉ cấp ${window}`, s.recentCertificates, "int"],
    ["Lượt ghi danh lộ trình", s.roadmapEnrollments, "int"],
    ["Lộ trình hoàn thành", s.roadmapsCompleted, "int"],
    ["Bắt đầu khóa bỏ qua thứ tự", s.outOfOrderStarts, "int"],
  ]);

  const counts = (label: string): Column[] => [
    { header: label, format: "text", width: 44 },
    { header: "Trạng thái", format: "text" },
    { header: "Ghi danh", format: "int", sum: true },
    { header: "Chưa bắt đầu", format: "int", sum: true },
    { header: "Học dở", format: "int", sum: true },
    { header: `Ngưng học (> ${data.stalledDays} ngày)`, format: "int", sum: true },
    { header: "Hoàn thành", format: "int", sum: true },
    { header: "Tỉ lệ hoàn thành", format: "percent" },
    { header: "Bỏ học", format: "int", sum: true },
    { header: "Tiến độ TB", format: "percent" },
    { header: "Trung vị ngày để xong", format: "text" },
    { header: "Chứng chỉ", format: "int", sum: true },
    { header: "Bỏ qua thứ tự", format: "int", sum: true },
    { header: `Ghi danh mới ${data.days} ngày`, format: "int", sum: true },
    { header: `Hoàn thành ${data.days} ngày`, format: "int", sum: true },
  ];
  const countRow = (row: LearningReportData["courses"][number] | LearningReportData["roadmaps"][number]): Cell[] => [
    row.title,
    status(row.status),
    row.enrolled,
    row.notStarted,
    row.inProgress,
    row.stalled,
    row.completed,
    ratio(row.completed, row.enrolled),
    row.dropped,
    row.avgProgress / 100,
    row.medianDaysToComplete,
    row.certificates,
    row.outOfOrder,
    row.newEnrollments,
    row.recentCompletions,
  ];

  const courses = workbook.addWorksheet("Theo khóa học");
  title(courses, "Theo khóa học", period, 8);
  table(courses, 4, counts("Khóa học"), data.courses.map(countRow));

  const roadmaps = workbook.addWorksheet("Theo lộ trình");
  title(roadmaps, "Theo lộ trình", `${period} · bỏ qua thứ tự = số lượt bắt đầu khóa từ lộ trình này khi còn khóa bắt buộc phía trước chưa xong`, 8);
  table(roadmaps, 4, counts("Lộ trình"), data.roadmaps.map(countRow));

  const funnel = workbook.addWorksheet("Phễu lộ trình");
  title(funnel, "Phễu theo vị trí khóa", "Trong số người đã ghi danh lộ trình: bao nhiêu người bắt đầu và hoàn thành khóa ở từng vị trí", 6);
  table(
    funnel,
    4,
    [
      { header: "Lộ trình", format: "text", width: 40 },
      { header: "Vị trí", format: "int" },
      { header: "Khóa học", format: "text", width: 44 },
      { header: "Tự chọn", format: "text" },
      { header: "Ghi danh lộ trình", format: "int" },
      { header: "Đã bắt đầu", format: "int" },
      { header: "Hoàn thành", format: "int" },
      { header: "Tỉ lệ hoàn thành", format: "percent" },
      { header: "Bỏ qua thứ tự", format: "int" },
    ],
    data.roadmaps.flatMap((roadmap) =>
      roadmap.funnel.map((step): Cell[] => [
        roadmap.title,
        step.position,
        step.title,
        step.isOptional ? "Có" : "",
        roadmap.enrolled,
        step.started,
        step.completed,
        ratio(step.completed, roadmap.enrolled),
        step.outOfOrder,
      ]),
    ),
    false,
  );

  const how = workbook.addWorksheet("Cách tính");
  title(how, "Cách tính các số", period, 1);
  notes(how, 4, [
    "Ghi danh = lượt ghi danh chưa bỏ học. Bỏ học tính riêng và không nằm trong mẫu số của tỉ lệ hoàn thành.",
    "Chưa bắt đầu = đang học hoặc tạm dừng với tiến độ 0%; Học dở = tiến độ trên 0% nhưng chưa hoàn thành.",
    `Ngưng học = học dở và không có hoạt động quá ${data.stalledDays} ngày (là một phần của Học dở, không cộng thêm).`,
    "Tiến độ TB = trung bình tiến độ của các lượt ghi danh chưa bỏ học. Tiến độ tính cả video bị tua.",
    "Trung vị ngày để xong = trung vị số ngày từ lúc ghi danh tới lúc hoàn thành, chỉ tính lượt đã hoàn thành.",
    "Chứng chỉ = chứng chỉ còn hiệu lực (không tính bản đã thu hồi).",
    "Bỏ qua thứ tự = bắt đầu một khóa từ lộ trình khi còn khóa bắt buộc phía trước chưa hoàn thành; học viên vẫn được học.",
    `Các cột "mới" và "${data.days} ngày" tính theo giờ Việt Nam, gồm cả hôm nay. Không tính khóa học và lộ trình còn là bản nháp.`,
  ]);
  return workbook;
}

/** Tạo và tải tệp .xlsx của báo cáo học tập đang hiện trên trang. */
export function downloadLearningReportXlsx(data: LearningReportData): Promise<void> {
  const date = vietnamClock(new Date()).toISOString().slice(0, 10);
  return downloadWorkbook((ExcelJS) => buildLearningReportWorkbook(ExcelJS, data), `bao-cao-hoc-tap_${data.days}-ngay_${date}.xlsx`);
}
