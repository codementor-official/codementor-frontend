import type { Workbook } from "exceljs";
import { BRAND, downloadWorkbook, facts, table, title, vietnamClock, type Cell, type ExcelJs } from "../revenue/report-xlsx";

/** Đúng phần cần xuất của một dòng `GET /certificates/admin`. */
export interface IssuedCertificateRow {
  code: string;
  recipientName: string;
  email: string | null;
  subject: "course" | "roadmap";
  data: { subjectTitle: string };
  issuedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
}

export interface IssuedCertificatesExport {
  rows: IssuedCertificateRow[];
  /** Ô tìm kiếm đang áp dụng; rỗng = tất cả. */
  query: string;
  /** Tổng số khớp ở máy chủ — lớn hơn `rows.length` khi bị cắt. */
  total: number;
}

const at = (iso: string | null): Cell => (iso ? vietnamClock(new Date(iso)) : null);

/** Danh sách chứng chỉ đã cấp (admin) thành workbook: tổng quan + từng chứng chỉ. */
export function buildIssuedCertificatesWorkbook(ExcelJS: ExcelJs, input: IssuedCertificatesExport, exportedAt = new Date()): Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CodeMentor";
  workbook.created = exportedAt;
  const { rows } = input;
  const revoked = rows.filter((row) => row.revokedAt).length;
  const filter = input.query ? `Lọc: “${input.query}”` : "Tất cả chứng chỉ";

  const overview = workbook.addWorksheet("Tổng quan", { properties: { tabColor: { argb: BRAND } } });
  title(overview, "Chứng chỉ đã cấp", `${filter} · giờ Việt Nam`, 3);
  facts(overview, 4, [
    ["Thời điểm xuất", vietnamClock(exportedAt), "time"],
    ["Bộ lọc", input.query || "—", "text"],
    ["Số chứng chỉ trong tệp", rows.length, "int"],
    ["Còn hiệu lực", rows.length - revoked, "int"],
    ["Đã thu hồi", revoked, "int"],
    ["Chứng chỉ khóa học", rows.filter((row) => row.subject === "course").length, "int"],
    ["Chứng chỉ lộ trình", rows.filter((row) => row.subject === "roadmap").length, "int"],
  ]);
  if (input.total > rows.length) {
    const note = overview.getCell(12, 1);
    note.value = `Tệp chỉ gồm ${rows.length}/${input.total} chứng chỉ khớp — thu hẹp bộ lọc để xuất phần còn lại.`;
    note.font = { bold: true, color: { argb: BRAND } };
  }

  const list = workbook.addWorksheet("Chứng chỉ");
  title(list, "Danh sách chứng chỉ", `${filter} · mới cấp trước`, 9);
  table(
    list,
    4,
    [
      { header: "Mã", format: "text" },
      { header: "Người nhận (tên in)", format: "text" },
      { header: "Email", format: "text" },
      { header: "Loại", format: "text" },
      { header: "Khóa học / lộ trình", format: "text", width: 44 },
      { header: "Ngày cấp", format: "text", width: 18 },
      { header: "Trạng thái", format: "text" },
      { header: "Ngày thu hồi", format: "text", width: 18 },
      { header: "Lý do thu hồi", format: "text", width: 40 },
    ],
    rows.map((row) => [
      row.code,
      row.recipientName,
      row.email,
      row.subject === "course" ? "Khóa học" : "Lộ trình",
      row.data.subjectTitle,
      at(row.issuedAt),
      row.revokedAt ? "Đã thu hồi" : "Hiệu lực",
      at(row.revokedAt),
      row.revokeReason,
    ]),
    false,
  );
  for (const column of [6, 8]) list.getColumn(column).numFmt = "dd/mm/yyyy hh:mm";
  return workbook;
}

export function downloadIssuedCertificatesXlsx(input: IssuedCertificatesExport): Promise<void> {
  const date = vietnamClock(new Date()).toISOString().slice(0, 10);
  return downloadWorkbook((ExcelJS) => buildIssuedCertificatesWorkbook(ExcelJS, input), `chung-chi-da-cap_${date}.xlsx`);
}
