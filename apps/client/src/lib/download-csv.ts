/** Download filtered API data as an Excel-friendly UTF-8 CSV file. */
export function downloadCsv(
  filename: string,
  columns: string[],
  rows: Array<Array<string | number>>,
) {
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const content = [columns, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
