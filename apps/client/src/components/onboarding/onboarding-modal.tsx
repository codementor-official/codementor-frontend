"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onboardingSteps } from "@/data/onboarding-steps";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionGrid } from "./onboarding-option-grid";
import type { LearningPreference } from "@/types/learning-preference";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { fromAccountPreferences, toAccountPreferences } from "@/features/account/learning-preference-mapper";

function isFieldSatisfied(preference: LearningPreference, field: keyof LearningPreference, minSelect: number) {
  const value = preference[field];
  if (Array.isArray(value)) return value.length >= minSelect;
  return value !== null && value !== "";
}

export function OnboardingModal() {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const pathname = usePathname();
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    isModalOpen,
    currentStep,
    preference,
    hasCompletedOnboarding,
    hasSkippedOnboarding,
    hasHydrated,
    setUser,
    openModal,
    goNext,
    goBack,
    toggleMultiValue,
    setSingleValue,
    completeOnboarding,
    hydratePreferenceFromServer,
    skipOnboarding,
  } = useLearningPreferenceStore();

  // Local state is account-scoped, but the database decides survey completion.
  // A failed check must not be interpreted as an incomplete survey.
  useEffect(() => {
    if (!hasHydrated || status === "loading") return;
    setUser(status === "authenticated" ? userId : null);
    if (status !== "authenticated" || !userId) return;
    const revision = useLearningPreferenceStore.getState().preferenceRevision;
    let active = true;
    api.account.preferences()
      .then((stored) => {
        if (!active) return;
        // A profile save/load may have finished while this request was pending.
        // Never replace newer preferences with the earlier response.
        if (useLearningPreferenceStore.getState().preferenceRevision === revision) {
          hydratePreferenceFromServer(fromAccountPreferences(stored), Boolean(stored.completedAt));
        }
        setCheckedUserId(userId);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [hasHydrated, hydratePreferenceFromServer, setUser, status, userId]);

  useEffect(() => {
    if (status === "authenticated" && userId && checkedUserId === userId && pathname !== "/profile" && !hasCompletedOnboarding && !hasSkippedOnboarding) openModal();
  }, [checkedUserId, hasCompletedOnboarding, hasSkippedOnboarding, openModal, pathname, status, userId]);

  if (!isModalOpen || hasCompletedOnboarding || status !== "authenticated" || checkedUserId !== userId || pathname === "/profile") return null;

  const totalSteps = onboardingSteps.length;
  const stepConfig = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === totalSteps;
  const isStepValid = stepConfig.fields.every((f) => isFieldSatisfied(preference, f.field, f.minSelect));

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.account.updatePreferences(toAccountPreferences(preference));
      hydratePreferenceFromServer(fromAccountPreferences(updated), Boolean(updated.completedAt));
      completeOnboarding();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu cấu hình cá nhân hóa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-overlay-in fixed inset-0 z-150 flex items-start justify-center overflow-y-auto bg-ink-fixed/55 p-6">
      <div className="animate-modal-in my-auto w-full max-w-xl rounded-xl bg-surface p-6 shadow-modal sm:p-9">
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

        {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>}

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
            disabled={!isStepValid || saving}
            onClick={isLastStep ? () => void finish() : goNext}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-on-ink hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastStep ? saving ? "Đang lưu…" : "Hoàn tất & xem lộ trình →" : "Tiếp tục →"}
          </button>
        </div>
      </div>
    </div>
  );
}
