"use client";

import { useState } from "react";
import { Settings2, Target } from "lucide-react";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { Card } from "@/components/ui/card";
import { PersonalizationSettingsModal } from "./personalization-settings-modal";

export function WeeklyGoalCard({ completedHours }: { completedHours: number }) {
  const [open, setOpen] = useState(false);
  const preference = useLearningPreferenceStore((s) => s.preference);
  const targetHours = preference.weeklyStudyHours ?? 5;
  const percentage = Math.min(100, Math.round((completedHours / targetHours) * 100));
  const remainingHours = Math.max(0, targetHours - completedHours);
  const scheduledDays = Object.values(preference.weeklyStudySchedule).filter((session) => session.enabled).length;

  return (
    <>
      <Card className="p-4">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-navy">
            <Target className="h-4 w-4 text-primary" /> Mục tiêu tuần
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Thiết lập mục tiêu và lịch học"
            title="Thiết lập mục tiêu và lịch học"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:bg-bg hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(var(--color-primary) ${percentage}%, var(--color-border-soft) 0)` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-sm font-bold text-navy">
              {percentage}%
            </div>
          </div>
          <div>
            <div className="mb-1 text-lg font-bold text-navy">{completedHours} / {targetHours}h</div>
            <div className="text-xs text-text-muted">
              {remainingHours > 0 ? `Còn ${remainingHours}h để đạt mục tiêu tuần này` : "Bạn đã hoàn thành mục tiêu tuần này"}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-text-faint">
          {scheduledDays > 0 ? `Đã lên lịch ${scheduledDays} ngày${preference.remindersEnabled ? ` · nhắc lúc ${preference.reminderTime}` : ""}` : "Chưa lên lịch học trong tuần"}
        </p>
      </Card>
      {open && <PersonalizationSettingsModal open onClose={() => setOpen(false)} />}
    </>
  );
}
