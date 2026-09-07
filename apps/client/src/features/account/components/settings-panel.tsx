"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Eye, MonitorSmartphone, RotateCcw, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useThemeStore } from "@/lib/store/theme-store";
import type { UserSettings } from "@/features/account/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@codementor/ui";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-[left] ${checked ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-text-faint">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function SettingsPanel() {
  const toast = useToast();
  const setTheme = useThemeStore((state) => state.setPreference);
  const [saved, setSaved] = useState<UserSettings | null>(null);
  const [draft, setDraft] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.account.settings()
      .then((settings) => {
        if (!active) return;
        const activeTheme = useThemeStore.getState().preference;
        const synchronized = { ...settings, theme: activeTheme };
        setSaved(synchronized);
        setDraft(synchronized);
        if (settings.theme !== activeTheme) void api.account.updateSettings({ theme: activeTheme });
      })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Không thể tải cài đặt."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [setTheme]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [draft, saved]);
  const patch = (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) =>
    setDraft((current) => current ? { ...current, [key]: value } : current);
  const selectTheme = (theme: UserSettings["theme"]) => {
    patch("theme", theme);
    setTheme(theme);
  };

  async function save() {
    if (!draft || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.account.updateSettings(draft);
      setSaved(updated);
      setDraft(updated);
      setTheme(updated.theme);
      toast.success("Đã lưu cài đặt tài khoản.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    setError(null);
    try {
      const defaults = await api.account.resetSettings();
      setSaved(defaults);
      setDraft(defaults);
      setTheme(defaults.theme);
      toast.success("Đã đặt lại cài đặt mặc định.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đặt lại cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-bg" />)}</div>;
  if (!draft) return <Card className="p-6 text-sm text-danger">{error ?? "Không có dữ liệu cài đặt."}</Card>;

  return (
    <div className="space-y-5">
      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy"><Bell className="h-4 w-4 text-primary" /> Thông báo</h2>
          <div className="mt-3 divide-y divide-border-soft">
            <SettingRow title="Thông báo qua email" description="Nhận những cập nhật quan trọng qua email." checked={draft.emailNotifications} onChange={() => patch("emailNotifications", !draft.emailNotifications)} />
            <SettingRow title="Hoạt động nhóm học tập" description="Thông báo trong ứng dụng về bài tập, tài liệu, chat và thay đổi thành viên. Các lựa chọn email bên dưới được áp dụng riêng." checked={draft.workspaceNotifications} onChange={() => patch("workspaceNotifications", !draft.workspaceNotifications)} />
            <fieldset disabled={!draft.emailNotifications} className="divide-y divide-border-soft disabled:opacity-50">
              <SettingRow title="Email bài tập" description="Được giao bài mới, cần làm lại hoặc thay đổi hạn nộp." checked={draft.assignmentNotifications} onChange={() => patch("assignmentNotifications", !draft.assignmentNotifications)} />
              <SettingRow title="Nhắc hạn nộp qua email" description="Nhắc trước 24 giờ và khi quá hạn; dừng khi bài đã hoàn thành." checked={draft.deadlineReminders} onChange={() => patch("deadlineReminders", !draft.deadlineReminders)} />
              <fieldset disabled={!draft.deadlineReminders} className="disabled:opacity-50">
                <SettingRow title="Nhắc thêm trước 6 giờ" description="Thêm một lời nhắc trước deadline khi cần." checked={draft.deadline6hReminders} onChange={() => patch("deadline6hReminders", !draft.deadline6hReminders)} />
              </fieldset>
              <SettingRow title="Email học tập" description="Nhắc theo lịch đã lưu ở Cá nhân hóa, nhắc tiếp tục khóa học đang dở và chúc mừng khi hoàn thành." checked={draft.learningReminders} onChange={() => patch("learningReminders", !draft.learningReminders)} />
              <label className="flex items-center justify-between gap-3 py-4 text-sm text-navy">
                Nhắc khi chưa học trong
                <select aria-label="Số ngày ngừng học trước khi nhắc" value={draft.learningInactivityDays} onChange={(event) => patch("learningInactivityDays", Number(event.target.value))} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {[1,3,7,14,30].map((days) => <option key={days} value={days}>{days} ngày</option>)}
                  {![1,3,7,14,30].includes(draft.learningInactivityDays) && <option value={draft.learningInactivityDays}>{draft.learningInactivityDays} ngày</option>}
                </select>
              </label>
              <SettingRow title="Email cập nhật Workspace" description="Tài liệu mới được duyệt, yêu cầu/kết quả duyệt tài liệu theo quyền của bạn, kết quả tham gia và được thêm vào nhóm. Không gửi từng tin nhắn chat." checked={draft.workspaceEmailUpdates} onChange={() => patch("workspaceEmailUpdates", !draft.workspaceEmailUpdates)} />
              <SettingRow title="Email thông báo hệ thống" description="Các thông báo quan trọng do quản trị viên gửi." checked={draft.systemAnnouncements} onChange={() => patch("systemAnnouncements", !draft.systemAnnouncements)} />
            </fieldset>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy"><Eye className="h-4 w-4 text-primary" /> Quyền riêng tư</h2>
          <div className="mt-3 divide-y divide-border-soft">
            <SettingRow title="Hồ sơ công khai" description="Cho thành viên khác xem hồ sơ và thành tích công khai của bạn." checked={draft.publicProfile} onChange={() => patch("publicProfile", !draft.publicProfile)} />
            <SettingRow title="Hiển thị tiến độ học tập" description="Cho phép hiển thị tổng quan bài đã giải, XP và chuỗi hoạt động." checked={draft.showLearningProgress} onChange={() => patch("showLearningProgress", !draft.showLearningProgress)} />
            <SettingRow title="Cho phép lời mời vào nhóm" description="Owner hoặc Leader có thể gửi lời mời Workspace cho bạn." checked={draft.allowWorkspaceInvites} onChange={() => patch("allowWorkspaceInvites", !draft.allowWorkspaceInvites)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy"><MonitorSmartphone className="h-4 w-4 text-primary" /> Giao diện</h2>
          <p className="mt-1 text-xs text-text-faint">Lựa chọn được đồng bộ theo tài khoản và áp dụng ngay trên thiết bị này.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button key={theme} type="button" onClick={() => selectTheme(theme)} className={`rounded-lg border px-3 py-3 text-xs font-semibold transition ${draft.theme === theme ? "border-navy bg-navy text-on-ink" : "border-border text-text-muted hover:bg-bg"}`}>
                {theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Theo hệ thống"}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy"><ShieldCheck className="h-4 w-4 text-primary" /> Tài khoản & bảo mật</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">Mật khẩu, xác thực đa yếu tố và phiên đăng nhập do Keycloak quản lý. CodeMentor không lưu bản sao mật khẩu trong Profile.</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-5">
        <Button variant="ghost" onClick={() => void reset()} disabled={saving}><RotateCcw className="h-4 w-4" /> Đặt lại mặc định</Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!dirty || saving} onClick={() => { setDraft(saved); if (saved) setTheme(saved.theme); }}>Hủy thay đổi</Button>
          <Button disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Đang lưu…" : "Lưu cài đặt"}</Button>
        </div>
      </div>
    </div>
  );
}
