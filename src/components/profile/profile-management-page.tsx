"use client";

import { useMemo, useState } from "react";
import { Award, CalendarDays, Code2, ExternalLink, GitBranch, Globe2, MapPin, Pencil, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { submissionHistory } from "@/data/submission-history";

const heatLevels = Array.from({ length: 91 }, (_, index) => {
  const value = Math.abs(Math.sin(index * 7.321 + 0.8));
  return value > 0.88 ? 4 : value > 0.68 ? 3 : value > 0.46 ? 2 : value > 0.27 ? 1 : 0;
});

const heatColors = ["bg-border-soft", "bg-orange-100", "bg-orange-300", "bg-primary", "bg-orange-800"];

const difficulties = [
  { label: "Cơ bản", value: "22/30", percent: 73, color: "bg-emerald-500" },
  { label: "Trung bình", value: "18/32", percent: 56, color: "bg-amber-500" },
  { label: "Nâng cao", value: "7/18", percent: 39, color: "bg-rose-500" },
];

export function ProfileManagementPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: "Nguyễn Trần Gia Sĩ",
    handle: "giasi",
    bio: "Đang xây nền tảng Backend Java và rèn tư duy giải thuật mỗi ngày.",
    website: "giasi.dev",
    github: "giasi",
  });

  const accepted = useMemo(() => submissionHistory.filter((item) => item.result === "Đạt"), []);
  const recent = submissionHistory.slice(0, 5);

  function saveProfile() {
    setSaved(true);
    setIsEditing(false);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.14em] text-primary uppercase">Không gian cá nhân</p>
          <h1 className="text-2xl font-bold text-navy">Hồ sơ & thành tích học tập</h1>
          <p className="mt-1 text-sm text-text-muted">Theo dõi quá trình luyện tập, chia sẻ kỹ năng và quản lý thông tin công khai.</p>
        </div>
        {saved && <span className="text-xs font-semibold text-emerald-700">Đã lưu thay đổi hồ sơ</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="overflow-hidden p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-base font-bold text-white">GS</div>
              <div className="min-w-0">
                <h2 className="truncate font-bold text-navy">{profile.name}</h2>
                <p className="text-xs text-text-muted">@{profile.handle}</p>
              </div>
            </div>
            <p className="mb-4 text-xs leading-5 text-text-muted">{profile.bio}</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa hồ sơ
            </Button>
            <div className="mt-5 space-y-2.5 border-t border-border-soft pt-4 text-xs text-text-muted">
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> TP. Hồ Chí Minh, Việt Nam</span>
              <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /> {profile.website}</span>
              <span className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5" /> {profile.github}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-navy">Kỹ năng nổi bật</h2>
            <div className="flex flex-wrap gap-1.5">
              {["Java", "C++", "SQL", "Cấu trúc dữ liệu", "OOP"].map((skill) => (
                <span key={skill} className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-navy">{skill}</span>
              ))}
            </div>
          </Card>
        </aside>

        <main className="min-w-0 space-y-5">
          <Card className="grid divide-y divide-border-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[["2.450", "Tổng XP", "Hạng #1 trong nhóm"], ["5 ngày", "Chuỗi hoạt động", "Kỷ lục 12 ngày"], ["47", "Bài đã giải", "68% tỷ lệ hoàn thành"]].map(([value, label, detail]) => (
              <div key={label} className="px-4 py-3.5"><div className="flex items-baseline justify-between gap-2"><p className="text-xs text-text-muted">{label}</p><p className="text-xl font-bold text-navy">{value}</p></div><p className="mt-1 text-xs text-text-faint">{detail}</p></div>
            ))}
          </Card>

          <section className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="font-bold text-navy">Tổng quan bài luyện tập</h2><p className="mt-1 text-xs text-text-muted">69 bài trong ngân hàng bài tập cá nhân</p></div>
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="mx-auto flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(var(--color-primary) 68%, var(--color-border-soft) 0)" }}>
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-surface"><b className="text-2xl text-navy">47</b><span className="text-xs text-text-muted">/ 69 đã giải</span></div>
                </div>
                <div className="flex-1 space-y-3">
                  {difficulties.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-text">{item.label}</span><span className="text-text-muted">{item.value}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border-soft"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-navy">Thành tích</h2><p className="mt-1 text-xs text-text-muted">Mốc học tập gần đây</p></div><Trophy className="h-5 w-5 text-primary" /></div>
              <div className="space-y-3">
                {[["Người kiên trì", "Duy trì học 5 ngày liên tiếp"], ["100% Test case", "Hoàn thành 3 bài không lỗi"], ["Đồng đội tin cậy", "Đã nộp 36 bài cho nhóm"]].map(([title, detail], index) => (
                  <div key={title} className="flex items-center gap-3 rounded-lg bg-bg p-3"><Award className={`h-5 w-5 ${index === 0 ? "text-amber-500" : "text-primary"}`} /><div><p className="text-xs font-semibold text-navy">{title}</p><p className="mt-0.5 text-[11px] text-text-muted">{detail}</p></div></div>
                ))}
              </div>
            </Card>
          </section>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-navy">Hoạt động trong 13 tuần</h2><p className="mt-1 text-xs text-text-muted">{accepted.length} bài đạt trong các lần nộp gần đây · Chuỗi hiện tại 5 ngày</p></div><CalendarDays className="h-5 w-5 text-text-faint" /></div>
            <div className="overflow-x-auto pb-1"><div className="grid w-fit grid-flow-col grid-rows-7 gap-1">{heatLevels.map((level, index) => <span key={index} title={`${level} hoạt động`} className={`h-3 w-3 rounded-sm ${heatColors[level]}`} />)}</div></div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-text-faint"><span>Ít</span>{heatColors.map((color) => <span key={color} className={`h-3 w-3 rounded-sm ${color}`} />)}<span>Nhiều</span></div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-5 py-4"><div><h2 className="font-bold text-navy">Bài nộp gần đây</h2><p className="mt-1 text-xs text-text-muted">Các lần làm mới nhất từ nhóm học tập và ngân hàng luyện tập</p></div><Button href="/exercises?tab=submissions" variant="ghost" size="sm">Xem tất cả <ExternalLink className="h-3.5 w-3.5" /></Button></div>
            <div className="divide-y divide-border-soft">
              {recent.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.origin}{item.groupName ? ` · ${item.groupName}` : " · Ngân hàng bài luyện tập"}</p></div><div className="text-right"><span className={`text-xs font-bold ${item.result === "Đạt" ? "text-emerald-600" : item.result === "Không đạt" ? "text-amber-600" : "text-rose-600"}`}>{item.result}</span><p className="mt-1 text-[11px] text-text-faint">{item.submittedAt}</p></div></div>)}
            </div>
          </Card>
        </main>
      </div>

      <Modal open={isEditing} onClose={() => setIsEditing(false)} title="Chỉnh sửa hồ sơ" description="Thông tin này hiển thị trên trang cá nhân và trong các nhóm bạn tham gia." footer={<><Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button><Button onClick={saveProfile}>Lưu thay đổi</Button></>}>
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-navy">Họ và tên<Input className="mt-1.5" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="text-sm font-semibold text-navy">Tên hiển thị<Input className="mt-1.5" value={profile.handle} onChange={(event) => setProfile({ ...profile, handle: event.target.value })} /></label>
          <label className="text-sm font-semibold text-navy">Giới thiệu<textarea className="mt-1.5 min-h-22 w-full rounded-md border border-border bg-surface p-3 text-sm text-navy outline-none focus:border-navy" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-navy">Website<Input className="mt-1.5" value={profile.website} onChange={(event) => setProfile({ ...profile, website: event.target.value })} /></label><label className="text-sm font-semibold text-navy">GitHub<Input className="mt-1.5" value={profile.github} onChange={(event) => setProfile({ ...profile, github: event.target.value })} /></label></div>
        </div>
      </Modal>
    </div>
  );
}
