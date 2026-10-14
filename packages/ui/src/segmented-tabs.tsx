"use client";

export interface SegmentedTabOption {
  value: string;
  label: string;
  count?: number;
}

export function SegmentedTabs({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      // Hết chỗ thì cả NÚT xuống hàng, không cuộn ngang (AGENTS.md, luật 4): cuộn ngang
      // giấu mất tab cuối trên điện thoại ("Yêu cầu r…" ở trang Doanh thu). `shrink-0` +
      // `whitespace-nowrap` ở từng nút giữ nhãn không bị bẻ giữa từ ("Thông\ntin").
      className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            // `min-w-[6.5rem]` + căn giữa: nhãn ngắn ("Xin gỡ") và nhãn dài ("Đã từ chối")
            // chiếm cùng một ô, nên bấm qua lại không làm các tab bên cạnh xê dịch.
            className={`inline-flex h-9 min-w-[6.5rem] shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
            {/* Badge chỉ hiện khi CÓ việc, nhưng chỗ của nó thì luôn được giữ bằng
              * `min-w` ở nút — số 3 xuất hiện rồi biến mất không được kéo tab đi theo. */}
            {typeof opt.count === "number" && opt.count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
