"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, SearchX, UsersRound, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import { createGroupDraft, findGroupByCode } from "@/lib/study-group/study-group-service";
import {
  DEFAULT_STUDY_GROUP_FILTERS,
  STUDY_GROUP_SORT_OPTIONS,
  countActiveFilters,
  filterGroups,
  getAvailableTopics,
  sortGroups,
  type StudyGroupFilterState,
  type StudyGroupSort,
} from "@/lib/study-group/study-group-filter";
import { isOwned, summarizeGroups } from "@/lib/study-group/study-group-stats";
import { StudyGroupActions } from "./study-group-actions";
import { StudyGroupCard } from "./study-group-card";
import type { StudyGroup } from "@/types/study-group";

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
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-navy">{title}</h2>
            <span className="rounded-full bg-border-soft px-2 py-0.5 text-2xs font-semibold text-text-faint">
              {groups.length}
            </span>
          </div>
          <p className="truncate text-xs text-text-faint">{hint}</p>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="px-1 py-4 text-xs text-text-faint">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <StudyGroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </section>
  );
}

export function StudyGroupBoard({
  groups: initialGroups,
  currentUserName,
}: {
  groups: StudyGroup[];
  currentUserName: string;
}) {
  const router = useRouter();
  // ponytail: session-scoped. Created groups vanish on reload — move to a persisted
  // store (see lib/store/*) or a real POST once group creation has a backend.
  const [createdGroups, setCreatedGroups] = useState<StudyGroup[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudyGroupFilterState>(DEFAULT_STUDY_GROUP_FILTERS);

  const groups = useMemo(() => [...createdGroups, ...initialGroups], [createdGroups, initialGroups]);
  const summary = useMemo(() => summarizeGroups(groups), [groups]);
  const topicOptions = useMemo(
    () => [
      { value: "all", label: "Mọi chủ đề" },
      ...getAvailableTopics(groups).map((t) => ({ value: t, label: t })),
    ],
    [groups],
  );

  const visible = useMemo(
    () => sortGroups(filterGroups(groups, filters), filters.sort),
    [groups, filters],
  );
  const ownedGroups = visible.filter(isOwned);
  const joinedGroups = visible.filter((g) => !isOwned(g));
  const isFiltered = filters.search.trim() !== "" || filters.topic !== "all";

  const handleJoin = (code: string) => {
    const match = findGroupByCode(groups, code);
    if (!match) {
      setJoinError("Không tìm thấy nhóm nào khớp với mã này. Kiểm tra lại mã mời nhé.");
      return;
    }
    setJoinError(null);
    router.push(`/workspace/${match.id}`);
  };

  const handleCreate = (name: string, description: string) => {
    setCreatedGroups((prev) => [createGroupDraft(name, description, currentUserName), ...prev]);
  };

  return (
    <div>
      <StudyGroupActions
        leading={
          <p className="text-xs text-text-muted">
            <span className="font-semibold text-navy">{summary.totalGroups} nhóm</span> ·{" "}
            {summary.ownedCount} bạn quản lý · {summary.joinedCount} đã tham gia ·{" "}
            <span className="font-semibold text-navy">{summary.openTaskCount}</span> bài tập đang mở
          </p>
        }
        onJoin={handleJoin}
        onCreate={handleCreate}
        joinError={joinError}
        onClearJoinError={() => setJoinError(null)}
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Tìm nhóm theo tên, chủ đề, mã mời..."
        activeFilterCount={countActiveFilters(filters)}
        controls={
          <>
            <Select
              label="Chủ đề"
              value={filters.topic}
              options={topicOptions}
              onChange={(topic) => setFilters((f) => ({ ...f, topic }))}
            />
            <Select
              label="Sắp xếp"
              value={filters.sort}
              options={STUDY_GROUP_SORT_OPTIONS}
              onChange={(sort) => setFilters((f) => ({ ...f, sort: sort as StudyGroupSort }))}
            />
          </>
        }
      />

      {isFiltered && visible.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <SearchX className="mx-auto mb-2 h-5 w-5 text-text-faint" />
          <p className="text-sm font-semibold text-navy">Không có nhóm nào khớp bộ lọc</p>
          <p className="mt-1 text-xs text-text-faint">Thử từ khóa khác hoặc bỏ bớt bộ lọc chủ đề.</p>
        </Card>
      ) : (
        <>
          <GroupSection
            icon={Crown}
            title="Nhóm bạn quản lý"
            hint="Bạn toàn quyền quản lý tài liệu, bài tập và thành viên"
            groups={ownedGroups}
            emptyMessage={
              isFiltered
                ? "Không có nhóm nào bạn quản lý khớp bộ lọc."
                : "Bạn chưa tạo nhóm nào. Nhấn “Tạo nhóm học tập” để bắt đầu."
            }
          />
          <GroupSection
            icon={UsersRound}
            title="Nhóm bạn đã tham gia"
            hint="Do người khác làm chủ nhóm — bạn luyện tập theo tài liệu và bài tập nhóm chia sẻ"
            groups={joinedGroups}
            emptyMessage={
              isFiltered
                ? "Không có nhóm đã tham gia nào khớp bộ lọc."
                : "Bạn chưa tham gia nhóm nào khác. Dùng “Tham gia bằng mã mời” ở trên."
            }
          />
        </>
      )}
    </div>
  );
}
