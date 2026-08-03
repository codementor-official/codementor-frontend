"use client";

import Image from "next/image";
import { useState } from "react";
import { Bell, Settings2 } from "lucide-react";
import { onboardingSteps } from "@/data/onboarding-steps";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { Button } from "@/components/ui/button";
import { OnboardingOptionGrid } from "@/components/onboarding/onboarding-option-grid";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  DEFAULT_WEEKLY_STUDY_SCHEDULE,
  STUDY_DAYS,
  type LearningPreference,
  type StudyDay,
  type WeeklyStudySchedule,
} from "@/types/learning-preference";

const SCHEDULE_STEP = onboardingSteps.length + 1;

function cloneSchedule(schedule?: WeeklyStudySchedule): WeeklyStudySchedule {
  const source = schedule ?? DEFAULT_WEEKLY_STUDY_SCHEDULE;
  return Object.fromEntries(
    STUDY_DAYS.map((day) => [day.key, { ...source[day.key] }]),
  ) as WeeklyStudySchedule;
}

function clonePreference(preference: LearningPreference): LearningPreference {
  return {
    ...preference,
    interestedFields: [...preference.interestedFields],
    interestedTechnologies: [...preference.interestedTechnologies],
    preferredLearningStyle: [...preference.preferredLearningStyle],
    weeklyStudySchedule: cloneSchedule(preference.weeklyStudySchedule),
  };
}

function isFieldSatisfied(preference: LearningPreference, field: keyof LearningPreference, minSelect: number) {
  const value = preference[field];
  if (Array.isArray(value)) return value.length >= minSelect;
  return value !== null && value !== "";
}

/**
 * Edit mode deliberately reuses the sign-up wizard's cards, copy and progress treatment.
 * The final step only adds the settings that are meaningful after a weekly time goal exists.
 */
export function PersonalizationSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const preference = useLearningPreferenceStore((state) => state.preference);
  const savePreferenceSettings = useLearningPreferenceStore((state) => state.savePreferenceSettings);
  const [draft, setDraft] = useState<LearningPreference>(() => clonePreference(preference));
  const [currentStep, setCurrentStep] = useState(1);

  if (!open) return null;

  const isScheduleStep = currentStep === SCHEDULE_STEP;
  const stepConfig = onboardingSteps[currentStep - 1];
  const isStepValid = isScheduleStep
    ? draft.weeklyStudySchedule && STUDY_DAYS.some((day) => draft.weeklyStudySchedule[day.key].enabled)
    : stepConfig.fields.every((field) => isFieldSatisfied(draft, field.field, field.minSelect));

  const toggleOption = (field: keyof LearningPreference, selectionType: "single" | "multi", value: string) => {
    setDraft((current) => {
      if (selectionType === "multi") {
        const values = current[field] as string[];
        return {
          ...current,
          [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
        } as LearningPreference;
      }

      return {
        ...current,
        [field]: field === "weeklyStudyHours" ? Number(value) : value,
      } as LearningPreference;
    });
  };

  const updateSchedule = (day: StudyDay, patch: Partial<WeeklyStudySchedule[StudyDay]>) => {
    setDraft((current) => ({
      ...current,
      weeklyStudySchedule: {
        ...current.weeklyStudySchedule,
        [day]: { ...current.weeklyStudySchedule[day], ...patch },
      },
    }));
  };

  const finish = () => {
    savePreferenceSettings({ ...draft, weeklyStudySchedule: cloneSchedule(draft.weeklyStudySchedule) });
    onClose();
  };

  const title = isScheduleStep ? "Bạn muốn duy trì nhịp học thế nào?" : stepConfig.title;
  const subtitle = isScheduleStep
    ? "Thiết lập khung giờ theo mục tiêu bạn vừa chọn. Bạn vẫn có thể thay đổi bất cứ lúc nào ở Mục tiêu tuần."
    : stepConfig.subtitle;

  return (
    <div className="fixed inset-0 z-150 flex items-start justify-center overflow-y-auto bg-navy/55 p-4 sm:p-6">
      <div className="my-auto w-full max-w-xl rounded-xl bg-surface p-6 shadow-modal sm:p-9">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Image src="/logo.png" alt="CodeMentor" width={460} height={159} className="h-8 w-auto" />
          <button type="button" onClick={onClose} className="text-xs font-medium text-text-muted hover:text-navy">
            Đóng, không lưu
          </button>
        </div>

        <OnboardingProgress current={currentStep} total={SCHEDULE_STEP} />
        <h2 className="mb-2 text-xl font-bold text-navy sm:text-2xl">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-text-muted">{subtitle}</p>

        {isScheduleStep ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/25 bg-primary-tint px-4 py-3 text-sm text-navy">
              Mục tiêu hiện tại: <strong>{draft.weeklyStudyHours} giờ mỗi tuần</strong>. Chọn ít nhất một ngày để bắt đầu.
            </div>
            <div className="space-y-2.5">
              {STUDY_DAYS.map((day) => {
                const session = draft.weeklyStudySchedule[day.key];
                return (
                  <label
                    key={day.key}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3.5 transition-colors ${
                      session.enabled ? "border-primary bg-primary-tint" : "border-border hover:border-navy"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={session.enabled}
                      onChange={() => updateSchedule(day.key, { enabled: !session.enabled })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="min-w-20 flex-1 text-sm font-semibold text-navy">{day.label}</span>
                    <input
                      aria-label={`Giờ học ${day.label}`}
                      type="time"
                      disabled={!session.enabled}
                      value={session.startTime}
                      onChange={(event) => updateSchedule(day.key, { startTime: event.target.value })}
                      className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy outline-none focus:border-primary disabled:bg-bg"
                    />
                    <select
                      aria-label={`Thời lượng học ${day.label}`}
                      disabled={!session.enabled}
                      value={session.durationMinutes}
                      onChange={(event) => updateSchedule(day.key, { durationMinutes: Number(event.target.value) })}
                      className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy outline-none focus:border-primary disabled:bg-bg"
                    >
                      {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}
                    </select>
                  </label>
                );
              })}
            </div>

            <div className="rounded-lg border border-border p-3.5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.remindersEnabled}
                  onChange={() => setDraft((current) => ({ ...current, remindersEnabled: !current.remindersEnabled }))}
                  className="h-4 w-4 accent-primary"
                />
                <Bell className="h-5 w-5 text-primary" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-navy">Nhắc học theo lịch</span>
                  <span className="block text-xs text-text-faint">Nhận lời nhắc trước phiên học đã lên lịch.</span>
                </span>
              </label>
              {draft.remindersEnabled && (
                <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3 text-xs font-medium text-text-muted">
                  <span>Gửi lời nhắc lúc</span>
                  <input
                    aria-label="Giờ nhắc học"
                    type="time"
                    value={draft.reminderTime}
                    onChange={(event) => setDraft((current) => ({ ...current, reminderTime: event.target.value }))}
                    className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          stepConfig.fields.map((fieldConfig) => (
            <OnboardingOptionGrid
              key={fieldConfig.field}
              config={fieldConfig}
              selectedValues={
                Array.isArray(draft[fieldConfig.field])
                  ? (draft[fieldConfig.field] as string[])
                  : draft[fieldConfig.field] != null
                    ? [String(draft[fieldConfig.field])]
                    : []
              }
              onToggle={(value) => toggleOption(fieldConfig.field, fieldConfig.selectionType, value)}
            />
          ))
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          {currentStep > 1 ? (
            <button type="button" onClick={() => setCurrentStep((step) => step - 1)} className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-bg">
              ← Quay lại
            </button>
          ) : <span />}
          <button
            type="button"
            disabled={!isStepValid}
            onClick={isScheduleStep ? finish : () => setCurrentStep((step) => step + 1)}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-on-ink hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScheduleStep ? "Lưu thiết lập →" : "Tiếp tục →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonalizationSettingsTrigger({
  label = "Thiết lập gợi ý cá nhân hóa",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className={className}>
        <Settings2 className="h-3.5 w-3.5" /> {label}
      </Button>
      {open && <PersonalizationSettingsModal open onClose={() => setOpen(false)} />}
    </>
  );
}
