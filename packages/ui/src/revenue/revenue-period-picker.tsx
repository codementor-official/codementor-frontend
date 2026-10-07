"use client";
import { useId, useState } from "react";
import type { RevenueDateRange, RevenueReport } from "@codementor/types";
import { CalendarDays } from "lucide-react";
import { Button } from "../button";

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RevenueDateRange>(
    range ?? { from: "", to: "" },
  );
  const [error, setError] = useState("");
  const custom = editing || !!range;
  const value = editing ? draft : (range ?? draft);
  const apply = () => {
    const parse = (day: string) => {
      const time = Date.parse(`${day}T00:00:00Z`);
      return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
        !day.startsWith("0000-") &&
        Number.isFinite(time) &&
        new Date(time).toISOString().slice(0, 10) === day
        ? time
        : NaN;
    };
    const from = parse(value.from),
      to = parse(value.to);
    if (!Number.isFinite(from) || !Number.isFinite(to))
      return setError("Chọn đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.");
    if (from > to)
      return setError("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
    if ((to - from) / 86400000 + 1 > 366)
      return setError("Chọn tối đa 366 ngày cho mỗi báo cáo.");
    setError("");
    setEditing(false);
    onRangeChange(value);
  };
  return (
    <div className="min-w-0 space-y-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Khoảng thời gian
        <select
          aria-label="Khoảng thời gian báo cáo"
          className="rounded-md border bg-background px-3 py-2 font-normal"
          value={custom ? "custom" : days}
          onChange={(event) => {
            setError("");
            if (event.target.value === "custom") {
              setDraft(
                range ?? { from: report?.from ?? "", to: report?.to ?? "" },
              );
              setEditing(true);
            } else {
              setEditing(false);
              onRangeChange(null);
              onDaysChange(Number(event.target.value));
            }
          }}
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
          <option value="custom">Chọn ngày tùy ý</option>
        </select>
      </label>
      {custom && (
        <div className="space-y-2">
          <form
            noValidate
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
          >
            {(["from", "to"] as const).map((key) => (
              <label
                key={key}
                className="flex min-w-0 flex-col gap-1.5 text-sm font-medium"
              >
                {key === "from" ? "Từ ngày" : "Đến ngày"}
                <input
                  type="date"
                  aria-label={
                    key === "from" ? "Từ ngày báo cáo" : "Đến ngày báo cáo"
                  }
                  aria-describedby={`${id}-hint`}
                  aria-invalid={!!error}
                  className="min-w-0 rounded-md border bg-background px-3 py-2 font-normal"
                  value={value[key]}
                  onChange={(event) => {
                    setDraft({ ...value, [key]: event.target.value });
                    setEditing(true);
                    setError("");
                  }}
                />
              </label>
            ))}
            <Button type="submit" variant="outline">
              <CalendarDays className="size-4" /> Áp dụng ngày
            </Button>
          </form>
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            Tính cả ngày bắt đầu và kết thúc, theo giờ Việt Nam. Tối đa 366
            ngày.
          </p>
          {editing && (
            <p className="text-xs text-muted-foreground">
              Bấm Áp dụng ngày để cập nhật báo cáo.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
