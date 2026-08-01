import { Check } from "lucide-react";

export function OnboardingProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center">
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done || active ? "bg-primary text-white" : "bg-border-soft text-text-faint"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              {n < total && (
                <div className={`mx-1.5 h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs font-medium text-text-faint">
        Bước {current} / {total} · Cá nhân hóa trải nghiệm học của bạn
      </div>
    </div>
  );
}
