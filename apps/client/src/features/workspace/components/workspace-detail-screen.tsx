"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Crown,
  Copy,
  Download,
  FileText,
  Flame,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  MessageCircle,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Select, useToast } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/download-csv";
import type {
  WorkspaceDetail,
  WorkspaceJoinRequest,
  WorkspaceMember,
  WorkspaceMemberDetail,
  WorkspaceOverview,
  WorkspacePermission,
  WorkspaceRole,
} from "../types";
import {
  WorkspaceDocumentsTab,
  WorkspaceExercisesTab,
} from "./workspace-content-tabs";
import { useWorkspaceChat } from "../chat/use-workspace-chat";
import { WorkspaceChatTab, WorkspaceMiniChat } from "../chat/workspace-chat";

type Tab =
  | "overview"
  | "documents"
  | "exercises"
  | "members"
  | "progress"
  | "chat"
  | "settings";

const TABS: Array<{
  key: Tab;
  label: string;
  icon: typeof Users;
  ownerOnly?: boolean;
}> = [
  { key: "overview", label: "Tổng quan", icon: Target },
  { key: "documents", label: "Tài liệu", icon: FileText },
  { key: "exercises", label: "Bài tập", icon: ClipboardList },
  { key: "members", label: "Thành viên", icon: Users },
  { key: "progress", label: "Tiến độ", icon: BarChart3 },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "settings", label: "Cài đặt", icon: Settings, ownerOnly: true },
];

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Chủ nhóm",
  deputy: "Phó nhóm",
  member: "Thành viên",
};

const PERMISSION_LABELS: {
  key: WorkspacePermission;
  label: string;
  description: string;
}[] = [
  {
    key: "view_doc",
    label: "Xem tài liệu",
    description: "Xem tài liệu đã được duyệt trong nhóm.",
  },
  {
    key: "upload_doc",
    label: "Tải tài liệu",
    description: "Đưa tài liệu lên không gian nhóm.",
  },
  {
    key: "edit_own_doc",
    label: "Sửa tài liệu của mình",
    description: "Sửa metadata tài liệu do chính mình tải lên.",
  },
  {
    key: "delete_own_doc",
    label: "Xóa tài liệu của mình",
    description: "Chuyển tài liệu của chính mình vào mục đã xóa.",
  },
  {
    key: "manage_doc",
    label: "Quản lý mọi tài liệu",
    description: "Sửa, ẩn, khôi phục và xóa mọi tài liệu.",
  },
  {
    key: "approve_doc",
    label: "Duyệt tài liệu",
    description: "Duyệt hoặc từ chối tài liệu đang chờ.",
  },
  {
    key: "view_exercise",
    label: "Xem bài tập",
    description: "Xem bài tập đang hiển thị trong nhóm.",
  },
  {
    key: "create_exercise",
    label: "Tạo bài tập",
    description: "Tạo bài tập mới cho nhóm.",
  },
  {
    key: "edit_own_exercise",
    label: "Sửa bài tập của mình",
    description: "Sửa bài tập do chính mình tạo.",
  },
  {
    key: "delete_own_exercise",
    label: "Xóa bài tập của mình",
    description: "Chuyển bài tập của chính mình vào mục đã xóa.",
  },
  {
    key: "manage_exercise",
    label: "Quản lý mọi bài tập",
    description: "Sửa, ẩn, khôi phục và xóa mọi bài tập.",
  },
  {
    key: "assign_exercise",
    label: "Phân công bài tập",
    description: "Giao bài và cập nhật danh sách người học.",
  },
  {
    key: "review_submission",
    label: "Xem bài nộp",
    description: "Xem và phản hồi bài nộp.",
  },
  {
    key: "remove_member",
    label: "Loại thành viên",
    description: "Loại thành viên thường khỏi nhóm.",
  },
];

export function WorkspaceDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [tab, setTab] = useState<Tab>(() =>
    tabFromQuery(searchParams.get("tab")),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);
  const [memberRevision, setMemberRevision] = useState(0);
  const [joinRequestCount, setJoinRequestCount] = useState(0);
  const chat = useWorkspaceChat(slug, detail !== null, tab === "chat");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setTab(tabFromQuery(searchParams.get("tab"))),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const selectTab = useCallback(
    (next: Tab) => {
      setTab(next);
      const query = new URLSearchParams(searchParams.toString());
      if (next === "overview") query.delete("tab");
      else query.set("tab", next);
      const suffix = query.toString();
      router.replace(
        `/workspace/${encodeURIComponent(slug)}${suffix ? `?${suffix}` : ""}`,
        {
          scroll: false,
        },
      );
    },
    [router, searchParams, slug],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextDetail, nextMembers, nextOverview] = await Promise.all([
        api.workspaces.detail(slug),
        api.workspaces.members(slug, { limit: 100 }),
        api.workspaces.overview(slug),
      ]);
      if (nextDetail.coverKey) {
        try {
          const cover = await api.workspaces.coverPreview(slug);
          nextDetail.coverUrl = cover.url;
        } catch {
          // Keep the persisted fallback URL if the signed preview is unavailable.
        }
      }
      setDetail(nextDetail);
      setMembers(nextMembers.items);
      setOverview(nextOverview);
    } catch (cause) {
      setError(
        messageOf(cause, "Không tải được nhóm học tập. Vui lòng thử lại."),
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (detail?.currentMembership.role !== "owner") {
      setJoinRequestCount(0);
      return;
    }
    const timer = window.setTimeout(() => {
      void api.workspaces
        .joinRequests(detail.slug, "pending")
        .then((response) => setJoinRequestCount(response.items.length))
        .catch(() => setJoinRequestCount(0));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [detail?.currentMembership.role, detail?.slug]);

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
      toast.error(
        messageOf(cause, "Không thể lưu trữ nhóm. Vui lòng thử lại."),
      );
    } finally {
      setPending(false);
      setArchiving(false);
    }
  };

  const changeRole = async (
    member: WorkspaceMember,
    role: Exclude<WorkspaceRole, "owner">,
  ) => {
    setPending(true);
    try {
      await api.workspaces.updateMemberRole(slug, member.id, role);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, role } : item,
        ),
      );
      setMemberRevision((value) => value + 1);
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
      setMembers((current) =>
        current.filter((member) => member.id !== removing.id),
      );
      setMemberRevision((value) => value + 1);
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
          <p className="text-sm font-semibold text-navy">
            Không tải được nhóm học tập
          </p>
          <p className="mt-1 text-xs text-text-faint">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            Thử lại
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BreadcrumbTitle slug={slug} title={detail.name} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {detail.coverUrl ? (
          <img
            src={detail.coverUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-on-ink">
            {initialsOf(detail.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-navy">
            {detail.name}
          </h1>
          <p className="text-xs text-text-faint">
            {detail.memberCount} thành viên · Nhóm học tập chung
          </p>
        </div>
        <Badge tone={isOwner ? "brown" : "neutral"}>
          {ROLE_LABEL[detail.currentMembership.role]}
        </Badge>
        {!isOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLeaving(true)}
            disabled={pending}
          >
            <LogOut className="h-3.5 w-3.5" /> Rời nhóm
          </Button>
        )}
      </div>

      <div className="scrollbar-none mb-5 overflow-x-auto border-b border-border">
        <nav className="flex min-w-max gap-1" aria-label="Mục của nhóm">
          {TABS.filter((item) => !item.ownerOnly || isOwner).map(
            ({ key: value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectTab(value)}
                aria-current={tab === value ? "page" : undefined}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === value
                    ? "border-primary text-navy"
                    : "border-transparent text-text-muted hover:border-border hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {value === "chat" && chat.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-on-ink">
                    {Math.min(chat.unreadCount, 99)}
                  </span>
                )}
                {value === "members" && joinRequestCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-2xs font-bold text-on-ink">
                    {Math.min(joinRequestCount, 99)}
                  </span>
                )}
              </button>
            ),
          )}
        </nav>
      </div>

      {tab === "overview" && <Overview detail={detail} overview={overview} />}
      {tab === "documents" && <WorkspaceDocumentsTab detail={detail} />}
      {tab === "exercises" && (
        <WorkspaceExercisesTab detail={detail} members={members} />
      )}
      {tab === "members" && (
        <Members
          slug={detail.slug}
          overview={overview}
          viewerRole={detail.currentMembership.role}
          revision={memberRevision}
          pending={pending}
          onChangeRole={changeRole}
          onRemove={setRemoving}
          pendingJoinRequestCount={joinRequestCount}
          onJoinRequestCountChange={setJoinRequestCount}
        />
      )}
      {tab === "progress" && (
        <Progress slug={detail.slug} overview={overview} />
      )}
      {tab === "chat" && <WorkspaceChatTab detail={detail} chat={chat} />}
      {tab === "settings" && isOwner && (
        <SettingsPanel
          detail={detail}
          members={memberChoices}
          onSaved={setDetail}
          onArchive={() => setArchiving(true)}
        />
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
        message={
          <>
            Người này sẽ mất quyền truy cập vào nhóm{" "}
            <span className="font-semibold text-navy">{detail.name}</span>. Họ
            chỉ có thể quay lại khi có mã mời mới.
          </>
        }
      />
      {tab !== "chat" && (
        <WorkspaceMiniChat
          workspaceName={detail.name}
          chat={chat}
          onOpenFull={() => selectTab("chat")}
        />
      )}
    </div>
  );
}

function tabFromQuery(value: string | null): Tab {
  return TABS.some((item) => item.key === value) ? (value as Tab) : "overview";
}

function Overview({
  detail,
  overview,
}: {
  detail: WorkspaceDetail;
  overview: WorkspaceOverview | null;
}) {
  const toast = useToast();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityOverview, setActivityOverview] = useState(overview);
  const [activityLoading, setActivityLoading] = useState(false);
  const exportActivities = async () => {
    try {
      const result = await api.workspaces.overview(detail.slug, {
        activitySearch: activitySearch.trim() || undefined,
        activityPage: 1,
        activityLimit: 50,
      });
      downloadCsv(
        `workspace-activity-${todayForFile()}.csv`,
        ["Thành viên", "Hoạt động", "Thời gian"],
        result.activities.map((item) => [
          item.actor ?? "Hệ thống",
          item.action,
          formatDateTime(item.createdAt),
        ]),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể xuất hoạt động."));
    }
  };
  useEffect(() => {
    if (!overview) return;
    const timer = window.setTimeout(() => {
      setActivityLoading(true);
      void api.workspaces
        .overview(detail.slug, {
          activitySearch: activitySearch.trim() || undefined,
          activityPage,
          activityLimit: 12,
        })
        .then(setActivityOverview)
        .catch((error) =>
          toast.error(messageOf(error, "Không tải được hoạt động.")),
        )
        .finally(() => setActivityLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activityPage, activitySearch, detail.slug, overview, toast]);
  const ranked = [...(overview?.members ?? [])].sort((a, b) => b.xp - a.xp);
  const leaderboard = ranked.slice(0, showLeaderboard ? 10 : 5);
  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <div
          className={`flex items-center justify-center bg-navy bg-no-repeat ${
            detail.coverHeight === "compact"
              ? "h-24 sm:h-28"
              : detail.coverHeight === "tall"
                ? "h-40 sm:h-52"
                : "h-28 sm:h-36"
          }`}
          style={
            detail.coverUrl
              ? {
                  backgroundImage: `url(${detail.coverUrl})`,
                  backgroundPosition: detail.coverPosition,
                  backgroundSize: detail.coverFit,
                }
              : undefined
          }
        >
          {!detail.coverUrl && (
            <span className="font-mono text-3xl font-bold text-on-ink">
              {initialsOf(detail.name)}
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-navy">{detail.name}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
                {detail.description ?? "Nhóm chưa có mô tả."}
              </p>
            </div>
            <Badge
              tone={
                detail.currentMembership.role === "owner" ? "brown" : "neutral"
              }
            >
              {ROLE_LABEL[detail.currentMembership.role]}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-border-soft pt-4 lg:grid-cols-4">
            <Meta
              icon={Target}
              label="Đang học"
              value={detail.topic ?? "Chưa phân loại"}
            />
            <Meta
              icon={Users}
              label="Thành viên"
              value={`${detail.memberCount} người`}
            />
            <Meta
              icon={Users}
              label="Ngày tạo"
              value={formatDate(detail.createdAt)}
            />
            {detail.inviteCode && (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Meta
                    icon={KeyRound}
                    label="Mã mời"
                    value={detail.inviteCode}
                    mono
                  />
                </div>
                <button
                  type="button"
                  aria-label="Sao chép mã mời"
                  className="rounded-md border border-border p-2 text-text-muted hover:border-primary hover:text-primary"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(detail.inviteCode ?? "")
                      .then(() => toast.success("Đã sao chép mã mời"))
                      .catch(() => toast.error("Không thể sao chép mã mời"));
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
          </dl>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Thành viên"
          value={detail.memberCount}
          note="2 phó nhóm hỗ trợ quản lý"
        />
        <StatCard
          icon={ClipboardList}
          label="Bài tập"
          value={overview?.exercises.total ?? 0}
          note={`${overview?.exercises.open ?? 0} bài đang mở`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Bài đã hoàn thành"
          value={overview?.assignments.completed ?? 0}
          note={`${overview?.assignments.completionRate ?? 0}% toàn nhóm`}
        />
        <StatCard
          icon={FileText}
          label="Tài liệu"
          value={overview?.documents.total ?? 0}
          note={`${overview?.documents.published ?? 0} đã duyệt`}
        />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="flex min-h-[354px] flex-col p-5 lg:h-[420px]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-navy">
                  Bảng xếp hạng theo XP
                </h2>
                <p className="mt-1 text-xs text-text-faint">
                  XP · tiến độ · streak hiện tại
                </p>
              </div>
              <Badge tone="neutral">
                Top {Math.min(showLeaderboard ? 10 : 5, ranked.length)}
              </Badge>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {leaderboard.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <Avatar name={member.displayName} url={member.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">
                      {member.displayName}
                    </p>
                    <p className="text-xs text-text-faint">
                      {member.completionRate}% hoàn thành · {member.streakDays}{" "}
                      ngày streak
                    </p>
                  </div>
                  <span className="text-sm font-bold text-navy">
                    {member.xp.toLocaleString("vi-VN")}{" "}
                    <span className="text-2xs font-normal text-text-faint">
                      XP
                    </span>
                  </span>
                </div>
              ))}
            </div>
            {ranked.length > 5 && (
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-1 border-t border-border-soft pt-3 text-xs font-semibold text-primary"
                onClick={() => setShowLeaderboard((value) => !value)}
              >
                {showLeaderboard ? (
                  <>
                    Thu gọn <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Xem top 10 <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </Card>
          {overview && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-navy">
                    Xu hướng hoạt động
                  </h2>
                  <p className="mt-1 text-xs text-text-faint">
                    Số hoạt động mỗi ngày trong 4 tuần.
                  </p>
                </div>
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <MiniTrend points={overview.activityTrend} />
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card className="flex flex-col p-5 lg:h-[420px]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-sm font-bold text-navy">
                Hoạt động nhóm
              </h2>
              <label className="relative min-w-48 flex-1 sm:max-w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-text-faint" />
                <input
                  value={activitySearch}
                  onChange={(event) => {
                    setActivitySearch(event.target.value);
                    setActivityPage(1);
                  }}
                  placeholder="Tìm tên, nội dung, loại..."
                  className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-navy"
                />
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void exportActivities()}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            {activityLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center text-xs text-text-faint">
                Đang tải hoạt động...
              </div>
            ) : activityOverview?.activities.length ? (
              <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
                {activityOverview.activities.map((item) => (
                  <li
                    key={item.id}
                    className="border-l-2 border-primary/30 pl-3 text-xs text-text-muted"
                  >
                    <span className="font-semibold text-navy">
                      {item.actor ?? "Hệ thống"}
                    </span>{" "}
                    {item.action}
                    <span className="mt-0.5 block text-text-faint">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-text-faint">
                Chưa có hoạt động nội dung. Hoạt động mới sẽ được ghi lại tại
                đây.
              </p>
            )}
            <div className="mt-4 rounded-md bg-bg p-3 text-xs text-text-muted">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {activityOverview?.activityPagination.total ?? 0} hoạt động
                  phù hợp
                </span>
                {(activityOverview?.activityPagination.totalPages ?? 0) > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activityPage <= 1}
                      onClick={() =>
                        setActivityPage((page) => Math.max(1, page - 1))
                      }
                      className="font-semibold text-primary disabled:text-text-faint"
                    >
                      Trước
                    </button>
                    <span>
                      {activityPage}/
                      {activityOverview?.activityPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={
                        activityPage >=
                        (activityOverview?.activityPagination.totalPages ?? 1)
                      }
                      onClick={() => setActivityPage((page) => page + 1)}
                      className="font-semibold text-primary disabled:text-text-faint"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
          {overview && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-navy">
                    Kết quả học tập
                  </h2>
                  <p className="mt-1 text-xs text-text-faint">
                    {overview.submissions.accepted} đạt ·{" "}
                    {overview.submissions.failed} chưa đạt ·{" "}
                    {overview.submissions.acceptanceRate}% tỷ lệ đạt
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="mt-4 space-y-2">
                {overview.progressDistribution.map((bucket) => (
                  <DistributionBar
                    key={bucket.key}
                    label={bucket.label}
                    value={bucket.value}
                    total={Math.max(
                      1,
                      overview.members.filter(
                        (member) => member.assignedCount > 0,
                      ).length,
                    )}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-navy">
        {value.toLocaleString("vi-VN")}
      </p>
      <p className="mt-1 text-2xs text-text-faint">{note}</p>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-faint" />
      <div className="min-w-0">
        <dt className="text-2xs font-bold tracking-wide text-text-faint uppercase">
          {label}
        </dt>
        <dd
          className={`mt-1 truncate text-sm font-medium text-navy ${mono ? "font-mono" : ""}`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

function Progress({
  slug,
  overview,
}: {
  slug: string;
  overview: WorkspaceOverview | null;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("progress");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<WorkspaceMember | null>(null);
  if (!overview)
    return (
      <Card className="h-64 animate-pulse bg-border-soft" aria-busy="true" />
    );
  const activeMembers = overview.members.filter(
    (member) => member.assignedCount > 0,
  );
  const topActive = [...activeMembers]
    .sort(
      (a, b) =>
        b.activityCount +
        b.submissionCount -
        (a.activityCount + a.submissionCount),
    )
    .slice(0, 6);
  const filtered = activeMembers
    .filter(
      (member) =>
        member.displayName
          .toLocaleLowerCase("vi")
          .includes(search.trim().toLocaleLowerCase("vi")) &&
        (status === "" ||
          (status === "completed" && member.completionRate === 100) ||
          (status === "in_progress" &&
            member.completionRate > 0 &&
            member.completionRate < 100) ||
          (status === "not_started" && member.completionRate === 0) ||
          (status === "at_risk" && member.completionRate < 40)),
    )
    .sort((a, b) =>
      sort === "xp"
        ? b.xp - a.xp
        : sort === "activity"
          ? b.activityCount +
            b.submissionCount -
            (a.activityCount + a.submissionCount)
          : b.completionRate - a.completionRate,
    );
  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const exportProgress = () => {
    downloadCsv(
      `workspace-member-progress-${todayForFile()}.csv`,
      [
        "Thành viên",
        "Email",
        "Tiến độ (%)",
        "Bài hoàn thành",
        "Bài được giao",
        "Tỷ lệ đạt (%)",
        "Lượt nộp",
        "XP",
        "Hoạt động gần nhất",
      ],
      filtered.map((member) => [
        member.displayName,
        member.email ?? "",
        member.completionRate,
        member.completedCount,
        member.assignedCount,
        member.submissionCount
          ? Math.round((member.acceptedCount / member.submissionCount) * 100)
          : 0,
        member.submissionCount,
        member.xp,
        member.lastActiveAt
          ? formatDateTime(member.lastActiveAt)
          : "Chưa hoạt động",
      ]),
    );
  };
  const selectMember = (member: (typeof overview.members)[number]) =>
    setSelected({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.id,
        displayName: member.displayName,
        email: member.email,
        avatarUrl: member.avatarUrl,
      },
    });
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Hoàn thành"
            value={overview.assignments.completionRate}
            note={`${overview.assignments.completed}/${overview.assignments.total} assignment · đơn vị %`}
          />
          <StatCard
            icon={ClipboardCheck}
            label="Lượt nộp"
            value={overview.submissions.total}
            note={`Trung bình ${overview.submissions.averageAttempts} lần/bài`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Tỷ lệ đạt"
            value={overview.submissions.acceptanceRate}
            note={`${overview.submissions.accepted} đạt · ${overview.submissions.failed} chưa đạt · đơn vị %`}
          />
          <StatCard
            icon={RotateCcw}
            label="Nhiều lần nhất"
            value={overview.submissions.maxAttempts}
            note={`Điểm trung bình ${overview.submissions.averageScore}/100`}
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-navy">
                  Nộp bài và hoàn thành trong 14 ngày
                </h2>
                <p className="mt-1 text-xs text-text-faint">
                  Dữ liệu được tổng hợp trực tiếp từ lịch sử submission.
                </p>
              </div>
              <div className="flex gap-3 text-2xs text-text-muted">
                <span>
                  <i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
                  Lượt nộp
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 rounded-full bg-success" />
                  Hoàn thành
                </span>
              </div>
            </div>
            <DualTrend
              submissions={overview.submissionTrend}
              completions={overview.completionTrend}
            />
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">Đạt / Chưa đạt</h2>
            <div className="mt-5 flex items-center justify-center gap-6">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--color-success, #2f855a) ${overview.submissions.acceptanceRate}%, var(--color-border, #e5e7eb) 0)`,
                }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-lg font-bold text-navy">
                  {overview.submissions.acceptanceRate}%
                </div>
              </div>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-text-faint">Đạt</dt>
                  <dd className="font-bold text-success">
                    {overview.submissions.accepted}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-faint">Chưa đạt</dt>
                  <dd className="font-bold text-primary">
                    {overview.submissions.failed}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">
              Phân bố tiến độ thành viên
            </h2>
            <div className="mt-4 space-y-3">
              {overview.progressDistribution.map((bucket) => (
                <DistributionBar
                  key={bucket.key}
                  label={bucket.label}
                  value={bucket.value}
                  total={activeMembers.length}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-md bg-bg px-3 py-2 text-text-muted">
                Đang làm:{" "}
                <b className="text-navy">{overview.assignments.inProgress}</b>
              </span>
              <span className="rounded-md bg-bg px-3 py-2 text-text-muted">
                Nộp trễ:{" "}
                <b className="text-primary">{overview.assignments.late}</b>
              </span>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">
              Thành viên hoạt động nổi bật
            </h2>
            <div className="mt-4 space-y-3">
              {topActive.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <Avatar name={member.displayName} url={member.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-navy">
                      {member.displayName}
                    </p>
                    <p className="text-2xs text-text-faint">
                      {member.submissionCount} lượt nộp · {member.activityCount}{" "}
                      hoạt động
                    </p>
                  </div>
                  <span className="text-xs font-bold text-navy">
                    {member.averageScore}đ
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">
                Hoạt động 4 tuần gần nhất
              </h2>
              <p className="mt-1 text-xs text-text-faint">
                Join, tạo bài, upload tài liệu, thông báo và submission.
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <MiniTrend points={overview.activityTrend} />
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-border-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-navy">
                  Tiến độ từng thành viên
                </h2>
                <p className="mt-1 text-xs text-text-faint">
                  Tìm, lọc và mở chi tiết streak/hoạt động từ dữ liệu assignment
                  thật.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={exportProgress}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm thành viên..."
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
              />
              <Select
                label="Trạng thái tiến độ"
                className="w-full"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Mọi trạng thái" },
                  { value: "completed", label: "Hoàn thành" },
                  { value: "in_progress", label: "Đang học" },
                  { value: "not_started", label: "Chưa bắt đầu" },
                  { value: "at_risk", label: "Có nguy cơ (<40%)" },
                ]}
              />
              <Select
                label="Sắp xếp"
                className="w-full"
                value={sort}
                onChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
                options={[
                  { value: "progress", label: "Tiến độ cao nhất" },
                  { value: "xp", label: "XP cao nhất" },
                  { value: "activity", label: "Hoạt động gần đây" },
                ]}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-bg text-text-faint">
                <tr>
                  <th className="p-3">Thành viên</th>
                  <th className="p-3">Tiến độ</th>
                  <th className="p-3">Bài hoàn thành</th>
                  <th className="p-3">Tỷ lệ đạt</th>
                  <th className="p-3">XP</th>
                  <th className="p-3">Hoạt động gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {pageItems.map((member) => {
                  const passRate = member.submissionCount
                    ? Math.round(
                        (member.acceptedCount / member.submissionCount) * 100,
                      )
                    : 0;
                  return (
                    <tr
                      key={member.id}
                      className="cursor-pointer hover:bg-bg"
                      onClick={() => selectMember(member)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={member.displayName}
                            url={member.avatarUrl}
                          />
                          <span className="font-semibold text-navy">
                            {member.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="w-40">
                          <div className="mb-1 flex justify-between">
                            <span>{member.completionRate}%</span>
                            <span className="text-text-faint">
                              {member.completedCount}/{member.assignedCount}
                            </span>
                          </div>
                          <ProgressBar value={member.completionRate} />
                        </div>
                      </td>
                      <td className="p-3">{member.completedCount}</td>
                      <td className="p-3">{passRate}%</td>
                      <td className="p-3 font-semibold text-navy">
                        {member.xp.toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-text-faint">
                        {member.lastActiveAt
                          ? formatDateTime(member.lastActiveAt)
                          : "Chưa hoạt động"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pageItems.length === 0 && (
              <p className="p-8 text-center text-sm text-text-faint">
                Không có thành viên phù hợp.
              </p>
            )}
          </div>
          <div className="border-t border-border-soft p-3">
            <Pagination
              page={page}
              pageCount={totalPages}
              onChange={setPage}
              label="Phân trang tiến độ thành viên"
            />
          </div>
        </Card>
      </div>
      {selected && (
        <MemberDetailDialog
          slug={slug}
          member={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function DualTrend({
  submissions,
  completions,
}: {
  submissions: WorkspaceOverview["submissionTrend"];
  completions: WorkspaceOverview["completionTrend"];
}) {
  const max = Math.max(
    1,
    ...submissions.map((point) => point.value),
    ...completions.map((point) => point.value),
  );
  return (
    <div className="mt-6 flex h-48 items-end gap-1.5">
      {submissions.map((point, index) => (
        <div
          key={point.label}
          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <span className="hidden text-2xs text-text-faint sm:block">
            {point.value}
          </span>
          <div className="flex h-32 w-full items-end justify-center gap-0.5">
            <div
              className="w-2/5 rounded-t bg-primary"
              style={{ height: `${Math.max(2, (point.value / max) * 100)}%` }}
            />
            <div
              className="w-2/5 rounded-t bg-success"
              style={{
                height: `${Math.max(2, ((completions[index]?.value ?? 0) / max) * 100)}%`,
              }}
            />
          </div>
          <span className="-rotate-45 whitespace-nowrap text-2xs text-text-faint sm:rotate-0">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniTrend({ points }: { points: WorkspaceOverview["activityTrend"] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="mt-5 flex h-32 items-end gap-1 pb-6">
      {points.map((point, index) => (
        <div
          key={`${point.label}-${index}`}
          className="group relative min-w-0 flex-1 rounded-t bg-primary/70 hover:bg-primary"
          style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
          aria-label={`${point.label}: ${point.value} hoạt động`}
        >
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy px-2 py-1 text-2xs text-on-ink shadow group-hover:block">
            {point.label} · {point.value} hoạt động
          </span>
          {(index % 4 === 0 || index === points.length - 1) && (
            <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-2xs text-text-faint">
              {point.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold text-navy">{value} người</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border-soft">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function JoinRequestsPanel({
  slug,
  status,
  onApproved,
  onCountChange,
}: {
  slug: string;
  status: "pending" | "rejected";
  onApproved: () => void;
  onCountChange?: (count: number) => void;
}) {
  const toast = useToast();
  const [requests, setRequests] = useState<WorkspaceJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.workspaces.joinRequests(slug, status);
      setRequests(response.items);
      if (status === "pending") onCountChange?.(response.items.length);
    } catch (cause) {
      toast.error(messageOf(cause, "Không tải được yêu cầu tham gia."));
    } finally {
      setLoading(false);
    }
  }, [onCountChange, slug, status, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  const review = async (
    request: WorkspaceJoinRequest,
    decision: "approve" | "reject",
  ) => {
    setReviewingId(request.id);
    try {
      await api.workspaces.reviewJoinRequest(slug, request.id, decision);
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
      if (status === "pending")
        onCountChange?.(Math.max(0, requests.length - 1));
      if (decision === "approve") onApproved();
      toast.success(
        decision === "approve" ? "Đã duyệt thành viên" : "Đã từ chối yêu cầu",
      );
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể xử lý yêu cầu."));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-navy">
            {status === "pending" ? "Duyệt thành viên" : "Yêu cầu đã từ chối"}
          </h2>
          <p className="text-xs text-text-faint">
            {status === "pending"
              ? "Yêu cầu từ nhóm đặt chế độ “Cần duyệt” sẽ xuất hiện tại đây."
              : "Lịch sử yêu cầu đã bị từ chối."}
          </p>
        </div>
        <Badge tone={requests.length > 0 ? "brown" : "neutral"}>
          {loading
            ? "Đang tải"
            : status === "pending"
              ? `${requests.length} chờ duyệt`
              : `${requests.length} đã từ chối`}
        </Badge>
      </div>
      {loading ? (
        <div className="h-20 animate-pulse bg-border-soft/40" />
      ) : requests.length === 0 ? (
        <p className="px-4 py-5 text-xs text-text-faint">
          {status === "pending"
            ? "Không có yêu cầu tham gia đang chờ."
            : "Chưa có yêu cầu bị từ chối."}
        </p>
      ) : (
        <ul className="divide-y divide-border-soft">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <Avatar
                name={request.user.displayName}
                url={request.user.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {request.user.displayName}
                </p>
                <p className="truncate text-xs text-text-faint">
                  {request.user.email ?? "Không có email"} · Gửi lúc{" "}
                  {formatDateTime(request.createdAt)}
                </p>
                {request.message && (
                  <p className="mt-1 text-xs text-text-muted">
                    {request.message}
                  </p>
                )}
              </div>
              {status === "pending" && (
                <>
                  <Button
                    size="sm"
                    disabled={reviewingId !== null}
                    onClick={() => void review(request, "approve")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId !== null}
                    onClick={() => void review(request, "reject")}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Members({
  slug,
  overview,
  viewerRole,
  revision,
  pending,
  pendingJoinRequestCount,
  onJoinRequestCountChange,
  onChangeRole,
  onRemove,
}: {
  slug: string;
  overview: WorkspaceOverview | null;
  viewerRole: WorkspaceRole;
  revision: number;
  pending: boolean;
  pendingJoinRequestCount: number;
  onJoinRequestCountChange: (count: number) => void;
  onChangeRole: (
    member: WorkspaceMember,
    role: Exclude<WorkspaceRole, "owner">,
  ) => Promise<void>;
  onRemove: (member: WorkspaceMember) => void;
}) {
  const toast = useToast();
  const [data, setData] = useState({
    items: [] as WorkspaceMember[],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    canManage: false,
    canViewPrivate: false,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [progress, setProgress] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkspaceMember | null>(null);
  const [membershipView, setMembershipView] = useState<
    "current" | "pending" | "rejected" | "all"
  >("current");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.workspaces.members(slug, {
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: (role || undefined) as WorkspaceRole | undefined,
        progress: (progress || undefined) as
          "not_started" | "in_progress" | "completed" | undefined,
        activityLevel: (activityLevel || undefined) as
          "low" | "medium" | "high" | undefined,
        submissionStatus: (submissionStatus || undefined) as
          "not_submitted" | "submitted" | "passed" | undefined,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
      });
      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
        return;
      }
      setData(response);
    } catch (cause) {
      toast.error(messageOf(cause, "Không tải được danh sách thành viên."));
    } finally {
      setLoading(false);
    }
  }, [
    activityLevel,
    joinedFrom,
    joinedTo,
    page,
    progress,
    role,
    search,
    slug,
    submissionStatus,
    toast,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load, revision]);

  const changeFilter = (setValue: (value: string) => void, value: string) => {
    setValue(value);
    setPage(1);
  };
  const canManage = viewerRole === "owner" && data.canManage;
  const canViewPrivate = viewerRole !== "member" && data.canViewPrivate;
  const exportMembers = async () => {
    try {
      const response = await api.workspaces.members(slug, {
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        role: (role || undefined) as WorkspaceRole | undefined,
        progress: (progress || undefined) as
          "not_started" | "in_progress" | "completed" | undefined,
        activityLevel: (activityLevel || undefined) as
          "low" | "medium" | "high" | undefined,
        submissionStatus: (submissionStatus || undefined) as
          "not_submitted" | "submitted" | "passed" | undefined,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
      });
      downloadCsv(
        `workspace-members-${todayForFile()}.csv`,
        [
          "Thành viên",
          "Email",
          "Vai trò",
          "Ngày tham gia",
          "Tiến độ (%)",
          "Lượt nộp",
          "XP",
        ],
        response.items.map((member) => {
          const stats = overview?.members.find((item) => item.id === member.id);
          return [
            member.user.displayName,
            canViewPrivate ? (stats?.email ?? "") : "",
            ROLE_LABEL[member.role],
            formatDate(member.joinedAt),
            stats?.completionRate ?? 0,
            stats?.submissionCount ?? 0,
            stats?.xp ?? 0,
          ];
        }),
      );
    } catch (error) {
      toast.error(messageOf(error, "Không thể xuất danh sách thành viên."));
    }
  };

  return (
    <>
      {viewerRole === "owner" && (
        <div className="mb-4 flex justify-end">
          <Select
            label="Hiển thị thành viên"
            className="w-full sm:w-56"
            value={membershipView}
            onChange={(value) =>
              setMembershipView(value as typeof membershipView)
            }
            options={[
              { value: "current", label: "Thành viên hiện tại" },
              {
                value: "pending",
                label: `Chờ duyệt (${pendingJoinRequestCount})`,
              },
              { value: "rejected", label: "Đã từ chối" },
              { value: "all", label: "Tất cả" },
            ]}
          />
        </div>
      )}
      {viewerRole === "owner" &&
        (membershipView === "pending" || membershipView === "all") && (
          <div className="mb-4">
            <JoinRequestsPanel
              slug={slug}
              status="pending"
              onApproved={() => void load()}
              onCountChange={onJoinRequestCountChange}
            />
          </div>
        )}
      {viewerRole === "owner" &&
        (membershipView === "rejected" || membershipView === "all") && (
          <div className="mb-4">
            <JoinRequestsPanel
              slug={slug}
              status="rejected"
              onApproved={() => void load()}
            />
          </div>
        )}
      {(membershipView === "current" ||
        membershipView === "all" ||
        viewerRole !== "owner") && (
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-navy">Thành viên</h2>
              <p className="text-xs text-text-faint">
                Tìm kiếm, lọc và quản lý thành viên mà không tải lại Workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{data.total} người</Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void exportMembers()}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="grid gap-3 border-b border-border-soft bg-bg/60 p-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy xl:col-span-2"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(event) => changeFilter(setSearch, event.target.value)}
            />
            <Select
              label="Vai trò"
              className="w-full"
              value={role}
              onChange={(value) => changeFilter(setRole, value)}
              options={[
                { value: "", label: "Tất cả vai trò" },
                { value: "owner", label: "Chủ nhóm" },
                { value: "deputy", label: "Phó nhóm" },
                { value: "member", label: "Thành viên" },
              ]}
            />
            <Select
              label="Tiến độ"
              className="w-full"
              value={progress}
              onChange={(value) => changeFilter(setProgress, value)}
              options={[
                { value: "", label: "Mọi tiến độ" },
                { value: "not_started", label: "Chưa bắt đầu" },
                { value: "in_progress", label: "Đang học" },
                { value: "completed", label: "Đã hoàn thành" },
              ]}
            />
            <Select
              label="Mức hoạt động"
              className="w-full"
              value={activityLevel}
              onChange={(value) => changeFilter(setActivityLevel, value)}
              options={[
                { value: "", label: "Mọi mức hoạt động" },
                { value: "high", label: "Tích cực" },
                { value: "medium", label: "Trung bình" },
                { value: "low", label: "Ít hoạt động" },
              ]}
            />
            <Select
              label="Bài nộp"
              className="w-full"
              value={submissionStatus}
              onChange={(value) => changeFilter(setSubmissionStatus, value)}
              options={[
                { value: "", label: "Mọi trạng thái" },
                { value: "not_submitted", label: "Chưa nộp" },
                { value: "submitted", label: "Đã nộp" },
                { value: "passed", label: "Đã đạt" },
              ]}
            />
            <label className="grid gap-1 text-xs font-medium text-text-muted">
              <span>Tham gia từ</span>
              <input
                type="date"
                value={joinedFrom}
                onChange={(event) =>
                  changeFilter(setJoinedFrom, event.target.value)
                }
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-text-muted">
              <span>Tham gia đến</span>
              <input
                type="date"
                value={joinedTo}
                onChange={(event) =>
                  changeFilter(setJoinedTo, event.target.value)
                }
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
              />
            </label>
          </div>
          <div className="relative min-h-[520px] md:min-h-[670px]">
            {loading && (
              <div
                className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary"
                aria-label="Đang tải trang thành viên"
              />
            )}
            {!loading && data.items.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center px-4 text-center text-sm text-text-faint">
                Không có thành viên phù hợp với bộ lọc.
              </div>
            ) : (
              <ul
                className={`divide-y divide-border-soft transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
              >
                {data.items.map((member) => {
                  const stats = overview?.members.find(
                    (item) => item.id === member.id,
                  );
                  return (
                    <li
                      key={member.id}
                      className="grid min-w-0 cursor-pointer gap-3 px-4 py-3 hover:bg-bg md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                      onClick={() => setSelected(member)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={member.user.displayName}
                          url={member.user.avatarUrl}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy">
                            {member.user.displayName}
                          </p>
                          <p className="truncate text-xs text-text-faint">
                            {canViewPrivate && stats?.email
                              ? stats.email
                              : `Tham gia ${formatDate(member.joinedAt)}`}
                          </p>
                          {stats && (
                            <p className="mt-0.5 text-2xs text-text-muted">
                              {stats.xp.toLocaleString("vi-VN")} XP ·{" "}
                              {stats.submissionCount} lượt nộp ·{" "}
                              {stats.assignedCount
                                ? `${stats.completionRate}% hoàn thành`
                                : "Quản lý nhóm"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
                        <Badge
                          tone={member.role === "owner" ? "brown" : "neutral"}
                        >
                          {ROLE_LABEL[member.role]}
                        </Badge>
                        {canManage && member.role !== "owner" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={(event) => {
                                event.stopPropagation();
                                void onChangeRole(
                                  member,
                                  member.role === "deputy"
                                    ? "member"
                                    : "deputy",
                                );
                              }}
                            >
                              {member.role === "deputy"
                                ? "Hạ xuống thành viên"
                                : "Đặt làm Phó nhóm"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={(event) => {
                                event.stopPropagation();
                                onRemove(member);
                              }}
                            >
                              Loại
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="min-h-14 border-t border-border-soft px-4 py-3">
            <Pagination
              page={data.page}
              pageCount={data.totalPages}
              onChange={setPage}
              label="Phân trang thành viên"
            />
            {data.totalPages <= 1 && (
              <p className="text-xs text-text-faint">
                Trang 1 / {Math.max(data.totalPages, 1)}
              </p>
            )}
          </div>
        </Card>
      )}
      {selected && (
        <MemberDetailDialog
          slug={slug}
          member={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function MemberDetailDialog({
  slug,
  member,
  onClose,
}: {
  slug: string;
  member: WorkspaceMember;
  onClose: () => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<WorkspaceMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.workspaces.memberDetail(slug, member.id));
    } catch (cause) {
      toast.error(messageOf(cause, "Không tải được chi tiết thành viên."));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [slug, member.id, toast, onClose]);
  useEffect(() => {
    void load();
  }, [load]);
  const updatePermission = async (
    permission: WorkspacePermission,
    value: "inherit" | "allow" | "deny",
  ) => {
    setPending(true);
    try {
      const updated = await api.workspaces.updateMemberPermissions(
        slug,
        member.id,
        { [permission]: value === "inherit" ? null : value === "allow" },
      );
      setData(updated);
      toast.success("Đã cập nhật quyền riêng của thành viên");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể cập nhật quyền."));
    } finally {
      setPending(false);
    }
  };
  const resetPermissions = async () => {
    setPending(true);
    try {
      const permissions = Object.fromEntries(
        PERMISSION_LABELS.map(({ key }) => [key, null]),
      ) as Partial<Record<WorkspacePermission, null>>;
      setData(
        await api.workspaces.updateMemberPermissions(
          slug,
          member.id,
          permissions,
        ),
      );
      toast.success("Đã đưa toàn bộ quyền về mặc định theo vai trò");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể reset quyền."));
    } finally {
      setPending(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/35 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
    >
      <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={member.user.displayName}
              url={member.user.avatarUrl}
            />
            <div>
              <h2 className="text-lg font-bold text-navy">
                {member.user.displayName}
              </h2>
              <p className="text-xs text-text-faint">
                {data?.user.email ??
                  member.user.handle ??
                  `${ROLE_LABEL[member.role]} · tham gia ${formatDate(member.joinedAt)}`}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-text-faint">
            Đang tải hồ sơ...
          </div>
        ) : (
          data && (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <MiniStat label="XP" value={data.xp} />
                <MiniStat label="Đã giải" value={data.solvedCount} />
                <MiniStat
                  label="Hoàn thành"
                  value={`${data.assignmentStats.completed}/${data.assignmentStats.assigned}`}
                />
                <MiniStat
                  label="Tỷ lệ đạt"
                  value={`${data.submissionStats.total ? Math.round((data.submissionStats.accepted / data.submissionStats.total) * 100) : 0}%`}
                />
                <MiniStat
                  label="Streak hiện tại"
                  value={`${data.currentStreakDays} ngày`}
                />
                <MiniStat
                  label="Streak dài nhất"
                  value={`${data.longestStreakDays} ngày`}
                />
                <MiniStat label="Ngày hoạt động" value={data.activeDays} />
              </div>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-navy">
                    Mức độ hoạt động (12 tuần)
                  </h3>
                  <span className="ml-auto text-xs text-text-faint">
                    Gần nhất:{" "}
                    {data.lastActiveAt
                      ? formatDateTime(data.lastActiveAt)
                      : "Chưa có"}
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
                    {data.activityHeatmap.map((day) => (
                      <span
                        key={day.date}
                        title={`${formatDate(day.date)} · ${day.count} hoạt động`}
                        aria-label={`${day.date}: ${day.count} hoạt động`}
                        className={`h-4 w-4 rounded ${day.count === 0 ? "bg-border-soft" : day.count < 3 ? "bg-primary/25" : day.count < 6 ? "bg-primary/60" : "bg-primary"}`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
              {data.access === "manager" &&
                data.permissions &&
                data.roleDefaults &&
                data.overrides && (
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-navy">
                          Quyền hiệu lực
                        </h3>
                        <p className="mt-1 text-xs text-text-faint">
                          Mỗi quyền hiển thị rõ đang kế thừa vai trò hay đã tùy
                          chỉnh riêng.
                        </p>
                      </div>
                      {data.canManagePermissions &&
                        Object.keys(data.overrides).length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => void resetPermissions()}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset về mặc định
                          </Button>
                        )}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PERMISSION_LABELS.map(({ key, label, description }) => {
                        const override = data.overrides?.[key];
                        const value =
                          override === undefined
                            ? "inherit"
                            : override
                              ? "allow"
                              : "deny";
                        return (
                          <div
                            key={key}
                            className="rounded border border-border-soft p-3"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <span>
                                <span className="block text-xs font-semibold text-navy">
                                  {label}
                                </span>
                                <span className="text-2xs text-text-faint">
                                  {description}
                                </span>
                              </span>
                              <Badge
                                tone={
                                  override === undefined ? "neutral" : "brown"
                                }
                              >
                                {override === undefined
                                  ? "Kế thừa"
                                  : "Tùy chỉnh"}
                              </Badge>
                            </div>
                            <p className="mb-2 text-2xs text-text-muted">
                              Hiệu lực:{" "}
                              <b>
                                {data.permissions?.[key]
                                  ? "Cho phép"
                                  : "Không cho phép"}
                              </b>
                            </p>
                            {data.canManagePermissions && (
                              <Select
                                label="Nguồn quyền"
                                className="w-full"
                                value={value}
                                onChange={(next) =>
                                  void updatePermission(
                                    key,
                                    next as "inherit" | "allow" | "deny",
                                  )
                                }
                                options={[
                                  {
                                    value: "inherit",
                                    label: `Theo vai trò (${data.roleDefaults?.[key] ? "Cho phép" : "Không"})`,
                                  },
                                  { value: "allow", label: "Cho phép riêng" },
                                  { value: "deny", label: "Từ chối riêng" },
                                ]}
                                disabled={pending}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              {data.access === "manager" && (
                <Card className="p-4">
                  <h3 className="text-sm font-bold text-navy">
                    Hoạt động gần đây
                  </h3>
                  {data.recentActivities?.length ? (
                    <ul className="mt-3 space-y-2">
                      {data.recentActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="border-l-2 border-primary/30 pl-3 text-xs text-text-muted"
                        >
                          {activity.action}
                          <span className="block text-text-faint">
                            {formatDateTime(activity.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-text-faint">
                      Chưa có hoạt động.
                    </p>
                  )}
                </Card>
              )}
              {data.access === "public" && (
                <p className="rounded-md bg-bg p-3 text-xs text-text-muted">
                  Hồ sơ công khai chỉ hiển thị tiến độ, submission tổng quan và
                  streak; activity chi tiết cùng quyền quản trị đã được ẩn.
                </p>
              )}
            </div>
          )
        )}
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-3">
      <p className="text-2xs uppercase text-text-faint">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
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
  const [privacy, setPrivacy] = useState(detail.privacy);
  const [joinPolicy, setJoinPolicy] = useState(detail.joinPolicy);
  const [coverPosition, setCoverPosition] = useState(detail.coverPosition);
  const [coverFit, setCoverFit] = useState(detail.coverFit);
  const [coverHeight, setCoverHeight] = useState(detail.coverHeight);
  const [transferTo, setTransferTo] = useState("");
  const [pending, setPending] = useState(false);
  const [coverPreview, setCoverPreview] = useState(detail.coverUrl);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const updated = await api.workspaces.update(detail.slug, {
        name,
        description,
        topic,
        privacy,
        joinPolicy,
        coverPosition,
        coverFit,
        coverHeight,
      });
      onSaved(updated);
      toast.success("Đã lưu thay đổi nhóm");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể lưu thay đổi."));
    } finally {
      setPending(false);
    }
  };

  const uploadCover = async (file: File) => {
    setPending(true);
    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    try {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
        throw new Error("Ảnh phải là PNG/JPG/WebP và không quá 5 MB");
      const signed = await api.workspaces.assetUploadUrl(detail.slug, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        kind: "cover",
      });
      await putAsset(signed.uploadUrl, signed.headers, file);
      const updated = await api.workspaces.update(detail.slug, {
        coverUrl: signed.publicUrl,
        coverKey: signed.objectKey,
      });
      const preview = await api.workspaces.coverPreview(detail.slug);
      const resolved = { ...updated, coverUrl: preview.url };
      onSaved(resolved);
      setCoverPreview(preview.url);
      toast.success("Đã lưu ảnh bìa trên S3");
    } catch (cause) {
      setCoverPreview(detail.coverUrl);
      toast.error(messageOf(cause, "Không thể tải ảnh."));
    } finally {
      URL.revokeObjectURL(localPreview);
      setPending(false);
    }
  };
  const removeCover = async () => {
    setPending(true);
    try {
      const updated = await api.workspaces.update(detail.slug, {
        coverUrl: null,
        coverKey: null,
      });
      setCoverPreview(null);
      onSaved(updated);
      toast.success("Đã gỡ ảnh bìa và dùng giao diện mặc định");
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể gỡ ảnh bìa."));
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
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-text-faint" />
          <h2 className="text-sm font-bold text-navy">Thông tin nhóm</h2>
        </div>
        <form onSubmit={save} className="space-y-3">
          <label className="block text-xs font-medium text-text-muted">
            Tên nhóm
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            Chủ đề
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              maxLength={100}
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-text-muted">
              Hiển thị
              <Select
                label="Hiển thị nhóm"
                className="w-full"
                value={privacy}
                onChange={(value) => setPrivacy(value as "public" | "private")}
                options={[
                  { value: "public", label: "Công khai" },
                  { value: "private", label: "Riêng tư" },
                ]}
              />
            </label>
            <label className="block text-xs font-medium text-text-muted">
              Cách tham gia
              <Select
                label="Cách tham gia"
                className="w-full"
                value={joinPolicy}
                onChange={(value) =>
                  setJoinPolicy(value as "open" | "approval" | "invite_only")
                }
                options={[
                  { value: "open", label: "Tham gia ngay" },
                  { value: "approval", label: "Cần duyệt" },
                  { value: "invite_only", label: "Chỉ bằng mã mời" },
                ]}
              />
            </label>
          </div>
          <div className="overflow-hidden rounded-lg border border-border-soft">
            <div
              className={`flex items-center justify-center bg-navy bg-no-repeat transition-[height] ${
                coverHeight === "compact"
                  ? "h-24"
                  : coverHeight === "tall"
                    ? "h-48"
                    : "h-32"
              }`}
              style={
                coverPreview
                  ? {
                      backgroundImage: `url(${coverPreview})`,
                      backgroundPosition: coverPosition,
                      backgroundSize: coverFit,
                    }
                  : undefined
              }
            >
              {coverPreview ? (
                <span className="rounded bg-navy/60 px-2 py-1 text-xs font-semibold text-on-ink">
                  Xem trước ảnh bìa
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs font-semibold text-on-ink">
                  <ImageIcon className="h-4 w-4" />
                  Ảnh bìa mặc định
                </span>
              )}
            </div>
            {coverPreview && (
              <div className="flex justify-end border-t border-border-soft p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => void removeCover()}
                >
                  <X className="h-3.5 w-3.5" />
                  Gỡ ảnh bìa
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Vị trí ảnh"
              value={coverPosition}
              onChange={(value) =>
                setCoverPosition(value as typeof coverPosition)
              }
              className="w-full"
              options={[
                { value: "top", label: "Phía trên" },
                { value: "center", label: "Chính giữa" },
                { value: "bottom", label: "Phía dưới" },
              ]}
            />
            <Select
              label="Cách hiển thị"
              value={coverFit}
              onChange={(value) => setCoverFit(value as typeof coverFit)}
              className="w-full"
              options={[
                { value: "cover", label: "Phủ đầy khung" },
                { value: "contain", label: "Hiển thị toàn ảnh" },
              ]}
            />
            <Select
              label="Chiều cao"
              value={coverHeight}
              onChange={(value) => setCoverHeight(value as typeof coverHeight)}
              className="w-full"
              options={[
                { value: "compact", label: "Gọn" },
                { value: "medium", label: "Vừa" },
                { value: "tall", label: "Cao" },
              ]}
            />
          </div>
          <div>
            <label className="block cursor-pointer rounded-md border border-dashed border-border p-3 text-center text-xs font-semibold text-navy">
              Chọn và lưu ảnh bìa
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={pending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadCover(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <Button size="sm" type="submit" disabled={pending}>
            <Save className="h-3.5 w-3.5" />
            Lưu thay đổi
          </Button>
        </form>
      </Card>
      <div className="space-y-4">
        {detail.rolePermissions && (
          <RolePermissionsPanel detail={detail} onSaved={onSaved} />
        )}
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-bold text-navy">
            Chuyển quyền sở hữu
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-text-faint">
            Bạn sẽ trở thành Phó nhóm sau khi chuyển quyền. Chủ nhóm mới có thể
            quản lý thành viên và lưu trữ nhóm.
          </p>
          <Select
            label="Chủ nhóm mới"
            className="w-full"
            value={transferTo}
            onChange={setTransferTo}
            options={[
              { value: "", label: "Chọn thành viên" },
              ...members.map((member) => ({
                value: member.id,
                label: member.user.displayName,
              })),
            ]}
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={!transferTo || pending}
            onClick={() => void transfer()}
          >
            <Crown className="h-3.5 w-3.5" />
            Chuyển quyền
          </Button>
        </Card>
        <Card className="border-primary/30 p-5">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-navy">Lưu trữ nhóm</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text-faint">
            Lưu trữ giữ nguyên dữ liệu và không xoá bài nộp. Đây là lựa chọn an
            toàn thay cho xoá vĩnh viễn.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={onArchive}
          >
            Lưu trữ nhóm
          </Button>
        </Card>
      </div>
    </div>
  );
}

function RolePermissionsPanel({
  detail,
  onSaved,
}: {
  detail: WorkspaceDetail;
  onSaved: (detail: WorkspaceDetail) => void;
}) {
  const toast = useToast();
  const [permissions, setPermissions] = useState(detail.rolePermissions);
  const [pending, setPending] = useState(false);

  if (!permissions) return null;

  const toggle = (
    role: Exclude<WorkspaceRole, "owner">,
    permission: WorkspacePermission,
  ) => {
    setPermissions(
      (current) =>
        current && {
          ...current,
          [role]: {
            ...current[role],
            [permission]: !current[role][permission],
          },
        },
    );
  };

  const save = async () => {
    setPending(true);
    try {
      await api.workspaces.updateRolePermissions(
        detail.slug,
        "deputy",
        permissions.deputy,
      );
      const updated = await api.workspaces.updateRolePermissions(
        detail.slug,
        "member",
        permissions.member,
      );
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
      <p className="mt-1 text-xs leading-relaxed text-text-faint">
        Chủ nhóm luôn có toàn quyền. Những thay đổi này áp dụng mặc định cho Phó
        nhóm và Thành viên.
      </p>
      <div className="mt-4 space-y-3">
        {(["deputy", "member"] as const).map((role) => (
          <fieldset
            key={role}
            className="rounded-md border border-border-soft p-3"
          >
            <legend className="px-1 text-xs font-bold text-navy">
              {ROLE_LABEL[role]}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_LABELS.map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-xs text-text hover:bg-surface-muted"
                >
                  <input
                    type="checkbox"
                    checked={permissions[role][key]}
                    onChange={() => toggle(role, key)}
                    disabled={pending}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block font-medium text-navy">{label}</span>
                    <span className="text-text-faint">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-4"
        disabled={pending}
        onClick={() => void save()}
      >
        <Save className="h-3.5 w-3.5" />
        Lưu quyền
      </Button>
    </Card>
  );
}

function initialsOf(value: string): string {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "NH"
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <span
      role="img"
      aria-label={`Avatar ${name}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy bg-cover bg-center text-xs font-bold text-on-ink"
      style={
        url
          ? { backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }
          : undefined
      }
    >
      {url ? (
        <span className="sr-only">{initialsOf(name)}</span>
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function todayForFile(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError
    ? cause.message
    : cause instanceof Error
      ? cause.message
      : fallback;
}

function putAsset(url: string, headers: Record<string, string>, file: File) {
  return fetch(url, { method: "PUT", headers, body: file }).then((response) => {
    if (!response.ok) throw new Error(`Storage trả ${response.status}`);
  });
}
