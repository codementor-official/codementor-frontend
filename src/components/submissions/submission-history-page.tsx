"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, CircleAlert, Clock3, Code2, FileCode2, Search, UsersRound, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SideDrawer } from "@/components/ui/side-drawer";
import { submissionHistory, type SubmissionHistoryItem } from "@/data/submission-history";

const statuses = ["Tất cả", "Đạt", "Không đạt", "Lỗi biên dịch"] as const;

function resultStyle(result: SubmissionHistoryItem["result"]) {
  if (result === "Đạt") return { icon: CheckCircle2, label: "Đạt", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (result === "Không đạt") return { icon: CircleAlert, label: "Cần xem lại", className: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { icon: XCircle, label: "Lỗi biên dịch", className: "bg-rose-50 text-rose-700 ring-rose-200" };
}

export function SubmissionHistoryPage() {
  const [status, setStatus] = useState<(typeof statuses)[number]>("Tất cả");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("all");
  const [selected, setSelected] = useState<SubmissionHistoryItem | null>(null);
  const rows = useMemo(() => submissionHistory.filter((item) => (status === "Tất cả" || item.result === status) && (origin === "all" || item.origin === origin) && `${item.title} ${item.language} ${item.groupName ?? ""}`.toLowerCase().includes(search.toLowerCase())), [origin, search, status]);
  const accepted = submissionHistory.filter((item) => item.result === "Đạt").length;
  const groupCount = submissionHistory.filter((item) => item.origin === "Nhóm học tập").length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-border-soft pb-5 lg:flex-row lg:items-end">
        <div><p className="mb-1 text-xs font-bold tracking-[0.14em] text-primary uppercase">Lịch sử làm bài</p><h1 className="text-3xl font-bold tracking-tight text-navy">Bài đã nộp</h1><p className="mt-1.5 max-w-2xl text-sm text-text-muted">Theo dõi mọi lần làm bài từ ngân hàng luyện tập và các nhóm bạn tham gia — biết rõ kết quả, test case và lần nộp gần nhất.</p></div>
        <div className="grid grid-cols-3 divide-x divide-border-soft rounded-lg border border-border bg-surface text-center"><Metric value={String(submissionHistory.length)} label="lần nộp" /><Metric value={`${accepted}/${submissionHistory.length}`} label="đạt yêu cầu" /><Metric value={String(groupCount)} label="bài từ nhóm" /></div>
      </header>

      <Card className="mb-4 overflow-hidden"><div className="flex flex-col gap-3 border-b border-border-soft p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-bg px-3"><Search className="h-4 w-4 shrink-0 text-text-faint" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài tập, nhóm hoặc ngôn ngữ..." className="h-10 min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-text-faint" /></div><Select label="Nguồn bài" shape="box" value={origin} onChange={setOrigin} options={[{ value: "all", label: "Mọi nguồn bài" }, { value: "Nhóm học tập", label: "Bài từ nhóm" }, { value: "Bài luyện tập", label: "Bài luyện tập" }]} /></div><div className="flex gap-1 overflow-x-auto px-4">{statuses.map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition ${status === item ? "border-primary text-navy" : "border-transparent text-text-muted hover:text-navy"}`}>{item}{item === "Tất cả" && <span className="ml-1.5 text-xs text-text-faint">{submissionHistory.length}</span>}</button>)}</div></Card>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <div className="hidden grid-cols-[minmax(260px,1.5fr)_150px_130px_150px_36px] gap-4 border-b border-border-soft bg-bg px-5 py-3 text-2xs font-bold tracking-wide text-text-faint uppercase lg:grid"><span>Bài tập</span><span>Kết quả</span><span>Ngôn ngữ</span><span>Lần nộp gần nhất</span><span /></div>
        <div className="divide-y divide-border-soft">{rows.map((item) => <SubmissionRow key={item.id} item={item} onOpen={() => setSelected(item)} />)}{rows.length === 0 && <div className="p-14 text-center"><FileCode2 className="mx-auto h-7 w-7 text-text-faint" /><p className="mt-3 text-sm font-semibold text-navy">Chưa có lượt nộp phù hợp</p><p className="mt-1 text-xs text-text-muted">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>}</div>
      </section>
      <p className="mt-3 text-right text-xs text-text-faint">Hiển thị {rows.length} lượt nộp · Mỗi lần nộp được lưu riêng để bạn tiện đối chiếu.</p>
      <SubmissionDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="min-w-24 px-3 py-2.5"><b className="block text-base text-navy">{value}</b><span className="text-[11px] text-text-muted">{label}</span></div>; }

function SubmissionRow({ item, onOpen }: { item: SubmissionHistoryItem; onOpen: () => void }) {
  const result = resultStyle(item.result);
  const ResultIcon = result.icon;
  return <button type="button" onClick={onOpen} className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-bg sm:px-5 lg:grid-cols-[minmax(260px,1.5fr)_150px_130px_150px_36px] lg:items-center lg:gap-4">
    <div className="min-w-0"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.origin === "Nhóm học tập" ? "bg-blue-50 text-blue-700" : "bg-primary-tint text-primary"}`}>{item.origin === "Nhóm học tập" ? <UsersRound className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-navy">{item.title}</p><p className="mt-1 truncate text-xs text-text-muted">{item.groupName ? item.groupName : "Ngân hàng bài luyện tập"}</p></div></div></div>
    <div className="flex items-center gap-2 lg:block"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${result.className}`}><ResultIcon className="h-3.5 w-3.5" />{result.label}</span><span className="ml-2 text-xs text-text-faint lg:ml-0 lg:mt-1 lg:block">{item.passedTests}/{item.totalTests} test · {item.score} điểm</span></div>
    <div className="flex items-center gap-2 text-xs text-text-muted"><Code2 className="h-3.5 w-3.5 text-text-faint lg:hidden" />{item.language}</div>
    <div className="flex items-center gap-2 text-xs text-text-muted"><Clock3 className="h-3.5 w-3.5 text-text-faint lg:hidden" /><span>{item.submittedAt}</span><span className="hidden lg:inline">· Lần {item.version}</span></div>
    <ChevronRight className="hidden h-4 w-4 text-text-faint lg:block" />
  </button>;
}

function SubmissionDrawer({ item, onClose }: { item: SubmissionHistoryItem | null; onClose: () => void }) {
  if (!item) return null;
  const result = resultStyle(item.result);
  const ResultIcon = result.icon;
  return <SideDrawer open width="wide" onClose={onClose} title={item.title} description={`${item.origin} · ${item.groupName ?? "Ngân hàng bài luyện tập"}`} footer={<Button size="sm" variant="outline" onClick={onClose}>Đóng</Button>}><div className="mx-auto max-w-4xl space-y-5"><section className="rounded-lg border border-border bg-bg p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${result.className}`}><ResultIcon className="h-4 w-4" /> {result.label} · {item.score}/100</span><span className="text-xs text-text-muted">Nộp lúc {item.submittedAt} · phiên bản {item.version}</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Test case", `${item.passedTests}/${item.totalTests}`], ["Thời gian", item.runtime], ["Bộ nhớ", item.memory], ["Ngôn ngữ", item.language]].map(([label, value]) => <div key={label} className="rounded-lg border border-border-soft bg-surface p-3"><p className="text-[11px] text-text-faint">{label}</p><p className="mt-1 text-sm font-bold text-navy">{value}</p></div>)}</div></section><section className="rounded-lg border border-border p-4"><h2 className="text-sm font-bold text-navy">Nhận xét kết quả</h2><p className="mt-2 text-sm leading-6 text-text">{item.note}</p></section><section><h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy"><Code2 className="h-4 w-4 text-primary" /> Mã nguồn đã nộp</h2><pre className="overflow-x-auto rounded-lg bg-navy p-5 text-xs leading-6 text-zinc-100"><code>{item.sourceCode}</code></pre></section></div></SideDrawer>;
}
