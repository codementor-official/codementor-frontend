"use client";

import { Check } from "lucide-react";
import type { OnboardingFieldConfig } from "@/data/onboarding-steps";

export function OnboardingOptionGrid({
  config,
  selectedValues,
  onToggle,
}: {
  config: OnboardingFieldConfig;
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2.5 text-xs font-semibold text-text-muted">
        {config.groupLabel}
        {config.selectionType === "multi" && (
          <span className="ml-1 font-normal text-text-faint">— chọn một hoặc nhiều</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {config.options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                selected ? "border-primary bg-primary-tint" : "border-border bg-surface hover:border-navy"
              }`}
            >
              <option.icon className={`h-5 w-5 shrink-0 ${selected ? "text-primary" : "text-text-faint"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${selected ? "text-primary" : "text-navy"}`}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs text-text-faint">{option.description}</span>
                )}
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
