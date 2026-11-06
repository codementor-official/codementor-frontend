import type { ReportBucket } from "@codementor/types";

export type Preset = "this-month" | "last-month" | "this-quarter" | "last-quarter" | "this-year" | "last-year" | "custom";

export const PRESETS: { value: Preset; label: string; bucket: ReportBucket }[] = [
  { value: "this-month", label: "Tháng này", bucket: "day" },
  { value: "last-month", label: "Tháng trước", bucket: "day" },
  { value: "this-quarter", label: "Quý này", bucket: "month" },
  { value: "last-quarter", label: "Quý trước", bucket: "month" },
  { value: "this-year", label: "Năm nay", bucket: "month" },
  { value: "last-year", label: "Năm trước", bucket: "quarter" },
  { value: "custom", label: "Tuỳ chọn khoảng ngày", bucket: "month" },
];

/** Today's date in Vietnam (UTC+7), as YYYY-MM-DD. */
export const vietnamToday = (now = new Date()) => new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

/** First and last day of a preset period containing `today`; Date.UTC rolls month 0/-1 into the year before. */
export function presetRange(preset: Exclude<Preset, "custom">, today: string): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const month = m - 1;
  const q = Math.floor(month / 3) * 3;
  switch (preset) {
    case "this-month": return { from: iso(y, month, 1), to: iso(y, month + 1, 0) };
    case "last-month": return { from: iso(y, month - 1, 1), to: iso(y, month, 0) };
    case "this-quarter": return { from: iso(y, q, 1), to: iso(y, q + 3, 0) };
    case "last-quarter": return { from: iso(y, q - 3, 1), to: iso(y, q, 0) };
    case "this-year": return { from: iso(y, 0, 1), to: iso(y, 12, 0) };
    case "last-year": return { from: iso(y - 1, 0, 1), to: iso(y - 1, 12, 0) };
  }
}
