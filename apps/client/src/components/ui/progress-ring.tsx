import { CheckIcon as Check } from "@phosphor-icons/react/ssr";

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Vòng tiến độ có nhãn bên phải. Đủ 100% thì vòng xanh kèm dấu tick, nhãn "Đã hoàn thành". */
export function ProgressRing({ value }: { value: number }) {
  const percent = Math.round(Math.max(0, Math.min(100, value)));
  const done = percent >= 100;
  return (
    <span
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={done ? "Đã hoàn thành" : `Tiến độ ${percent}%`}
      className="inline-flex items-center gap-2.5"
    >
      <span className="relative size-9 shrink-0">
        <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="3" className="stroke-border-soft" />
          <circle
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            className={`transition-[stroke-dashoffset] duration-500 ${done ? "stroke-success" : "stroke-primary"}`}
          />
        </svg>
        {done && (
          <Check aria-hidden="true" weight="bold" className="absolute inset-0 m-auto size-4 text-success" />
        )}
      </span>
      {done ? (
        <span className="text-sm font-semibold text-success">Đã hoàn thành</span>
      ) : (
        <span className="flex items-baseline gap-1">
          <span className="text-base font-bold text-navy tabular-nums">{percent}%</span>
          <span className="text-xs text-text-faint">tiến độ</span>
        </span>
      )}
    </span>
  );
}
