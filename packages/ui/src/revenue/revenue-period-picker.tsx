"use client";
import { useId, useState } from "react";
import type { RevenueDateRange, RevenueReport } from "@codementor/types";
import { CalendarDays } from "lucide-react";
import { Button } from "../button";
import { Modal } from "../modal";
import { revenueDate } from "./format";

/** Câu lỗi cho một khoảng ngày, hoặc `null` nếu dùng được. Tính cả hai đầu, tối đa 366 ngày. */
export function rangeError(range: RevenueDateRange): string | null {
  const parse = (day: string) => {
    const time = Date.parse(`${day}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      !day.startsWith("0000-") &&
      Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === day
      ? time
      : NaN;
  };
  const from = parse(range.from);
  const to = parse(range.to);
  if (!Number.isFinite(from) || !Number.isFinite(to))
    return "Chọn đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.";
  if (from > to) return "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
  if ((to - from) / 86400000 + 1 > 366) return "Chọn tối đa 366 ngày cho mỗi báo cáo.";
  return null;
}

/**
 * Chọn kỳ báo cáo. Trên thanh công cụ chỉ có MỘT ô chọn cao bằng các ô bên cạnh; khoảng ngày
 * tùy ý được nhập trong modal. Trước đây hai ô ngày, nút áp dụng và hai dòng gợi ý chen thẳng
 * vào thanh công cụ, làm cột này cao gấp ba và đẩy các control khác lệch hàng.
 */
export function RevenuePeriodPicker({
  days,
  range,
  report,
  onDaysChange,
  onRangeChange,
}: {
  days: number;
  range: RevenueDateRange | null;
  report: RevenueReport | null;
  onDaysChange: (days: number) => void;
  onRangeChange: (range: RevenueDateRange | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RevenueDateRange>({ from: "", to: "" });
  const [error, setError] = useState("");

  const openEditor = () => {
    setDraft(range ?? { from: report?.from ?? "", to: report?.to ?? "" });
    setError("");
    setOpen(true);
  };
  const apply = () => {
    const problem = rangeError(draft);
    if (problem) return setError(problem);
    setOpen(false);
    onRangeChange(draft);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
      <label htmlFor={`${id}-period`}>Khoảng thời gian</label>
      <div className="flex min-w-0 gap-2">
        <select
          id={`${id}-period`}
          aria-label="Khoảng thời gian báo cáo"
          className="min-w-0 rounded-md border bg-background px-3 py-2 font-normal"
          value={range ? "custom" : days}
          onChange={(event) => {
            if (event.target.value === "custom") return openEditor();
            onRangeChange(null);
            onDaysChange(Number(event.target.value));
          }}
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
          <option value="custom">
            {range ? `${revenueDate(range.from)} – ${revenueDate(range.to)}` : "Chọn ngày tùy ý…"}
          </option>
        </select>
        {range && (
          // Ô chọn đã ở "custom" thì chọn lại mục đó không phát sự kiện — cần một nút để đổi ngày.
          <Button type="button" variant="outline" aria-label="Đổi khoảng ngày" title="Đổi khoảng ngày" onClick={openEditor}>
            <CalendarDays className="size-4" />
          </Button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Chọn khoảng ngày"
        description="Tính cả ngày bắt đầu và ngày kết thúc, theo giờ Việt Nam. Tối đa 366 ngày."
        width="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form={`${id}-range`}>
              <CalendarDays className="size-4" /> Áp dụng
            </Button>
          </>
        }
      >
        <form
          id={`${id}-range`}
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          {(["from", "to"] as const).map((key) => (
            <label key={key} className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
              {key === "from" ? "Từ ngày" : "Đến ngày"}
              <input
                type="date"
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className="min-w-0 rounded-md border bg-background px-3 py-2 font-normal"
                value={draft[key]}
                max={key === "from" ? draft.to || undefined : undefined}
                min={key === "to" ? draft.from || undefined : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, [key]: event.target.value });
                  setError("");
                }}
              />
            </label>
          ))}
          {error && (
            <p id={`${id}-error`} role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
