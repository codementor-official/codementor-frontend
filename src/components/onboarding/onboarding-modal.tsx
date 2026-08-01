"use client";

import Image from "next/image";
import { useEffect } from "react";
import { onboardingSteps } from "@/data/onboarding-steps";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionGrid } from "./onboarding-option-grid";
import type { LearningPreference } from "@/types/learning-preference";

function isFieldSatisfied(preference: LearningPreference, field: keyof LearningPreference, minSelect: number) {
  const value = preference[field];
  if (Array.isArray(value)) return value.length >= minSelect;
  return value !== null && value !== "";
}

export function OnboardingModal() {
  const {
    isModalOpen,
    currentStep,
    preference,
    hasCompletedOnboarding,
    hasSkippedOnboarding,
    hasHydrated,
    openModal,
    goNext,
    goBack,
    toggleMultiValue,
    setSingleValue,
    completeOnboarding,
    skipOnboarding,
  } = useLearningPreferenceStore();

  // Auto-open once per app load for a user who hasn't completed or skipped
  // the survey yet — mirrors the mockup opening this right after signup.
  // Gated on hasHydrated so this doesn't fire on the pre-rehydration default
  // state and incorrectly reopen the modal for a returning user.
  useEffect(() => {
    if (hasHydrated && !hasCompletedOnboarding && !hasSkippedOnboarding) openModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  if (!isModalOpen) return null;

  const totalSteps = onboardingSteps.length;
  const stepConfig = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === totalSteps;
  const isStepValid = stepConfig.fields.every((f) => isFieldSatisfied(preference, f.field, f.minSelect));

  return (
    <div className="fixed inset-0 z-150 flex items-start justify-center overflow-y-auto bg-navy/55 p-6">
      <div className="my-auto w-full max-w-xl rounded-xl bg-surface p-6 shadow-modal sm:p-9">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Image src="/logo.png" alt="CodeMentor" width={460} height={159} className="h-8 w-auto" />
          <button
            type="button"
            onClick={skipOnboarding}
            className="text-xs font-medium text-text-muted hover:text-navy"
          >
            Bỏ qua &amp; thiết lập sau
          </button>
        </div>

        <OnboardingProgress current={currentStep} total={totalSteps} />

        <h1 className="mb-2 text-xl font-bold text-navy sm:text-2xl">{stepConfig.title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-text-muted">{stepConfig.subtitle}</p>

        {stepConfig.fields.map((fieldConfig) => (
          <OnboardingOptionGrid
            key={fieldConfig.field}
            config={fieldConfig}
            selectedValues={
              Array.isArray(preference[fieldConfig.field])
                ? (preference[fieldConfig.field] as string[])
                : preference[fieldConfig.field] != null
                  ? [String(preference[fieldConfig.field])]
                  : []
            }
            onToggle={(value) =>
              fieldConfig.selectionType === "multi"
                ? toggleMultiValue(fieldConfig.field, value)
                : setSingleValue(fieldConfig.field, value)
            }
          />
        ))}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-bg"
            >
              ← Quay lại
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!isStepValid}
            onClick={isLastStep ? completeOnboarding : goNext}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastStep ? "Hoàn tất & xem lộ trình →" : "Tiếp tục →"}
          </button>
        </div>
      </div>
    </div>
  );
}
