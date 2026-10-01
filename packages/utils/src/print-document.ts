export interface PrintableDocument {
  title: string;
  rows: Array<[string, string]>;
}

/** Print one record in an isolated frame, including when it is opened in a modal. */
export function printDocument({ title, rows }: PrintableDocument): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10000px;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const target = frame.contentWindow;
  if (!doc || !target) { frame.remove(); return; }
  doc.documentElement.lang = "vi";
  doc.title = title;
  const style = doc.createElement("style");
  style.textContent = "@page{size:A4;margin:18mm}body{font:14px Arial,sans-serif;color:#18181b;background:#fff;margin:24px}h1{font-size:24px}p{color:#52525b}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{width:35%}tr{break-inside:avoid}footer{margin-top:28px;font-size:12px;color:#52525b}";
  doc.head.appendChild(style);
  const brand = doc.createElement("p"); brand.textContent = "CodeMentor";
  const heading = doc.createElement("h1"); heading.textContent = title;
  const table = doc.createElement("table");
  for (const [label, value] of rows) {
    const row = doc.createElement("tr");
    const key = doc.createElement("th"); key.scope = "row"; key.textContent = label;
    const cell = doc.createElement("td"); cell.textContent = value;
    row.append(key, cell); table.appendChild(row);
  }
  const footer = doc.createElement("footer");
  footer.textContent = `Chứng từ nội bộ CodeMentor · Xuất lúc ${new Date().toLocaleString("vi-VN")}. Trạng thái và số liệu tại thời điểm xuất.`;
  doc.body.append(brand, heading, table, footer);
  target.addEventListener("afterprint", () => frame.remove(), { once: true });
  // Give the browser a frame to lay out the document before opening its print dialog.
  requestAnimationFrame(() => { target.focus(); target.print(); });
}
