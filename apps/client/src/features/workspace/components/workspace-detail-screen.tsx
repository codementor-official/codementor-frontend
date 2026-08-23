"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Archive, BarChart3, CheckCircle2, ClipboardCheck, ClipboardList, Crown, FileText, KeyRound, LogOut, RotateCcw, Save, Settings, Target, TrendingUp, Users } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Select, useToast } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { api } from "@/lib/api";
import type { WorkspaceDetail, WorkspaceMember, WorkspaceOverview, WorkspacePermission, WorkspaceRole } from "../types";
import { WorkspaceAssignmentsTab, WorkspaceDocumentsTab, WorkspaceExercisesTab } from "./workspace-content-tabs";

type Tab = "overview" | "documents" | "exercises" | "assignments" | "members" | "progress" | "settings";

const TABS: Array<{ key: Tab; label: string; icon: typeof Users; ownerOnly?: boolean }> = [
  { key: "overview", label: "Tổng quan", icon: Target },
  { key: "documents", label: "Tài liệu", icon: FileText },
  { key: "exercises", label: "Bài tập", icon: ClipboardList },
  { key: "assignments", label: "Bài nộp", icon: ClipboardCheck },
  { key: "members", label: "Thành viên", icon: Users },
  { key: "progress", label: "Tiến độ", icon: BarChart3 },
  { key: "settings", label: "Cài đặt", icon: Settings, ownerOnly: true },
];

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Chủ nhóm",
  deputy: "Phó nhóm",
  member: "Thành viên",
};

const PERMISSION_LABELS: { key: WorkspacePermission; label: string; description: string }[] = [
  { key: "upload_doc", label: "Tải tài liệu", description: "Đưa tài liệu lên không gian nhóm." },
  { key: "create_exercise", label: "Tạo bài tập", description: "Tạo bài tập mới cho nhóm." },
  { key: "edit_exercise", label: "Sửa bài tập", description: "Sửa bài tập đã có." },
  { key: "delete_doc", label: "Xóa tài liệu", description: "Gỡ tài liệu khỏi nhóm." },
  { key: "review_submission", label: "Xem bài nộp", description: "Xem và phản hồi bài nộp." },
  { key: "remove_member", label: "Loại thành viên", description: "Loại thành viên thường khỏi nhóm." },
];

export function WorkspaceDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextDetail, nextMembers, nextOverview] = await Promise.all([
        api.workspaces.detail(slug),
        api.workspaces.members(slug, { limit: 100 }),
        api.workspaces.overview(slug),
      ]);
      setDetail(nextDetail);
      setMembers(nextMembers.items);
      setOverview(nextOverview);
    } catch (cause) {
      setError(messageOf(cause, "Không tải được nhóm học tập. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const isOwner = detail?.currentMembership.role === "owner";
  const memberChoices = useMemo(
    () => members.filter((member) => member.role !== "owner"),
    [members],
  );

  const leave = async () => {
    setPending(true);
    try {
      await api.workspaces.leave(slug);
      toast.success("Bạn đã rời nhóm học tập");
      router.replace("/workspace");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể rời nhóm. Vui lòng thử lại."));
    } finally {
      setPending(false);
      setLeaving(false);
    }
  };

  const archive = async () => {
    setPending(true);
    try {
      await api.workspaces.archive(slug);
      toast.success("Đã lưu trữ nhóm học tập");
      router.replace("/workspace");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể lưu trữ nhóm. Vui lòng thử lại."));
    } finally {
      setPending(false);
      setArchiving(false);
    }
  };

  const changeRole = async (member: WorkspaceMember, role: Exclude<WorkspaceRole, "owner">) => {
    setPending(true);
    try {
      await api.workspaces.updateMemberRole(slug, member.id, role);
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role } : item));
      toast.success("Đã cập nhật vai trò thành viên");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể cập nhật vai trò."));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setPending(true);
    try {
      await api.workspaces.removeMember(slug, removing.id);
      setMembers((current) => current.filter((member) => member.id !== removing.id));
      toast.success("Đã loại thành viên khỏi nhóm");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể loại thành viên."));
    } finally {
      setPending(false);
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader icon={Users} title="Đang tải nhóm học tập" />
        <Card className="h-64 animate-pulse bg-border-soft" aria-busy="true" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <PageHeader icon={Users} title="Nhóm học tập" />
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-semibold text-navy">Không tải được nhóm học tập</p>
          <p className="mt-1 text-xs text-text-faint">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover">Thử lại</button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BreadcrumbTitle slug={slug} title={detail.name} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-on-ink">
          {initialsOf(detail.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-navy">{detail.name}</h1>
          <p className="text-xs text-text-faint">{detail.memberCount} thành viên · Nhóm học tập chung</p>
        </div>
        <Badge tone={isOwner ? "brown" : "neutral"}>{ROLE_LABEL[detail.currentMembership.role]}</Badge>
        {!isOwner && (
          <Button size="sm" variant="outline" onClick={() => setLeaving(true)} disabled={pending}>
            <LogOut className="h-3.5 w-3.5" /> Rời nhóm
          </Button>
        )}
      </div>

      <div className="scrollbar-none mb-5 overflow-x-auto border-b border-border">
        <nav className="flex min-w-max gap-1" aria-label="Mục của nhóm">
        {TABS.filter((item) => !item.ownerOnly || isOwner).map(({ key: value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === value ? "border-primary text-navy" : "border-transparent text-text-muted hover:border-border hover:text-navy"
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
        </nav>
      </div>

      {tab === "overview" && <Overview detail={detail} members={members} overview={overview} />}
      {tab === "documents" && <WorkspaceDocumentsTab detail={detail} />}
      {tab === "exercises" && <WorkspaceExercisesTab detail={detail} members={members} />}
      {tab === "assignments" && <WorkspaceAssignmentsTab detail={detail} />}
      {tab === "members" && (
        <Members
          members={members}
          overview={overview}
          isOwner={Boolean(isOwner)}
          pending={pending}
          onChangeRole={changeRole}
          onRemove={setRemoving}
        />
      )}
      {tab === "progress" && <Progress overview={overview} />}
      {tab === "settings" && isOwner && (
        <SettingsPanel detail={detail} members={memberChoices} onSaved={setDetail} onArchive={() => setArchiving(true)} />
      )}

      <ConfirmDialog
        open={leaving}
        onClose={() => setLeaving(false)}
        onConfirm={() => void leave()}
        title="Rời nhóm học tập?"
        confirmLabel="Rời nhóm"
        tone="default"
        message="Bạn sẽ không còn xem được tài liệu và thành viên của nhóm. Bạn vẫn có thể tham gia lại khi có mã mời hợp lệ."
      />
      <ConfirmDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        onConfirm={() => void archive()}
        title="Lưu trữ nhóm học tập?"
        confirmLabel="Lưu trữ nhóm"
        message="Nhóm sẽ không còn hoạt động và thành viên không thể tiếp tục truy cập qua danh sách hiện tại. Dữ liệu được giữ lại, không bị xoá vĩnh viễn."
      />
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Loại thành viên khỏi nhóm?"
        confirmLabel="Loại thành viên"
        message={<>Người này sẽ mất quyền truy cập vào nhóm <span className="font-semibold text-navy">{detail.name}</span>. Họ chỉ có thể quay lại khi có mã mời mới.</>}
      />
    </div>
  );
}

function Overview({ detail, members, overview }: { detail: WorkspaceDetail; members: WorkspaceMember[]; overview: WorkspaceOverview | null }) {
  const leaderboard = [...(overview?.members ?? members.map((member) => ({ id: member.id, displayName: member.user.displayName, avatarUrl: member.user.avatarUrl, role: member.role, xp: 0, solvedCount: 0 })))].sort((a, b) => b.xp - a.xp).slice(0, 5);
  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <div className="flex h-28 items-center justify-center bg-navy sm:h-32">
          <span className="font-mono text-3xl font-bold text-on-ink">{initialsOf(detail.name)}</span>
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="text-lg font-bold text-navy">{detail.name}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">{detail.description ?? "Nhóm chưa có mô tả."}</p></div>
            <Badge tone={detail.currentMembership.role === "owner" ? "brown" : "neutral"}>{ROLE_LABEL[detail.currentMembership.role]}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-border-soft pt-4 lg:grid-cols-4">
            <Meta icon={Target} label="Đang học" value={detail.topic ?? "Chưa phân loại"} />
            <Meta icon={Users} label="Thành viên" value={`${detail.memberCount} người`} />
            <Meta icon={Users} label="Ngày tạo" value={formatDate(detail.createdAt)} />
            {detail.inviteCode && <Meta icon={KeyRound} label="Mã mời" value={detail.inviteCode} mono />}
          </dl>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Thành viên" value={detail.memberCount} note="2 phó nhóm hỗ trợ quản lý" />
        <StatCard icon={ClipboardList} label="Bài tập" value={overview?.exercises.total ?? 0} note={`${overview?.exercises.open ?? 0} bài đang mở`} />
        <StatCard icon={ClipboardCheck} label="Bài đã hoàn thành" value={overview?.assignments.completed ?? 0} note={`${overview?.assignments.completionRate ?? 0}% toàn nhóm`} />
        <StatCard icon={FileText} label="Tài liệu" value={overview?.documents.total ?? 0} note={`${overview?.documents.published ?? 0} đã duyệt`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-3 text-sm font-bold text-navy">Bảng xếp hạng theo XP</h2><div className="space-y-3">{leaderboard.map((member, index) => <div key={member.id} className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-primary">{index + 1}</span><Avatar name={member.displayName} url={member.avatarUrl} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{member.displayName}</p><p className="text-xs text-text-faint">{ROLE_LABEL[member.role]} · {member.solvedCount} bài</p></div><span className="text-sm font-bold text-navy">{member.xp.toLocaleString("vi-VN")}</span></div>)}</div></Card>
        <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-navy">Hoạt động nhóm</h2><Badge tone="neutral">4 tuần gần nhất</Badge></div>{overview?.activities.length ? <ul className="max-h-80 space-y-3 overflow-y-auto pr-2">{overview.activities.map((item) => <li key={item.id} className="border-l-2 border-primary/30 pl-3 text-xs text-text-muted"><span className="font-semibold text-navy">{item.actor ?? "Hệ thống"}</span> {item.action}<span className="mt-0.5 block text-text-faint">{formatDateTime(item.createdAt)}</span></li>)}</ul> : <p className="text-xs leading-relaxed text-text-faint">Chưa có hoạt động nội dung. Hoạt động mới sẽ được ghi lại tại đây.</p>}<div className="mt-4 rounded-md bg-bg p-3 text-xs text-text-muted">Nhóm được cập nhật {formatDate(detail.updatedAt)}.</div></Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: number; note: string }) {
  return <Card className="p-4"><div className="flex items-center gap-2 text-xs font-medium text-text-muted"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-2 text-2xl font-bold text-navy">{value.toLocaleString("vi-VN")}</p><p className="mt-1 text-2xs text-text-faint">{note}</p></Card>;
}

function Meta({ icon: Icon, label, value, mono = false }: { icon: typeof Users; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-faint" />
      <div className="min-w-0"><dt className="text-2xs font-bold tracking-wide text-text-faint uppercase">{label}</dt><dd className={`mt-1 truncate text-sm font-medium text-navy ${mono ? "font-mono" : ""}`}>{value}</dd></div>
    </div>
  );
}

function Progress({ overview }: { overview: WorkspaceOverview | null }) {
  if (!overview) return <Card className="h-64 animate-pulse bg-border-soft" aria-busy="true" />;
  const activeMembers = overview.members.filter((member) => member.assignedCount > 0);
  const topActive = [...activeMembers].sort((a, b) => (b.activityCount + b.submissionCount) - (a.activityCount + a.submissionCount)).slice(0, 6);
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={TrendingUp} label="Hoàn thành" value={overview.assignments.completionRate} note={`${overview.assignments.completed}/${overview.assignments.total} assignment · đơn vị %`} />
      <StatCard icon={ClipboardCheck} label="Lượt nộp" value={overview.submissions.total} note={`Trung bình ${overview.submissions.averageAttempts} lần/bài`} />
      <StatCard icon={CheckCircle2} label="Tỷ lệ đạt" value={overview.submissions.acceptanceRate} note={`${overview.submissions.accepted} đạt · ${overview.submissions.failed} chưa đạt · đơn vị %`} />
      <StatCard icon={RotateCcw} label="Nhiều lần nhất" value={overview.submissions.maxAttempts} note={`Điểm trung bình ${overview.submissions.averageScore}/100`} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="p-5 xl:col-span-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-bold text-navy">Nộp bài và hoàn thành trong 14 ngày</h2><p className="mt-1 text-xs text-text-faint">Dữ liệu được tổng hợp trực tiếp từ lịch sử submission.</p></div><div className="flex gap-3 text-2xs text-text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Lượt nộp</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-success" />Hoàn thành</span></div></div><DualTrend submissions={overview.submissionTrend} completions={overview.completionTrend} /></Card>
      <Card className="p-5"><h2 className="text-sm font-bold text-navy">Đạt / Chưa đạt</h2><div className="mt-5 flex items-center justify-center gap-6"><div className="flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-success, #2f855a) ${overview.submissions.acceptanceRate}%, var(--color-border, #e5e7eb) 0)` }}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-lg font-bold text-navy">{overview.submissions.acceptanceRate}%</div></div><dl className="space-y-3 text-xs"><div><dt className="text-text-faint">Đạt</dt><dd className="font-bold text-success">{overview.submissions.accepted}</dd></div><div><dt className="text-text-faint">Chưa đạt</dt><dd className="font-bold text-primary">{overview.submissions.failed}</dd></div></dl></div></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5"><h2 className="text-sm font-bold text-navy">Phân bố tiến độ thành viên</h2><div className="mt-4 space-y-3">{overview.progressDistribution.map((bucket) => <DistributionBar key={bucket.key} label={bucket.label} value={bucket.value} total={activeMembers.length} />)}</div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><span className="rounded-md bg-bg px-3 py-2 text-text-muted">Đang làm: <b className="text-navy">{overview.assignments.inProgress}</b></span><span className="rounded-md bg-bg px-3 py-2 text-text-muted">Nộp trễ: <b className="text-primary">{overview.assignments.late}</b></span></div></Card>
      <Card className="p-5"><h2 className="text-sm font-bold text-navy">Thành viên hoạt động nổi bật</h2><div className="mt-4 space-y-3">{topActive.map((member, index) => <div key={member.id} className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-primary">{index + 1}</span><Avatar name={member.displayName} url={member.avatarUrl} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-navy">{member.displayName}</p><p className="text-2xs text-text-faint">{member.submissionCount} lượt nộp · {member.activityCount} hoạt động</p></div><span className="text-xs font-bold text-navy">{member.averageScore}đ</span></div>)}</div></Card>
    </div>
    <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-navy">Hoạt động 4 tuần gần nhất</h2><p className="mt-1 text-xs text-text-faint">Join, tạo bài, upload tài liệu, thông báo và submission.</p></div><Activity className="h-5 w-5 text-primary" /></div><MiniTrend points={overview.activityTrend} /></Card>
    <Card className="p-5"><h2 className="mb-2 text-sm font-bold text-navy">Tiến độ từng thành viên</h2><p className="mb-4 text-xs text-text-faint">Tỷ lệ được tính từ assignment thật, không phải số hardcode trên giao diện.</p><div className="grid max-h-[34rem] gap-x-6 gap-y-3 overflow-y-auto pr-2 lg:grid-cols-2">{activeMembers.sort((a, b) => b.completionRate - a.completionRate).map((member) => <div key={member.id} className="space-y-1"><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-navy">{member.displayName}</span><span className="shrink-0 text-text-faint">{member.completedCount}/{member.assignedCount} · {member.completionRate}%</span></div><ProgressBar value={member.completionRate} /></div>)}</div></Card>
  </div>;
}

function DualTrend({ submissions, completions }: { submissions: WorkspaceOverview["submissionTrend"]; completions: WorkspaceOverview["completionTrend"] }) {
  const max = Math.max(1, ...submissions.map((point) => point.value), ...completions.map((point) => point.value));
  return <div className="mt-6 flex h-48 items-end gap-1.5">{submissions.map((point, index) => <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="hidden text-2xs text-text-faint sm:block">{point.value}</span><div className="flex h-32 w-full items-end justify-center gap-0.5"><div className="w-2/5 rounded-t bg-primary" style={{ height: `${Math.max(2, point.value / max * 100)}%` }} /><div className="w-2/5 rounded-t bg-success" style={{ height: `${Math.max(2, (completions[index]?.value ?? 0) / max * 100)}%` }} /></div><span className="-rotate-45 whitespace-nowrap text-[9px] text-text-faint sm:rotate-0">{point.label}</span></div>)}</div>;
}

function MiniTrend({ points }: { points: WorkspaceOverview["activityTrend"] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return <div className="mt-5 flex h-24 items-end gap-1">{points.map((point, index) => <div key={`${point.label}-${index}`} className="group relative min-w-0 flex-1 rounded-t bg-primary/70 hover:bg-primary" style={{ height: `${Math.max(4, point.value / max * 100)}%` }} title={`${point.label}: ${point.value} hoạt động`} />)}</div>;
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total ? Math.round(value / total * 100) : 0;
  return <div><div className="mb-1 flex items-center justify-between text-xs"><span className="text-text-muted">{label}</span><span className="font-semibold text-navy">{value} người</span></div><div className="h-2 overflow-hidden rounded-full bg-border-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div></div>;
}

function Members({
  members,
  overview,
  isOwner,
  pending,
  onChangeRole,
  onRemove,
}: {
  members: WorkspaceMember[];
  overview: WorkspaceOverview | null;
  isOwner: boolean;
  pending: boolean;
  onChangeRole: (member: WorkspaceMember, role: Exclude<WorkspaceRole, "owner">) => Promise<void>;
  onRemove: (member: WorkspaceMember) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-navy">Thành viên</h2>
          <p className="text-xs text-text-faint">Vai trò và thành viên được kiểm soát bởi Chủ nhóm.</p>
        </div>
        <Badge tone="neutral">{members.length} người</Badge>
      </div>
      <ul className="divide-y divide-border-soft">
        {members.map((member) => {
          const stats = overview?.members.find((item) => item.id === member.id);
          return (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={member.user.displayName} url={member.user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{member.user.displayName}</p>
                <p className="truncate text-xs text-text-faint">{stats?.email ?? `Tham gia ${formatDate(member.joinedAt)}`}</p>
                {stats && <p className="mt-0.5 text-2xs text-text-muted">{stats.xp.toLocaleString("vi-VN")} XP · {stats.submissionCount} lượt nộp · {stats.assignedCount ? `${stats.completionRate}% hoàn thành` : "Quản lý nhóm"}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={member.role === "owner" ? "brown" : "neutral"}>{ROLE_LABEL[member.role]}</Badge>
              {isOwner && member.role !== "owner" && (
                <>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => void onChangeRole(member, member.role === "deputy" ? "member" : "deputy")}>
                    {member.role === "deputy" ? "Hạ xuống thành viên" : "Đặt làm Phó nhóm"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => onRemove(member)}>Loại</Button>
                </>
              )}
            </div>
          </li>
        );})}
      </ul>
    </Card>
  );
}

function SettingsPanel({
  detail,
  members,
  onSaved,
  onArchive,
}: {
  detail: WorkspaceDetail;
  members: WorkspaceMember[];
  onSaved: (detail: WorkspaceDetail) => void;
  onArchive: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(detail.name);
  const [description, setDescription] = useState(detail.description ?? "");
  const [topic, setTopic] = useState(detail.topic ?? "");
  const [transferTo, setTransferTo] = useState("");
  const [pending, setPending] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const updated = await api.workspaces.update(detail.slug, { name, description, topic });
      onSaved(updated);
      toast.success("Đã lưu thay đổi nhóm");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể lưu thay đổi."));
    } finally {
      setPending(false);
    }
  };

  const transfer = async () => {
    if (!transferTo) return;
    setPending(true);
    try {
      await api.workspaces.transferOwnership(detail.slug, transferTo);
      toast.success("Đã chuyển quyền Chủ nhóm");
      window.location.assign(`/workspace/${detail.slug}`);
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể chuyển quyền sở hữu."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2"><Settings className="h-4 w-4 text-text-faint" /><h2 className="text-sm font-bold text-navy">Thông tin nhóm</h2></div>
        <form onSubmit={save} className="space-y-3">
          <label className="block text-xs font-medium text-text-muted">Tên nhóm<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy" /></label>
          <label className="block text-xs font-medium text-text-muted">Mô tả<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={2000} className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy" /></label>
          <label className="block text-xs font-medium text-text-muted">Chủ đề<input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy" /></label>
          <Button size="sm" type="submit" disabled={pending}><Save className="h-3.5 w-3.5" />Lưu thay đổi</Button>
        </form>
      </Card>
      <div className="space-y-4">
        {detail.rolePermissions && <RolePermissionsPanel detail={detail} onSaved={onSaved} />}
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-bold text-navy">Chuyển quyền sở hữu</h2>
          <p className="mb-3 text-xs leading-relaxed text-text-faint">Bạn sẽ trở thành Phó nhóm sau khi chuyển quyền. Chủ nhóm mới có thể quản lý thành viên và lưu trữ nhóm.</p>
          <Select label="Chủ nhóm mới" value={transferTo} onChange={setTransferTo} options={[{ value: "", label: "Chọn thành viên" }, ...members.map((member) => ({ value: member.id, label: member.user.displayName }))]} />
          <Button size="sm" variant="outline" className="mt-3" disabled={!transferTo || pending} onClick={() => void transfer()}><Crown className="h-3.5 w-3.5" />Chuyển quyền</Button>
        </Card>
        <Card className="border-primary/30 p-5">
          <div className="flex items-center gap-2"><Archive className="h-4 w-4 text-primary" /><h2 className="text-sm font-bold text-navy">Lưu trữ nhóm</h2></div>
          <p className="mt-2 text-xs leading-relaxed text-text-faint">Lưu trữ giữ nguyên dữ liệu và không xoá bài nộp. Đây là lựa chọn an toàn thay cho xoá vĩnh viễn.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onArchive}>Lưu trữ nhóm</Button>
        </Card>
      </div>
    </div>
  );
}

function RolePermissionsPanel({ detail, onSaved }: { detail: WorkspaceDetail; onSaved: (detail: WorkspaceDetail) => void }) {
  const toast = useToast();
  const [permissions, setPermissions] = useState(detail.rolePermissions);
  const [pending, setPending] = useState(false);

  if (!permissions) return null;

  const toggle = (role: Exclude<WorkspaceRole, "owner">, permission: WorkspacePermission) => {
    setPermissions((current) => current && {
      ...current,
      [role]: { ...current[role], [permission]: !current[role][permission] },
    });
  };

  const save = async () => {
    setPending(true);
    try {
      await api.workspaces.updateRolePermissions(detail.slug, "deputy", permissions.deputy);
      const updated = await api.workspaces.updateRolePermissions(detail.slug, "member", permissions.member);
      onSaved(updated);
      toast.success("Đã cập nhật quyền mặc định theo vai trò");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể cập nhật quyền vai trò."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-navy">Quyền theo vai trò</h2>
      <p className="mt-1 text-xs leading-relaxed text-text-faint">Chủ nhóm luôn có toàn quyền. Những thay đổi này áp dụng mặc định cho Phó nhóm và Thành viên.</p>
      <div className="mt-4 space-y-3">
        {(["deputy", "member"] as const).map((role) => (
          <fieldset key={role} className="rounded-md border border-border-soft p-3">
            <legend className="px-1 text-xs font-bold text-navy">{ROLE_LABEL[role]}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_LABELS.map(({ key, label, description }) => (
                <label key={key} className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-xs text-text hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={permissions[role][key]}
                    onChange={() => toggle(role, key)}
                    disabled={pending}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span><span className="block font-medium text-navy">{label}</span><span className="text-text-faint">{description}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button size="sm" className="mt-4" disabled={pending} onClick={() => void save()}><Save className="h-3.5 w-3.5" />Lưu quyền</Button>
    </Card>
  );
}

function initialsOf(value: string): string {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase() || "NH";
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return <span role="img" aria-label={`Avatar ${name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy bg-cover bg-center text-xs font-bold text-on-ink" style={url ? { backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` } : undefined}>{url ? <span className="sr-only">{initialsOf(name)}</span> : initialsOf(name)}</span>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError ? cause.message : fallback;
}
