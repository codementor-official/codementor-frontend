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
      // `max-w-full` + cuộn ngang thay vì để các nút co lại: bốn tab trên màn điện thoại
      // bị bóp tới mức nhãn xuống dòng giữa từ ("Thông\ntin"), khó đọc hơn hẳn so với
      // việc vuốt ngang. `shrink-0` ở từng nút bên dưới là nửa còn lại của cách này.
      className={`inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-card p-1 ${className}`}
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
              active ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
            {/* Badge chỉ hiện khi CÓ việc, nhưng chỗ của nó thì luôn được giữ bằng
              * `min-w` ở nút — số 3 xuất hiện rồi biến mất không được kéo tab đi theo. */}
            {typeof opt.count === "number" && opt.count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-background/20 text-primary-foreground" : "bg-muted text-muted-foreground"
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
