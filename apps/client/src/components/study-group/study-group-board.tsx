"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Crown,
  Layers3,
  SearchX,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { FilterBar, SegmentedTabs, StatStrip, useToast } from "@codementor/ui";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type {
  WorkspaceListItem,
  WorkspaceSummary,
} from "@/features/workspace/types";
import type { StudyGroup } from "@/types/study-group";
import { StudyGroupActions } from "./study-group-actions";
import { StudyGroupCard } from "./study-group-card";

type Scope = "all" | "mine" | "owned" | "joined" | "public";

const SCOPE_META: Record<
  Scope,
  { label: string; title: string; hint: string; icon: LucideIcon }
> = {
  all: {
    label: "Tất cả",
    title: "Tất cả Workspace",
    hint: "Nhóm của bạn và các nhóm công khai",
    icon: Layers3,
  },
  mine: {
    label: "Nhóm của tôi",
    title: "Nhóm của tôi",
    hint: "Tất cả nhóm bạn đang là thành viên",
    icon: UsersRound,
  },
  owned: {
    label: "Tôi quản lý",
    title: "Nhóm bạn quản lý",
    hint: "Bạn có toàn quyền quản lý nhóm",
    icon: Crown,
  },
  joined: {
    label: "Đã tham gia",
    title: "Nhóm bạn đã tham gia",
    hint: "Nhóm do người khác làm chủ",
    icon: UsersRound,
  },
  public: {
    label: "Nhóm công khai",
    title: "Nhóm công khai nổi bật",
    hint: "Chỉ gồm nhóm đã được Chủ nhóm công khai, ưu tiên nhóm đông và hoạt động gần đây",
    icon: Compass,
  },
};

function GroupSection({
  icon: Icon,
  title,
  hint,
  groups,
  emptyMessage,
  onRequestJoin,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  groups: StudyGroup[];
  emptyMessage: string;
  onRequestJoin?: (group: StudyGroup) => void;
}) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center gap-2.5 border-b border-border-soft pb-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-border-soft text-navy">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy">{title}</h2>
          <p className="truncate text-xs text-text-faint">{hint}</p>
        </div>
        <span className="rounded-full bg-border-soft px-2 py-0.5 text-2xs font-semibold text-text-faint">
          {groups.length}
        </span>
      </div>
      {groups.length === 0 ? (
        <p className="px-1 py-4 text-xs text-text-faint">{emptyMessage}</p>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={title}
        >
          {groups.map((group) => (
            <li key={group.id}>
              <StudyGroupCard group={group} onRequestJoin={onRequestJoin} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StudyGroupBoard({ initialScope = "mine" }: { initialScope?: Scope }) {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>(initialScope);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [pageByScope, setPageByScope] = useState<Record<Scope, number>>({
    all: 1,
    mine: 1,
    owned: 1,
    joined: 1,
    public: 1,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (
    nextScope: Scope,
    nextSearch: string,
    nextPage: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [page, nextSummary] = await Promise.all([
        api.workspaces.list({
          scope: nextScope,
          q: nextSearch.trim() || undefined,
          page: nextPage,
          limit: 8,
        }),
        api.workspaces.summary(),
      ]);
      const itemsWithSignedCovers = await Promise.all(
        page.items.map(async (item) => {
          if (!item.coverUrl || !item.role) return item;
          try {
            const preview = await api.workspaces.coverPreview(item.slug);
            return { ...item, coverUrl: preview.url ?? item.coverUrl };
          } catch {
            return item;
          }
        }),
      );
      setGroups(itemsWithSignedCovers.map(toStudyGroup));
      setTotalPages(page.totalPages);
      setTotal(page.total);
      setSummary(nextSummary);
    } catch (cause) {
      setError(
        messageOf(cause, "Không tải được danh sách nhóm. Vui lòng thử lại."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(
      () => void load(scope, search, pageByScope[scope]),
      search === "" ? 0 : 350,
    );
    return () => window.clearTimeout(timer);
  }, [scope, search, pageByScope]);

  useEffect(() => {
    const refresh = () => void load(scope, search, pageByScope[scope]);
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("workspace-unread-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("workspace-unread-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [scope, search, pageByScope]);

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope);
    const url = new URL(window.location.href);
    if (nextScope === "public") url.searchParams.set("tab", "public");
    else url.searchParams.delete("tab");
    window.history.replaceState(window.history.state, "", url);
  };
  const changeSearch = (value: string) => {
    setSearch(value);
    setPageByScope((current) => ({ ...current, [scope]: 1 }));
  };

  const create = async (name: string, description: string) => {
    const created = await api.workspaces.create({
      name,
      description: description || undefined,
    });
    toast.success(`Đã tạo nhóm “${created.name}”`);
    setScope("owned");
    setSearch("");
    setPageByScope((current) => ({ ...current, owned: 1 }));
    await load("owned", "", 1);
  };

  const join = async (code: string) => {
    const result = await api.workspaces.join(code);
    if (result.status === "pending") {
      toast.success(
        "Đã gửi yêu cầu. Chủ nhóm sẽ duyệt trước khi bạn tham gia.",
      );
      return;
    }
    toast.success("Đã tham gia nhóm học tập");
    window.location.assign(`/workspace/${result.workspaceSlug}`);
  };

  const requestAccess = async (group: StudyGroup) => {
    try {
      const result = await api.workspaces.requestJoin(group.id);
      if (result.status === "joined") {
        toast.success(`Đã tham gia nhóm “${group.name}”`);
        window.location.assign(`/workspace/${group.id}`);
        return;
      }
      toast.success(`Đã gửi yêu cầu tham gia “${group.name}”`);
      await load(scope, search, pageByScope[scope]);
    } catch (cause) {
      toast.error(messageOf(cause, "Không thể gửi yêu cầu tham gia."));
    }
  };

  const retry = () => void load(scope, search, pageByScope[scope]);
  const noResults = !loading && !error && groups.length === 0;

  return (
    <div>
      <StatStrip
        className="mb-5"
        stats={[
          { label: "Nhóm", value: summary?.total ?? "–" },
          { label: "Bạn quản lý", value: summary?.owned ?? "–" },
          { label: "Đã tham gia", value: summary?.joined ?? "–" },
        ]}
      />

      <StudyGroupActions onJoin={join} onCreate={create} />

      <SegmentedTabs
        className="mb-4"
        value={scope}
        onChange={(value) => changeScope(value as Scope)}
        options={[
          { value: "all", label: "Tất cả" },
          { value: "mine", label: "Nhóm của tôi" },
          { value: "owned", label: "Tôi quản lý" },
          { value: "joined", label: "Đã tham gia" },
          { value: "public", label: "Nhóm công khai" },
        ]}
      />

      <FilterBar
        className="mb-5"
        searchValue={search}
        onSearchChange={changeSearch}
        searchPlaceholder="Tìm nhóm theo tên, mô tả hoặc chủ đề..."
      />

      {error ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-semibold text-navy">
            Không tải được nhóm học tập
          </p>
          <p className="mt-1 text-xs text-text-faint">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            Thử lại
          </button>
        </Card>
      ) : loading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Đang tải nhóm học tập"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="h-56 animate-pulse bg-border-soft" />
          ))}
        </div>
      ) : noResults ? (
        <Card className="border-dashed p-10 text-center">
          <SearchX className="mx-auto mb-2 h-5 w-5 text-text-faint" />
          <p className="text-sm font-semibold text-navy">
            Không có nhóm nào khớp điều kiện
          </p>
          <p className="mt-1 text-xs text-text-faint">
            {scope === "public"
              ? "Chưa có nhóm công khai nào phù hợp."
              : "Thử từ khóa khác hoặc tham gia nhóm bằng mã mời."}
          </p>
        </Card>
      ) : (
        <GroupSection
          icon={SCOPE_META[scope].icon}
          title={SCOPE_META[scope].title}
          hint={`${SCOPE_META[scope].hint} · ${total} nhóm`}
          groups={groups}
          emptyMessage="Không có nhóm nào khớp điều kiện."
          onRequestJoin={(group) => void requestAccess(group)}
        />
      )}

      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Phân trang nhóm học tập"
          className="mt-2 flex items-center justify-between gap-3 border-t border-border-soft pt-4"
        >
          <button
            type="button"
            disabled={pageByScope[scope] <= 1}
            onClick={() =>
              setPageByScope((current) => ({
                ...current,
                [scope]: Math.max(1, current[scope] - 1),
              }))
            }
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs font-medium text-text-faint">
            Trang {pageByScope[scope]} / {totalPages} · 8 nhóm/trang
          </span>
          <button
            type="button"
            disabled={pageByScope[scope] >= totalPages}
            onClick={() =>
              setPageByScope((current) => ({
                ...current,
                [scope]: Math.min(totalPages, current[scope] + 1),
              }))
            }
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}

function toStudyGroup(group: WorkspaceListItem): StudyGroup {
  const now = Date.now();
  return {
    id: group.slug,
    tile: initialsOf(group.name),
    name: group.name,
    description: group.description ?? "Chưa có mô tả cho nhóm học tập này.",
    coverUrl: group.coverUrl,
    coverPosition: group.coverPosition,
    coverFit: group.coverFit,
    coverHeight: group.coverHeight,
    code: "",
    topic: group.topic ?? "Chưa phân loại",
    memberCount: group.memberCount,
    memberPreview: group.memberPreview.map((member) => ({
      id: member.id,
      initials: initialsOf(member.displayName),
      name: member.displayName,
    })),
    openTaskCount: group.openTaskCount,
    progressPercent: group.progressPercent,
    unreadCount: group.unreadCount,
    lastActiveMinutesAgo: Math.max(
      0,
      Math.floor((now - new Date(group.lastActivityAt).getTime()) / 60_000),
    ),
    role: group.role ?? "guest",
    ownerName: group.owner.displayName,
  };
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

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError ? cause.message : fallback;
}
