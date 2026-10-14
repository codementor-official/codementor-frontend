/**
 * Self-check for paged CSV collection. Run with `pnpm test csv-pages`.
 */
import assert from "node:assert/strict";
import { collectAllPages, csvCell, csvDateTime } from "./csv";

const data = Array.from({ length: 45 }, (_, i) => i);
const pages: number[] = [];
const load = async (page: number) => {
  pages.push(page);
  return { items: data.slice((page - 1) * 20, page * 20), total: data.length, limit: 20 };
};

(async () => {
  const all = await collectAllPages(load);
  assert.deepEqual(all, { items: data, total: 45, truncated: false });
  assert.deepEqual(pages, [1, 2, 3]);

  const capped = await collectAllPages(load, 30);
  assert.equal(capped.items.length, 30);
  assert.equal(capped.truncated, true);

  // An empty list stops after one request.
  pages.length = 0;
  assert.deepEqual(await collectAllPages(async (page) => (pages.push(page), { items: [], total: 0, limit: 20 })), {
    items: [],
    total: 0,
    truncated: false,
  });
  assert.deepEqual(pages, [1]);

  // Cells: raw numbers, quoted commas, neutralised formulas, Vietnam-time timestamps.
  assert.equal(csvCell(1_799_000), "1799000");
  assert.equal(csvCell("Nguyễn, A"), '"Nguyễn, A"');
  assert.equal(csvCell("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(csvCell(-5), "-5");
  assert.equal(csvDateTime("2026-10-14T17:30:00Z"), "2026-10-15 00:30");
  assert.equal(csvDateTime("not a date"), "");

  console.log("csv-pages: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
