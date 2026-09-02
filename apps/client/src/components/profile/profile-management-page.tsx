"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AtSign, Award, BookOpenCheck, CalendarDays, Camera, CheckCircle2, Clock3, GitBranch, Globe2, Mail, Pencil, Save, Trophy, UserRound, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { AccountProfile, UserActivityCalendar, UserActivityEntry, UserLearningPreferences, UserLearningStats } from "@/features/account/types";
import { SettingsPanel } from "@/features/account/components/settings-panel";
import { PersonalizationPanel } from "@/features/account/components/personalization-panel";
import { EmailVerificationCard } from "@/features/account/components/email-verification";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Modal, SegmentedTabs, useToast } from "@codementor/ui";

type AccountTab = "profile" | "settings" | "personalization";
const EMPTY_STATS: UserLearningStats = { xp: 0, solvedCount: 0, currentStreakDays: 0, longestStreakDays: 0, lastSolvedOn: null };
const EMPTY_ACTIVITY: UserActivityCalendar = { days: [], totalActivities: 0, activeDays: 0, currentStreakDays: 0, longestStreakDays: 0 };
const HEAT_COLORS = ["bg-border-soft", "bg-primary/15", "bg-primary/35", "bg-primary/65", "bg-primary"];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
function cleanOptional(value: string): string | null { return value.trim() || null; }
function errorMessage(cause: unknown, fallback: string): string { return cause instanceof Error ? cause.message : fallback; }

function heatLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function ActivityHeatmap({ activity }: { activity: UserActivityCalendar }) {
  const firstDate = activity.days[0] ? new Date(`${activity.days[0].date}T00:00:00Z`) : null;
  const leadingDays = firstDate ? (firstDate.getUTCDay() + 6) % 7 : 0;
  const calendarCells: Array<UserActivityCalendar["days"][number] | null> = [
    ...Array.from({ length: leadingDays }, () => null),
    ...activity.days,
  ];
  const weekCount = Math.ceil(calendarCells.length / 7);
  const calendarStart = firstDate ? new Date(firstDate) : null;
  calendarStart?.setUTCDate(calendarStart.getUTCDate() - leadingDays);
  const weekDates = Array.from({ length: weekCount }, (_, index) => {
    if (!calendarStart) return null;
    const date = new Date(calendarStart);
    date.setUTCDate(date.getUTCDate() + index * 7);
    return date;
  });
  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-navy">{activity.totalActivities} hoạt động trong năm qua</h2>
          <p className="mt-1 text-xs text-text-muted">
            Mỗi ô thể hiện số hoạt động học tập trong một ngày.
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs text-text-muted">
          <span>Tổng số ngày: <b className="text-navy">{activity.activeDays}</b></span>
          <span>Chuỗi dài nhất: <b className="text-navy">{activity.longestStreakDays}</b></span>
          <CalendarDays className="h-5 w-5 shrink-0 text-text-faint" />
        </div>
      </div>
      {activity.days.length > 0 ? (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="min-w-max">
              <div className="relative mb-2 ml-6 h-4" style={{ width: `${weekCount}rem` }}>
                {weekDates.map((date, index) => {
                  if (!date) return null;
                  const previous = weekDates[index - 1];
                  const show = index === 0 || date.getUTCMonth() !== previous?.getUTCMonth();
                  if (!show) return null;
                  const label = `T${date.getUTCMonth() + 1}${date.getUTCMonth() === 0 || index === 0 ? ` ${date.getUTCFullYear()}` : ""}`;
                  return <span key={date.toISOString()} className="absolute top-0 whitespace-nowrap text-2xs text-text-faint" style={{ left: `${index}rem` }}>{label}</span>;
                })}
              </div>
              <div className="flex items-start gap-2">
                <div className="grid w-4 shrink-0 grid-rows-7 gap-1 text-2xs text-text-faint">
                  {["T2", "", "T4", "", "T6", "", "CN"].map((label, index) => <span key={`${label}-${index}`} className="h-3 leading-3">{label}</span>)}
                </div>
                <div className="grid w-fit grid-flow-col grid-rows-7 gap-1">
                  {calendarCells.map((day, index) => {
                    if (!day) return <span key={`padding-${index}`} className="h-3 w-3" />;
                    const level = heatLevel(day.count);
                    return (
                      <span
                        key={day.date}
                        title={`${new Date(`${day.date}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })}: ${day.count} hoạt động`}
                        aria-label={`${day.date}: ${day.count} hoạt động`}
                        className={`h-3 w-3 rounded-sm ${HEAT_COLORS[level]}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-1.5 text-2xs text-text-faint">
            <span>Ít</span>
            {HEAT_COLORS.map((color) => <span key={color} className={`h-3 w-3 rounded-sm ${color}`} />)}
            <span>Nhiều</span>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">Chưa có hoạt động học tập trong giai đoạn này.</div>
      )}
    </Card>
  );
}

const ACTIVITY_LABELS: Record<UserActivityEntry["kind"], string> = {
  roadmap_enrolled: "Tham gia lộ trình",
  course_enrolled: "Ghi danh khóa học",
  course_completed: "Hoàn thành khóa học",
  lesson_completed: "Hoàn thành bài học",
  exercise_solved: "Giải bài thành công",
};

const LEVEL_LABELS: Record<NonNullable<UserLearningPreferences["currentLevel"]>, string> = {
  none: "Mới bắt đầu",
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  experienced: "Có kinh nghiệm",
};
const CONTENT_LABELS: Record<NonNullable<UserLearningPreferences["contentPriority"]>, string> = {
  theory: "Ưu tiên lý thuyết",
  practice: "Ưu tiên thực hành",
  project: "Ưu tiên dự án",
};
const WEEKDAY_LABELS: Record<UserLearningPreferences["schedule"][number]["weekday"], string> = {
  mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN",
};

function preferenceName(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function RecentActivity({ items }: { items: UserActivityEntry[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-navy">Hoạt động gần đây</h2>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-border-soft p-3">
          {items.map((item, index) => (
            <div key={`${item.kind}-${item.occurredAt}-${index}`} className="flex items-center gap-3 rounded-md px-3 py-3 even:bg-bg">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
                {item.kind === "exercise_solved" || item.kind === "course_completed" ? <CheckCircle2 className="h-4 w-4" /> : <BookOpenCheck className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">{ACTIVITY_LABELS[item.kind]}{item.detail ? ` · ${item.detail}` : ""}</p>
              </div>
              <time className="shrink-0 text-xs text-text-faint">{new Date(item.occurredAt).toLocaleDateString("vi-VN")}</time>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-text-muted">Chưa có hoạt động học tập gần đây.</div>
      )}
    </Card>
  );
}

function ProfilePanel() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [draft, setDraft] = useState<AccountProfile | null>(null);
  const [stats, setStats] = useState<UserLearningStats>(EMPTY_STATS);
  const [activity, setActivity] = useState<UserActivityCalendar>(EMPTY_ACTIVITY);
  const [recentActivity, setRecentActivity] = useState<UserActivityEntry[]>([]);
  const [preferences, setPreferences] = useState<UserLearningPreferences | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.me(), api.account.stats(), api.account.activityCalendar(52), api.account.recentActivity(10), api.account.preferences()])
      .then(([currentProfile, currentStats, currentActivity, currentRecentActivity, currentPreferences]) => {
        if (!active) return;
        setProfile(currentProfile); setDraft(currentProfile); setStats(currentStats); setActivity(currentActivity); setRecentActivity(currentRecentActivity); setPreferences(currentPreferences);
      })
      .catch((cause: unknown) => active && setError(errorMessage(cause, "Không thể tải hồ sơ.")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);
  const dirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(draft) || avatarFile !== null, [avatarFile, draft, profile]);
  const valid = Boolean(draft?.displayName.trim()) && (!draft?.websiteUrl || /^https?:\/\//i.test(draft.websiteUrl));
  function update<K extends keyof AccountProfile>(key: K, value: AccountProfile[K]) { setDraft((current) => current ? { ...current, [key]: value } : current); }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Ảnh đại diện chỉ hỗ trợ PNG, JPEG hoặc WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh đại diện tối đa 5 MB."); return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); setError(null);
  }

  async function save() {
    if (!draft || !dirty || !valid) return;
    setSaving(true); setError(null);
    try {
      let avatarUrl = draft.avatarUrl;
      if (avatarFile) {
        const target = await api.account.avatarUploadUrl({ filename: avatarFile.name, contentType: avatarFile.type, sizeBytes: avatarFile.size });
        const upload = await fetch(target.uploadUrl, { method: "PUT", headers: target.headers, body: avatarFile });
        if (!upload.ok) throw new Error("Không thể tải ảnh lên storage. Vui lòng thử lại.");
        avatarUrl = target.publicUrl;
      }
      const updated = await api.account.updateProfile({
        displayName: draft.displayName.trim(), handle: cleanOptional(draft.handle ?? ""), bio: cleanOptional(draft.bio ?? ""), avatarUrl,
        websiteUrl: cleanOptional(draft.websiteUrl ?? ""), githubHandle: cleanOptional(draft.githubHandle ?? ""), locale: draft.locale, timezone: draft.timezone,
      });
      setProfile(updated); setDraft(updated); setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null); setEditing(false); await refreshUser(); toast.success("Đã lưu hồ sơ.");
    } catch (cause) { setError(errorMessage(cause, "Không thể lưu hồ sơ.")); }
    finally { setSaving(false); }
  }

  function cancel() {
    setDraft(profile); setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null); setError(null); setEditing(false);
  }

  if (loading) return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="h-96 animate-pulse rounded-xl bg-bg" /><div className="h-96 animate-pulse rounded-xl bg-bg" /></div>;
  if (!draft) return <Card className="p-6 text-sm text-danger">{error ?? "Không có dữ liệu hồ sơ."}</Card>;
  const avatar = avatarPreview ?? draft.avatarUrl;
  const nextMilestone = Math.max(50, Math.ceil((stats.solvedCount + 1) / 50) * 50);
  const solvedPercent = Math.min(100, Math.round((stats.solvedCount / nextMilestone) * 100));
  const interestTags = [...new Set([...(preferences?.interestedFields ?? []), ...(preferences?.interestedTechnologies ?? [])])];

  return (
    <>
      <div className="space-y-5">
        {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
        <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              {profile?.avatarUrl ? <div role="img" aria-label={`Ảnh đại diện của ${profile.displayName}`} className="h-20 w-20 shrink-0 rounded-lg border border-border bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(profile.avatarUrl)})` }} /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-navy text-xl font-bold text-on-ink">{initials(profile?.displayName ?? draft.displayName)}</div>}
              <div className="min-w-0">
                <h2 className="truncate font-bold text-navy">{profile?.displayName}</h2>
                <p className="mt-1 truncate text-xs text-text-muted">{profile?.handle ? `@${profile.handle}` : profile?.email}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-text-muted">{profile?.bio || "Chưa có phần giới thiệu."}</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil className="h-4 w-4" /> Chỉnh sửa hồ sơ</Button>
            <div className="mt-5 space-y-3 border-t border-border-soft pt-4 text-xs text-text-muted">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{profile?.email}</span></span>
              {profile?.websiteUrl && <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 shrink-0" /><span className="truncate">{profile.websiteUrl.replace(/^https?:\/\//, "")}</span></span>}
              {profile?.githubHandle && <span className="flex items-center gap-2"><GitBranch className="h-4 w-4 shrink-0" />{profile.githubHandle}</span>}
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0" />{profile?.timezone}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-navy">Định hướng học tập</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="text-text-muted">Trình độ</span><b className="text-right text-navy">{preferences?.currentLevel ? LEVEL_LABELS[preferences.currentLevel] : "Chưa chọn"}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-text-muted">Nội dung</span><b className="text-right text-navy">{preferences?.contentPriority ? CONTENT_LABELS[preferences.contentPriority] : "Chưa chọn"}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-text-muted">Mỗi tuần</span><b className="text-right text-navy">{preferences?.weeklyStudyHours ? `${preferences.weeklyStudyHours} giờ` : "Chưa đặt"}</b></div>
            </div>
            {(preferences?.learningGoal || preferences?.careerGoal) && <div className="mt-4 border-t border-border-soft pt-4"><p className="text-2xs font-semibold tracking-wide text-text-faint uppercase">Mục tiêu</p><p className="mt-2 text-xs leading-relaxed text-text-muted">{preferenceName(preferences.learningGoal ?? preferences.careerGoal ?? "")}</p></div>}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-navy">Chủ đề quan tâm</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {interestTags.length > 0 ? interestTags.map((item) => <span key={item} className="rounded-full bg-bg px-2.5 py-1 text-2xs font-medium text-text-muted">{preferenceName(item)}</span>) : <p className="text-xs text-text-faint">Chưa chọn chủ đề.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold text-navy">Lịch học cá nhân</h3></div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(preferences?.schedule ?? []).map((slot) => <span key={slot.weekday} title={slot.enabled ? `${slot.startTime} · ${slot.durationMinutes} phút` : "Không học"} className={`flex h-8 w-8 items-center justify-center rounded-md text-2xs font-bold ${slot.enabled ? "bg-primary text-on-ink" : "bg-bg text-text-faint"}`}>{WEEKDAY_LABELS[slot.weekday]}</span>)}
            </div>
            <p className="mt-4 text-xs text-text-muted">{preferences?.remindersEnabled ? `Nhắc học lúc ${preferences.reminderTime}` : "Chưa bật nhắc lịch học."}</p>
          </Card>
          </aside>

          <main className="min-w-0 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="flex min-h-48 items-center gap-6 p-5">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full p-2" style={{ background: `conic-gradient(var(--color-primary) ${solvedPercent}%, var(--color-border-soft) 0)` }}>
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface">
                    <b className="text-3xl text-navy">{stats.solvedCount}</b>
                    <span className="text-xs text-text-muted">Bài đã giải</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 divide-y divide-border-soft">
                  {[[stats.xp.toLocaleString("vi-VN"), "Tổng XP"], [`${stats.currentStreakDays} ngày`, "Chuỗi hiện tại"], [`${stats.longestStreakDays} ngày`, "Chuỗi dài nhất"]].map(([value, label]) => <div key={label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"><span className="text-xs text-text-muted">{label}</span><b className="text-sm text-navy">{value}</b></div>)}
                </div>
              </Card>

              <Card className="relative min-h-48 overflow-hidden p-5">
                <Award className="absolute -right-4 -bottom-6 h-36 w-36 text-primary/10" />
                <p className="text-xs text-text-muted">Thành tích học tập</p>
                <div className="mt-2 flex items-baseline gap-2"><b className="text-3xl text-navy">{activity.activeDays}</b><span className="text-sm text-text-muted">ngày hoạt động</span></div>
                <div className="relative mt-5 space-y-3 text-xs">
                  <span className="flex items-center gap-2 text-text-muted"><Trophy className="h-4 w-4 text-primary" />Mốc tiếp theo: <b className="text-navy">{nextMilestone} bài</b></span>
                  <span className="flex items-center gap-2 text-text-muted"><Zap className="h-4 w-4 text-primary" />Tiến độ tới mốc: <b className="text-navy">{solvedPercent}%</b></span>
                  <span className="flex items-center gap-2 text-text-muted"><CalendarDays className="h-4 w-4 text-primary" />Hoàn thành gần nhất: <b className="text-navy">{stats.lastSolvedOn ? new Date(stats.lastSolvedOn).toLocaleDateString("vi-VN") : "Chưa có"}</b></span>
                </div>
              </Card>
            </div>
            <ActivityHeatmap activity={activity} />
            <RecentActivity items={recentActivity} />
          </main>
        </div>
      </div>

      <Modal open={editing} onClose={cancel} title="Chỉnh sửa hồ sơ" description="Thông tin này được hiển thị trong CodeMentor và các Workspace bạn tham gia." width="lg" footer={<><Button variant="outline" disabled={saving} onClick={cancel}>Hủy</Button><Button disabled={!dirty || !valid || saving} onClick={() => void save()}><Save className="h-4 w-4" /> {saving ? avatarFile ? "Đang tải ảnh…" : "Đang lưu…" : "Lưu hồ sơ"}</Button></>}>
        {error && <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-bg p-4">
          <div className="relative h-20 w-20 shrink-0">
            {avatar ? <div role="img" aria-label={`Ảnh đại diện của ${draft.displayName}`} className="h-20 w-20 rounded-full border border-border bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatar)})` }} /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-xl font-bold text-on-ink">{initials(draft.displayName)}</div>}
            <button type="button" aria-label="Chọn ảnh đại diện" onClick={() => fileRef.current?.click()} className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-on-ink shadow-sm"><Camera className="h-4 w-4" /></button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0])} />
          </div>
          <div><p className="text-sm font-bold text-navy">Ảnh đại diện</p><p className="mt-1 text-xs text-text-muted">PNG, JPEG hoặc WebP, tối đa 5 MB.</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-semibold text-text-muted">Họ và tên<Input className="mt-1.5" value={draft.displayName} maxLength={120} onChange={(event) => update("displayName", event.target.value)} /></label>
          <label className="text-xs font-semibold text-text-muted">Username<div className="relative mt-1.5"><AtSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-faint" /><Input className="pl-9" value={draft.handle ?? ""} maxLength={30} onChange={(event) => update("handle", event.target.value)} /></div></label>
          <label className="text-xs font-semibold text-text-muted sm:col-span-2">Email<div className="relative mt-1.5"><Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-faint" /><Input className="bg-bg pl-9" value={draft.email} disabled /></div></label>
          <label className="text-xs font-semibold text-text-muted sm:col-span-2">Giới thiệu<textarea className="mt-1.5 min-h-28 w-full resize-y rounded-md border border-border bg-surface p-3 text-sm text-navy focus:border-primary focus:outline-none" value={draft.bio ?? ""} maxLength={2000} onChange={(event) => update("bio", event.target.value)} /><span className="mt-1 block text-right text-2xs text-text-faint">{draft.bio?.length ?? 0}/2000</span></label>
          <label className="text-xs font-semibold text-text-muted">Website<div className="relative mt-1.5"><Globe2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-faint" /><Input className="pl-9" placeholder="https://example.com" value={draft.websiteUrl ?? ""} onChange={(event) => update("websiteUrl", event.target.value)} /></div>{draft.websiteUrl && !/^https?:\/\//i.test(draft.websiteUrl) && <span className="mt-1 block text-2xs text-danger">URL phải bắt đầu bằng http:// hoặc https://</span>}</label>
          <label className="text-xs font-semibold text-text-muted">GitHub<div className="relative mt-1.5"><GitBranch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-faint" /><Input className="pl-9" placeholder="username" value={draft.githubHandle ?? ""} maxLength={39} onChange={(event) => update("githubHandle", event.target.value)} /></div></label>
          <label className="text-xs font-semibold text-text-muted">Ngôn ngữ<select value={draft.locale} onChange={(event) => update("locale", event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-navy"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
          <label className="text-xs font-semibold text-text-muted">Múi giờ<select value={draft.timezone} onChange={(event) => update("timezone", event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-navy"><option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option><option value="Asia/Bangkok">Asia/Bangkok</option><option value="UTC">UTC</option></select></label>
        </div>
      </Modal>
    </>
  );
}

export function ProfileManagementPage({ initialTab = "profile" }: { initialTab?: AccountTab }) {
  const [tab, setTab] = useState<AccountTab>(initialTab);
  function changeTab(value: string) {
    const next = value as AccountTab; setTab(next);
    window.history.replaceState(null, "", next === "profile" ? "/profile" : `/profile?tab=${next}`);
  }
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader icon={UserRound} title="Hồ sơ cá nhân" subtitle="Quản lý thông tin, cài đặt tài khoản và dữ liệu cá nhân hóa của bạn." />
      <SegmentedTabs className="mb-5" value={tab} onChange={changeTab} options={[{ value: "profile", label: "Hồ sơ" }, { value: "settings", label: "Cài đặt" }, { value: "personalization", label: "Cá nhân hóa" }]} />
      <div role="tabpanel">
        <EmailVerificationCard />
        {tab === "profile" && <ProfilePanel />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "personalization" && <PersonalizationPanel />}
      </div>
    </div>
  );
}
