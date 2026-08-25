"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Camera, GitBranch, Globe2, Mail, Save, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { AccountProfile, UserLearningStats } from "@/features/account/types";
import { SettingsPanel } from "@/features/account/components/settings-panel";
import { PersonalizationPanel } from "@/features/account/components/personalization-panel";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, SegmentedTabs, useToast } from "@codementor/ui";

type AccountTab = "profile" | "settings" | "personalization";
const EMPTY_STATS: UserLearningStats = { xp: 0, solvedCount: 0, currentStreakDays: 0, longestStreakDays: 0, lastSolvedOn: null };

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
function cleanOptional(value: string): string | null { return value.trim() || null; }
function errorMessage(cause: unknown, fallback: string): string { return cause instanceof Error ? cause.message : fallback; }

function ProfilePanel() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [draft, setDraft] = useState<AccountProfile | null>(null);
  const [stats, setStats] = useState<UserLearningStats>(EMPTY_STATS);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.me(), api.account.stats()])
      .then(([currentProfile, currentStats]) => {
        if (!active) return;
        setProfile(currentProfile); setDraft(currentProfile); setStats(currentStats);
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
      setAvatarPreview(null); await refreshUser(); toast.success("Đã lưu hồ sơ.");
    } catch (cause) { setError(errorMessage(cause, "Không thể lưu hồ sơ.")); }
    finally { setSaving(false); }
  }

  function cancel() {
    setDraft(profile); setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null); setError(null);
  }

  if (loading) return <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"><div className="h-72 animate-pulse rounded-xl bg-bg" /><div className="h-96 animate-pulse rounded-xl bg-bg" /></div>;
  if (!draft) return <Card className="p-6 text-sm text-danger">{error ?? "Không có dữ liệu hồ sơ."}</Card>;
  const avatar = avatarPreview ?? draft.avatarUrl;

  return (
    <div className="space-y-5">
      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="p-5 text-center">
            <div className="relative mx-auto h-24 w-24">
              {avatar ? <div role="img" aria-label={`Ảnh đại diện của ${draft.displayName}`} className="h-24 w-24 rounded-full border border-border bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatar).slice(1, -1)})` }} /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy text-2xl font-bold text-on-ink">{initials(draft.displayName)}</div>}
              <button type="button" aria-label="Chọn ảnh đại diện" onClick={() => fileRef.current?.click()} className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-on-ink shadow-sm"><Camera className="h-4 w-4" /></button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0])} />
            </div>
            <h2 className="mt-4 font-bold text-navy">{draft.displayName}</h2>
            <p className="mt-1 text-xs text-text-muted">{draft.handle ? `@${draft.handle}` : draft.email}</p>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">{draft.bio || "Chưa có phần giới thiệu."}</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">Thống kê học tập</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[[stats.xp.toLocaleString("vi-VN"), "Tổng XP"], [String(stats.solvedCount), "Bài đã giải"], [`${stats.currentStreakDays} ngày`, "Chuỗi hiện tại"], [`${stats.longestStreakDays} ngày`, "Chuỗi dài nhất"]].map(([value, label]) => <div key={label} className="rounded-lg bg-bg p-3"><p className="text-base font-bold text-navy">{value}</p><p className="mt-1 text-2xs text-text-faint">{label}</p></div>)}
            </div>
            {stats.lastSolvedOn && <p className="mt-3 text-xs text-text-faint">Lần hoàn thành gần nhất: {new Date(stats.lastSolvedOn).toLocaleDateString("vi-VN")}</p>}
          </Card>
        </aside>

        <Card className="p-5 sm:p-6">
          <div className="mb-5"><h2 className="text-base font-bold text-navy">Thông tin hồ sơ</h2><p className="mt-1 text-xs text-text-faint">Email lấy từ Keycloak và không thể chỉnh sửa tại đây.</p></div>
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
          <div className="mt-6 flex justify-end gap-2 border-t border-border-soft pt-5">
            <Button variant="outline" disabled={!dirty || saving} onClick={cancel}>Hủy thay đổi</Button>
            <Button disabled={!dirty || !valid || saving} onClick={() => void save()}><Save className="h-4 w-4" /> {saving ? avatarFile ? "Đang tải ảnh…" : "Đang lưu…" : "Lưu hồ sơ"}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ProfileManagementPage({ initialTab = "profile" }: { initialTab?: AccountTab }) {
  const [tab, setTab] = useState<AccountTab>(initialTab);
  function changeTab(value: string) {
    const next = value as AccountTab; setTab(next);
    window.history.replaceState(null, "", next === "profile" ? "/profile" : `/profile?tab=${next}`);
  }
  return (
    <div>
      <PageHeader icon={UserRound} title="Hồ sơ cá nhân" subtitle="Quản lý thông tin, cài đặt tài khoản và dữ liệu cá nhân hóa của bạn." />
      <SegmentedTabs className="mb-5" value={tab} onChange={changeTab} options={[{ value: "profile", label: "Hồ sơ" }, { value: "settings", label: "Cài đặt" }, { value: "personalization", label: "Cá nhân hóa" }]} />
      <div role="tabpanel">
        {tab === "profile" && <ProfilePanel />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "personalization" && <PersonalizationPanel />}
      </div>
    </div>
  );
}
