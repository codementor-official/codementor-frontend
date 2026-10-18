"use client";

import { useEffect, useState } from "react";

/** Hộp thư nhận kháng cáo khi tài khoản bị khoá. */
export const APPEAL_EMAIL = "codementor.official@gmail.com";

/** Mã backend/BFF trả khi tài khoản đang bị khoá — frontend dựa vào nó để đăng xuất và báo. */
export const ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED";

/** "1 ngày 02:03:04" / "02:03:04" — thời gian còn lại tới lúc mở khoá; 0 khi đã tới hạn. */
export function formatSuspensionLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const clock = [Math.floor((total % 86400) / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days} ngày ${clock}` : clock;
}

const endFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Thông báo đỏ cho tài khoản bị tạm khoá: bị khoá vì sao, khi nào mở lại và cách
 * kháng cáo. `until`: ISO lúc mở khoá; `null` = khoá không thời hạn; bỏ trống = chưa biết.
 */
export function AccountSuspendedNotice({
  until,
  reason,
  className = "",
}: {
  until?: string | null;
  /** Lý do admin ghi khi khoá (kèm loại vi phạm nếu khoá từ báo cáo). */
  reason?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!until) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [until]);

  const end = until ? new Date(until) : null;
  return (
    <div
      role="alert"
      className={`rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive ${className}`}
    >
      <p className="font-semibold">Tài khoản của bạn đang bị tạm khoá.</p>
      {reason && (
        <p className="mt-1">
          <span className="font-semibold">Lý do:</span> <span className="whitespace-pre-wrap">{reason}</span>
        </p>
      )}
      {end && (
        <p className="mt-1">
          Tự mở lại sau{" "}
          <span className="font-mono font-semibold tabular-nums">
            {now === null ? "…" : formatSuspensionLeft(end.getTime() - now)}
          </span>{" "}
          (lúc {endFormat.format(end)}).
        </p>
      )}
      {until === null && <p className="mt-1">Khoá không thời hạn — chỉ mở lại khi quản trị viên xem xét.</p>}
      <p className="mt-1 leading-relaxed">
        {reason ? "" : "Tài khoản bị khoá do nội dung vi phạm quy định của CodeMentor. "}Nếu bạn cho rằng đây là
        nhầm lẫn và muốn kháng cáo, hãy liên hệ{" "}
        <a href={`mailto:${APPEAL_EMAIL}`} className="font-semibold underline underline-offset-2">
          {APPEAL_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
