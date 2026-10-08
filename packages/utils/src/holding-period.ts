/** Display the exact snapshot duration; never round minutes up to a day. */
export function formatHoldingPeriod(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0) return "Chưa xác định";
  if (minutes === 0) return "Không giữ theo thời gian";
  return minutes % 1440 === 0
    ? `${(minutes / 1440).toLocaleString("vi-VN")} ngày`
    : `${minutes.toLocaleString("vi-VN")} phút`;
}
