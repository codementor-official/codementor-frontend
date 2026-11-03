#!/usr/bin/env node
/**
 * Renders the program thumbnails in public/programs/ (1280×720 PNG) with headless Chrome.
 * Each one is a small mock of the real screen on the brand ink ground; titles live in the page
 * markup, not in the image, so the numbers next to them stay live.
 *
 *   node apps/client/scripts/render-program-thumbnails.mjs [chrome-path]
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.argv[2] ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = fileURLToPath(new URL("../public/programs/", import.meta.url));

const check = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const page = (body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;width:1280px;height:720px;overflow:hidden;background:#18181b;font-family:Inter,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased}
.stage{position:absolute;inset:40px 48px;display:flex;gap:24px;align-items:center;zoom:1.3}
.win{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.bar{height:52px;display:flex;align-items:center;gap:12px;padding:0 22px;border-bottom:1px solid #e5e7eb;font-size:19px;font-weight:600}
.muted{color:#6b7280}.faint{color:#9ca3af}
.chip{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:8px;font-size:15px;font-weight:700;white-space:nowrap;flex-shrink:0}
.chip.grey{background:#f3f4f6;color:#18181b}.chip.orange{background:#ea580c;color:#fff}
.title{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row{display:flex;align-items:center;gap:14px;padding:16px 22px;border-bottom:1px solid #f3f4f6;font-size:18px}
.track{height:8px;border-radius:99px;background:#f3f4f6}.fill{height:8px;border-radius:99px;background:#ea580c}
.dot{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.mono{font-family:'Roboto Mono',monospace}
</style></head><body>${body}</body></html>`;

const THUMBNAILS = {
  courses: page(`<div class="stage">
    <div class="win" style="flex:1.6">
      <div style="height:330px;background:#27272a;display:flex;align-items:center;justify-content:center">
        <div style="width:84px;height:84px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="#18181b"><path d="M8 5v14l11-7z"/></svg></div></div>
      <div style="padding:24px 26px">
        <div class="muted" style="font-size:16px">Chương 2 · Bài 4</div>
        <div style="margin-top:6px;font-size:28px;font-weight:700">Index và đọc EXPLAIN</div>
        <div style="margin-top:18px;display:flex;align-items:center;gap:14px"><div class="track" style="flex:1"><div class="fill" style="width:62%"></div></div><span style="font-size:16px;font-weight:600">62%</span></div>
      </div>
    </div>
    <div class="win" style="flex:1">
      <div class="bar">Nội dung khóa học</div>
      ${["Chia bảng và khoá chính", "Ràng buộc dữ liệu", "Chuẩn hoá dữ liệu", "Index và đọc EXPLAIN", "Giao dịch và khoá"].map((t, i) => `
      <div class="row" style="${i === 3 ? "background:#f3f4f6;font-weight:600" : ""}">
        <span class="dot" style="${i < 3 ? "background:#18181b;color:#fff" : "border:2px solid #d1d5db"}">${i < 3 ? check : ""}</span>${t}</div>`).join("")}
    </div></div>`),

  roadmaps: page(`<div class="stage" style="justify-content:center">
    <div class="win" style="width:760px">
      <div class="bar">Lộ trình Backend Developer<span class="chip grey" style="margin-left:auto">2/4 khóa</span></div>
      <div style="padding:10px 0">
      ${[["Nhập môn Node.js", "done"], ["Thiết kế cơ sở dữ liệu quan hệ", "done"], ["Kiến trúc backend cho hệ thống thực tế", "now"], ["Go cơ bản", "next"]].map(([t, s], i, all) => `
        <div style="display:flex;gap:20px;padding:0 30px">
          <div style="display:flex;flex-direction:column;align-items:center">
            <span class="dot" style="width:34px;height:34px;${s === "done" ? "background:#18181b;color:#fff" : s === "now" ? "background:#ea580c;color:#fff" : "border:2px solid #d1d5db;color:#9ca3af"};font-size:15px;font-weight:700">${s === "done" ? check : i + 1}</span>
            ${i < all.length - 1 ? `<span style="flex:1;width:2px;min-height:34px;background:${s === "done" ? "#18181b" : "#e5e7eb"}"></span>` : ""}
          </div>
          <div style="padding:4px 0 26px;flex:1">
            <div style="font-size:21px;font-weight:${s === "now" ? 700 : 600};color:${s === "next" ? "#6b7280" : "#18181b"}">${t}</div>
            <div class="muted" style="margin-top:4px;font-size:16px">${s === "done" ? "Đã hoàn thành" : s === "now" ? "Đang học · bài 3/6" : "Mở khi xong khóa trước"}</div>
            ${s === "now" ? `<div class="track" style="margin-top:12px;width:300px"><div class="fill" style="width:50%"></div></div>` : ""}
          </div>
        </div>`).join("")}
      </div>
    </div></div>`),

  practice: page(`<div class="stage">
    <div class="win" style="flex:1.25;background:#27272a">
      <div class="bar" style="background:#fff"><span class="title">Vị trí chèn trong mảng</span><span class="chip orange">Trung bình</span><span class="mono faint" style="margin-left:auto;font-size:16px">Python</span></div>
      <pre class="mono" style="margin:0;padding:26px 28px;color:#f4f4f5;font-size:20px;line-height:1.75">${[
        "def search_insert(nums, target):",
        "    lo, hi = 0, len(nums)",
        "    while lo &lt; hi:",
        "        mid = (lo + hi) // 2",
        "        if nums[mid] &lt; target:",
        "            lo = mid + 1",
        "        else: hi = mid",
        "    return lo",
      ].map((l, i) => `<span style="color:#71717a;display:inline-block;width:34px">${i + 1}</span>${l}`).join("\n")}</pre>
    </div>
    <div class="win" style="flex:0.8;align-self:center">
      <div class="bar">Kết quả chạy test<span class="muted" style="margin-left:auto;font-size:16px;font-weight:500">3/3 đạt</span></div>
      ${["[1,3,5,6], 5", "[1,3,5,6], 7", "[ ], 3"].map((t) => `<div class="row"><span class="mono">${t}</span><span class="chip grey" style="margin-left:auto">Đạt</span></div>`).join("")}
      <div style="padding:18px 22px;font-size:17px" class="muted">Nộp bài để chấm bằng 12 test ẩn</div>
    </div></div>`),

  groups: page(`<div class="stage" style="justify-content:center">
    <div class="win" style="width:900px">
      <div class="bar">Nhóm Ôn tập Cấu trúc dữ liệu<span class="muted" style="margin-left:auto;font-size:16px;font-weight:500">24 thành viên</span></div>
      <div class="row muted" style="font-size:15px;font-weight:600;background:#f9fafb"><span style="flex:1">Bài được giao</span><span style="width:170px">Hạn nộp</span><span style="width:220px">Đã nộp</span></div>
      ${[["Ngăn xếp: kiểm tra ngoặc hợp lệ", "Hôm nay, 20:00", 18], ["BFS tìm đường đi ngắn nhất", "Thứ Sáu", 11], ["Dijkstra trên đồ thị trọng số", "Chủ Nhật", 4]].map(([t, d, n], i) => `
      <div class="row"><span style="flex:1;font-weight:600">${t}</span><span style="width:170px;color:${i === 0 ? "#c2410c" : "#374151"};font-size:16px;font-weight:${i === 0 ? 600 : 400}">${d}</span>
        <span style="width:220px;display:flex;align-items:center;gap:12px"><span class="track" style="flex:1"><span class="fill" style="display:block;width:${(n / 24) * 100}%"></span></span><span style="font-size:16px;font-weight:600">${n}/24</span></span></div>`).join("")}
      <div style="display:flex;padding:20px 22px;align-items:center">
        ${["AN", "MH", "TL", "QB", "HP"].map((a, i) => `<span class="dot" style="width:40px;height:40px;margin-left:${i ? -10 : 0}px;background:${["#18181b", "#3f3f46", "#52525b", "#71717a", "#a1a1aa"][i]};color:#fff;font-size:14px;font-weight:700;border:3px solid #fff">${a}</span>`).join("")}
        <span class="muted" style="margin-left:14px;font-size:16px">và 19 thành viên khác</span>
      </div>
    </div></div>`),

  assistant: page(`<div class="stage" style="justify-content:center">
    <div class="win" style="width:820px">
      <div class="bar">Trợ lý AI<span class="muted" style="margin-left:auto;font-size:16px;font-weight:500">Trả lời từ tài liệu khóa học</span></div>
      <div style="padding:26px;display:flex;flex-direction:column;gap:18px">
        <div style="align-self:flex-end;max-width:520px;background:#18181b;color:#fff;border-radius:16px 16px 4px 16px;padding:14px 18px;font-size:19px">Vì sao test 3 của em sai khi mảng rỗng?</div>
        <div style="max-width:620px;background:#f3f4f6;border-radius:16px 16px 16px 4px;padding:16px 20px;font-size:19px;line-height:1.55">Với mảng rỗng, <span class="mono" style="font-size:17px">hi = 0</span> nên vòng lặp không chạy và hàm trả về <span class="mono" style="font-size:17px">lo = 0</span>. Hãy kiểm tra lại giá trị bạn in ra ở cuối hàm.</div>
        <div style="display:flex;gap:10px"><span class="chip grey">Tìm kiếm nhị phân · Bài 3</span><span class="chip grey">Mảng và chỉ số</span></div>
      </div>
      <div style="margin:0 26px 26px;height:56px;border:1px solid #e5e7eb;border-radius:12px;display:flex;align-items:center;padding:0 18px" class="faint"><span style="font-size:17px">Hỏi tiếp về bài này…</span></div>
    </div></div>`),
};

const dir = mkdtempSync(join(tmpdir(), "program-thumbs-"));
for (const [name, html] of Object.entries(THUMBNAILS)) {
  const file = join(dir, `${name}.html`);
  writeFileSync(file, html);
  execFileSync(CHROME, [
    "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1280,720",
    "--virtual-time-budget=4000", `--screenshot=${OUT}${name}.png`, `file://${file}`,
  ], { stdio: "ignore" });
  console.log(`public/programs/${name}.png`);
}
