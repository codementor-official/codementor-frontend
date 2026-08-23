"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, SearchX, UsersRound, type LucideIcon } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { FilterBar, SegmentedTabs, StatStrip, useToast } from "@codementor/ui";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { isOwned } from "@/lib/study-group/study-group-stats";
import type { WorkspaceListItem, WorkspaceSummary } from "@/features/workspace/types";
import type { StudyGroup } from "@/types/study-group";
import { StudyGroupActions } from "./study-group-actions";
import { StudyGroupCard } from "./study-group-card";

type Scope = "all" | "owned" | "joined";

function GroupSection({
  icon: Icon,
  title,
  hint,
  groups,
  emptyMessage,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  groups: StudyGroup[];
  emptyMessage: string;
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={title}>
          {groups.map((group) => (
            <li key={group.id}><StudyGroupCard group={group} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StudyGroupBoard() {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursor = cursorStack.at(-1) ?? null;
  const load = async (nextScope: Scope, nextSearch: string, nextCursorValue: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const [page, nextSummary] = await Promise.all([
        api.workspaces.list({
          scope: nextScope,
          q: nextSearch.trim() || undefined,
          cursor: nextCursorValue ?? undefined,
          limit: 12,
        }),
        api.workspaces.summary(),
      ]);
      setGroups(page.items.map(toStudyGroup));
      setNextCursor(page.nextCursor);
      setSummary(nextSummary);
    } catch (cause) {
      setError(messageOf(cause, "Không tải được danh sách nhóm. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(scope, search, cursor), search === "" ? 0 : 350);
    return () => window.clearTimeout(timer);
  }, [scope, search, cursor]);

  const changeScope = (nextScope: Scope) => {
    setScope(nextScope);
    setCursorStack([null]);
  };
  const changeSearch = (value: string) => {
    setSearch(value);
    setCursorStack([null]);
  };

  const ownedGroups = useMemo(() => groups.filter(isOwned), [groups]);
  const joinedGroups = useMemo(() => groups.filter((group) => !isOwned(group)), [groups]);

  const create = async (name: string, description: string) => {
    const created = await api.workspaces.create({ name, description: description || undefined });
    toast.success(`Đã tạo nhóm “${created.name}”`);
    setScope("owned");
    setSearch("");
    setCursorStack([null]);
    await load("owned", "", null);
  };

  const join = async (code: string) => {
    const workspace = await api.workspaces.join(code);
    toast.success(`Đã tham gia nhóm “${workspace.name}”`);
    window.location.assign(`/workspace/${workspace.slug}`);
  };

  const retry = () => void load(scope, search, cursor);
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
          { value: "owned", label: "Tôi quản lý" },
          { value: "joined", label: "Đã tham gia" },
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
          <p className="text-sm font-semibold text-navy">Không tải được nhóm học tập</p>
          <p className="mt-1 text-xs text-text-faint">{error}</p>
          <button type="button" onClick={retry} className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover">
            Thử lại
          </button>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Đang tải nhóm học tập">
          {Array.from({ length: 4 }, (_, index) => <Card key={index} className="h-56 animate-pulse bg-border-soft" />)}
        </div>
      ) : noResults ? (
        <Card className="border-dashed p-10 text-center">
          <SearchX className="mx-auto mb-2 h-5 w-5 text-text-faint" />
          <p className="text-sm font-semibold text-navy">Không có nhóm nào khớp điều kiện</p>
          <p className="mt-1 text-xs text-text-faint">Thử từ khóa khác hoặc tham gia nhóm bằng mã mời.</p>
        </Card>
      ) : scope === "all" ? (
        <>
          <GroupSection icon={Crown} title="Nhóm bạn quản lý" hint="Bạn có toàn quyền quản lý nhóm" groups={ownedGroups} emptyMessage="Bạn chưa tạo nhóm nào trên trang này." />
          <GroupSection icon={UsersRound} title="Nhóm bạn đã tham gia" hint="Nhóm do người khác làm chủ" groups={joinedGroups} emptyMessage="Bạn chưa tham gia nhóm nào trên trang này." />
        </>
      ) : (
        <GroupSection
          icon={scope === "owned" ? Crown : UsersRound}
          title={scope === "owned" ? "Nhóm bạn quản lý" : "Nhóm bạn đã tham gia"}
          hint={scope === "owned" ? "Bạn có toàn quyền quản lý nhóm" : "Nhóm do người khác làm chủ"}
          groups={groups}
          emptyMessage="Không có nhóm nào khớp điều kiện."
        />
      )}

      {!loading && !error && (cursorStack.length > 1 || nextCursor) && (
        <nav aria-label="Phân trang nhóm học tập" className="mt-2 flex items-center justify-between gap-3 border-t border-border-soft pt-4">
          <button
            type="button"
            disabled={cursorStack.length <= 1}
            onClick={() => setCursorStack((history) => history.slice(0, -1))}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={!nextCursor}
            onClick={() => nextCursor && setCursorStack((history) => [...history, nextCursor])}
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
    lastActiveMinutesAgo: Math.max(0, Math.floor((now - new Date(group.lastActivityAt).getTime()) / 60_000)),
    role: group.role,
    ownerName: group.owner.displayName,
  };
}

function initialsOf(value: string): string {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase() || "NH";
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError ? cause.message : fallback;
}
