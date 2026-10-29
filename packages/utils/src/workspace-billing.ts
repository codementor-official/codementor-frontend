/** Display helpers for Workspace plans, shared by the client and admin apps. */

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Binary units, Vietnamese decimal comma: 1,5 GB. */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",").replace(/,0$/, "");
  return `${text} ${UNITS[unit]}`;
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

/** A finite limit as a number, `null` as the fair-use label. */
export function formatLimit(value: number | null, unlimited = "Không giới hạn"): string {
  return value === null ? unlimited : new Intl.NumberFormat("vi-VN").format(value);
}

/** Share of a limit used, 0–100. Unlimited and zero limits never look full by accident. */
export function usagePercent(used: number, limit: number | null): number {
  if (limit === null) return 0;
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/** Monthly equivalent of an annual price, and what it saves against twelve monthly payments. */
export function annualSaving(monthly: number, annual: number | null): { perMonth: number; percent: number } | null {
  if (annual === null || monthly <= 0) return null;
  const full = monthly * 12;
  return { perMonth: Math.floor(annual / 12), percent: Math.max(0, Math.round(((full - annual) / full) * 100)) };
}

/** Dates in Vietnam time, whatever the browser's zone. */
export function formatVnDate(iso: string | Date, withTime = false): string {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** GiB/MiB input in admin forms ↔ bytes stored by the API. */
export const BYTE_UNITS = { MB: 1024 ** 2, GB: 1024 ** 3 } as const;
export function toBytes(value: number, unit: keyof typeof BYTE_UNITS): number {
  return Math.round(value * BYTE_UNITS[unit]);
}
export function fromBytes(bytes: number): { value: number; unit: keyof typeof BYTE_UNITS } {
  return bytes >= BYTE_UNITS.GB && bytes % BYTE_UNITS.MB === 0 && (bytes / BYTE_UNITS.GB) % 0.5 === 0
    ? { value: bytes / BYTE_UNITS.GB, unit: "GB" }
    : { value: Math.round((bytes / BYTE_UNITS.MB) * 100) / 100, unit: "MB" };
}
