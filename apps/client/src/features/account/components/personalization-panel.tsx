"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BrainCircuit, CalendarDays, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { onboardingSteps } from "@/data/onboarding-steps";
import type { UserLearningPreferences } from "@/features/account/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@codementor/ui";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { fromAccountPreferences } from "@/features/account/learning-preference-mapper";

const DAY_LABELS: Record<UserLearningPreferences["schedule"][number]["weekday"], string> = {
  mon: "Thứ 2", tue: "Thứ 3", wed: "Thứ 4", thu: "Thứ 5", fri: "Thứ 6", sat: "Thứ 7", sun: "Chủ nhật",
};

type EditableField = "learningGoal" | "careerGoal" | "currentLevel" | "contentPriority" | "weeklyStudyHours" | "interestedFields" | "interestedTechnologies" | "preferredLearningStyle";
const MULTI_FIELDS = new Set<EditableField>(["interestedFields", "interestedTechnologies", "preferredLearningStyle"]);

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-[left] ${checked ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

export function PersonalizationPanel() {
  const toast = useToast();
  const saveLocalPreference = useLearningPreferenceStore((state) => state.savePreferenceSettings);
  const hydrateLocalPreference = useLearningPreferenceStore((state) => state.hydratePreferenceFromServer);
  const [saved, setSaved] = useState<UserLearningPreferences | null>(null);
  const [draft, setDraft] = useState<UserLearningPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.account.preferences()
      .then((preferences) => { if (active) { setSaved(preferences); setDraft(preferences); hydrateLocalPreference(fromAccountPreferences(preferences), Boolean(preferences.completedAt)); } })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Không thể tải cấu hình cá nhân hóa."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [hydrateLocalPreference]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [draft, saved]);
  const valid = Boolean(
    draft?.learningGoal && draft.careerGoal && draft.currentLevel && draft.contentPriority && draft.weeklyStudyHours &&
    draft.interestedFields.length && draft.interestedTechnologies.length && draft.preferredLearningStyle.length,
  );

  function choose(field: EditableField, rawValue: string) {
    setDraft((current) => {
      if (!current) return current;
      if (MULTI_FIELDS.has(field)) {
        const values = current[field] as string[];
        return { ...current, [field]: values.includes(rawValue) ? values.filter((value) => value !== rawValue) : [...values, rawValue] };
      }
      return { ...current, [field]: field === "weeklyStudyHours" ? Number(rawValue) : rawValue };
    });
  }

  function updateSchedule(index: number, patch: Partial<UserLearningPreferences["schedule"][number]>) {
    setDraft((current) => current ? { ...current, schedule: current.schedule.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot) } : current);
  }

  async function save() {
    if (!draft || !dirty || !valid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.account.updatePreferences(draft);
      setSaved(updated);
      setDraft(updated);
      saveLocalPreference(fromAccountPreferences(updated));
      toast.success("Đã lưu cấu hình cá nhân hóa.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu cấu hình cá nhân hóa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-bg" />)}</div>;
  if (!draft) return <Card className="p-6 text-sm text-danger">{error ?? "Không có dữ liệu cá nhân hóa."}</Card>;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/25 bg-primary-tint px-4 py-3 text-sm leading-relaxed text-navy">
        <strong>Giai đoạn hiện tại chỉ lưu lựa chọn.</strong> Dữ liệu này chưa tự đề xuất khóa học, tạo lộ trình hoặc gọi AI.
      </div>
      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      {onboardingSteps.map((step) => (
        <Card key={step.step} className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">{step.step}</span>
            <div><h2 className="text-base font-bold text-navy">{step.title}</h2><p className="mt-1 text-xs text-text-faint">{step.subtitle}</p></div>
          </div>
          <div className="space-y-5">
            {step.fields.map((field) => {
              const key = field.field as EditableField;
              const current = draft[key];
              const selected = Array.isArray(current) ? current : current == null ? [] : [String(current)];
              return (
                <section key={key}>
                  <h3 className="mb-2 text-xs font-semibold text-text-muted">{field.groupLabel}</h3>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const active = selected.includes(option.value);
                      const Icon = option.icon;
                      return (
                        <button key={option.value} type="button" onClick={() => choose(key, option.value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${active ? "border-primary bg-primary-tint text-primary" : "border-border bg-surface text-text-muted hover:bg-bg hover:text-navy"}`}>
                          <Icon className="h-3.5 w-3.5" /> {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </Card>
      ))}

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy"><CalendarDays className="h-4 w-4 text-primary" /> Lịch học trong tuần</h2>
        <p className="mt-1 text-xs text-text-faint">Lịch được lưu thành từng khung giờ để có thể dùng cho nhắc học trong tương lai.</p>
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {draft.schedule.map((slot, index) => (
            <div key={slot.weekday} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${slot.enabled ? "border-primary/30 bg-primary-tint" : "border-border"}`}>
              <label className="flex min-w-24 flex-1 items-center gap-2 text-sm font-semibold text-navy">
                <input type="checkbox" checked={slot.enabled} onChange={() => updateSchedule(index, { enabled: !slot.enabled })} className="h-4 w-4 accent-primary" />
                {DAY_LABELS[slot.weekday]}
              </label>
              <input aria-label={`Giờ học ${DAY_LABELS[slot.weekday]}`} type="time" disabled={!slot.enabled} value={slot.startTime} onChange={(event) => updateSchedule(index, { startTime: event.target.value })} className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy disabled:bg-bg" />
              <select aria-label={`Thời lượng ${DAY_LABELS[slot.weekday]}`} disabled={!slot.enabled} value={slot.durationMinutes} onChange={(event) => updateSchedule(index, { durationMinutes: Number(event.target.value) })} className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy disabled:bg-bg">
                {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy"><Bell className="h-4 w-4 text-primary" /> Cấu hình sử dụng về sau</h2>
        <div className="mt-3 divide-y divide-border-soft">
          <div className="flex items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">Cho phép nhắc theo lịch</p><p className="mt-1 text-xs text-text-faint">Lưu giờ nhắc mặc định cho Notification Service khi tính năng được bật.</p></div><Toggle checked={draft.remindersEnabled} onChange={() => setDraft({ ...draft, remindersEnabled: !draft.remindersEnabled })} label="Nhắc học" /></div>
          {draft.remindersEnabled && <label className="flex items-center justify-between gap-3 py-4 text-sm font-medium text-navy">Giờ nhắc mặc định<input type="time" value={draft.reminderTime} onChange={(event) => setDraft({ ...draft, reminderTime: event.target.value })} className="h-9 rounded-md border border-border bg-surface px-3 text-sm" /></label>}
          <div className="flex items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">Cho phép dùng dữ liệu cho gợi ý tương lai</p><p className="mt-1 text-xs text-text-faint">Chỉ lưu quyền lựa chọn; hiện chưa có recommendation engine hoặc lời gọi AI.</p></div><Toggle checked={draft.adaptiveRecommendations} onChange={() => setDraft({ ...draft, adaptiveRecommendations: !draft.adaptiveRecommendations })} label="Gợi ý tương lai" /></div>
        </div>
      </Card>

      {!valid && <p className="text-xs text-accent">Chọn ít nhất một lựa chọn trong mỗi nhóm bắt buộc trước khi lưu.</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-border-soft pt-5">
        <Button variant="outline" disabled={!dirty || saving} onClick={() => setDraft(saved)}><RotateCcw className="h-4 w-4" /> Hủy thay đổi</Button>
        <Button disabled={!dirty || !valid || saving} onClick={() => void save()}><BrainCircuit className="h-4 w-4" /> {saving ? "Đang lưu…" : "Lưu cá nhân hóa"}</Button>
      </div>
    </div>
  );
}
