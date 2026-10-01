function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  // Spreadsheet formulas must not execute user-provided names or notes.
  const text = typeof value === "string" && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Xuất dữ liệu đang hiển thị thành CSV UTF-8 để Excel đọc đúng tiếng Việt. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): void {
  const content = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
