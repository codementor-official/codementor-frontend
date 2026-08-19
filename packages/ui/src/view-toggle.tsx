import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "table" | "grid";

/** Bảng/lưới cho cùng một danh sách — dùng trong `ManagePage`, xem prop `view`. */
export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-md border bg-background p-0.5">
      {(
        [
          { mode: "table" as const, icon: List, label: "Dạng danh sách" },
          { mode: "grid" as const, icon: LayoutGrid, label: "Dạng lưới" },
        ] satisfies { mode: ViewMode; icon: typeof List; label: string }[]
      ).map(({ mode: optionMode, icon: Icon, label }) => (
        <button
          aria-label={label}
          aria-pressed={mode === optionMode}
          className={`inline-flex h-8 items-center justify-center rounded px-2.5 transition-colors ${
            mode === optionMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          key={optionMode}
          onClick={() => onChange(optionMode)}
          type="button"
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
  );
}
