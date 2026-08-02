"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatBlock } from "@/components/ui/stat-block";
import { createGroupDraft, findGroupByCode } from "@/lib/study-group/study-group-service";
import { isOwned, summarizeGroups } from "@/lib/study-group/study-group-stats";
import { StudyGroupCard } from "./study-group-card";
import type { StudyGroup } from "@/types/study-group";

function GroupSection({
  title,
  hint,
  groups,
  emptyMessage,
}: {
  title: string;
  hint: string;
  groups: StudyGroup[];
  emptyMessage: string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-base font-bold text-navy">{title}</h2>
        <span className="rounded-full bg-border-soft px-2 py-0.5 text-[11px] font-semibold text-text-faint">
          {groups.length}
        </span>
      </div>
      <p className="mb-3 text-xs text-text-faint">{hint}</p>
      {groups.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <Users className="mx-auto mb-2 h-5 w-5 text-text-faint" />
          <p className="text-sm text-text-muted">{emptyMessage}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const groups = useMemo(() => [...createdGroups, ...initialGroups], [createdGroups, initialGroups]);
  const summary = useMemo(() => summarizeGroups(groups), [groups]);
  const ownedGroups = groups.filter(isOwned);
  const joinedGroups = groups.filter((g) => !isOwned(g));

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const match = findGroupByCode(groups, joinCode);
    if (!match) {
      setJoinError("Không tìm thấy nhóm nào khớp với mã này. Kiểm tra lại mã mời nhé.");
      return;
    }
    setJoinError(null);
    router.push(`/workspace/${match.id}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    setCreatedGroups((prev) => [createGroupDraft(draftName, draftDescription, currentUserName), ...prev]);
    setDraftName("");
    setDraftDescription("");
    setIsCreating(false);
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <StatBlock value={String(summary.totalGroups)} label="Tổng số nhóm" />
          <p className="mt-1 text-xs text-text-faint">
            {summary.ownedCount} bạn tạo · {summary.joinedCount} đã tham gia
          </p>
        </Card>
        <Card className="p-5">
          <StatBlock value={`${summary.averageProgress}%`} label="Tiến độ trung bình" />
          <p className="mt-1 text-xs text-text-faint">Trên tất cả các nhóm</p>
        </Card>
        <Card className="p-5">
          <StatBlock value={String(summary.peerCount)} label="Bạn học cùng" />
          <p className="mt-1 text-xs text-text-faint">Thành viên trong các nhóm</p>
        </Card>
        <Card className="p-5">
          <StatBlock value={String(summary.openTaskCount)} label="Bài tập đang mở" />
          <p className="mt-1 text-xs text-text-faint">Chờ bạn hoàn thành</p>
        </Card>
      </div>

      <Card className="mb-8 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <form onSubmit={handleJoin} className="min-w-0 flex-1">
            <label htmlFor="join-code" className="mb-1.5 block text-sm font-semibold text-navy">
              Tham gia bằng mã mời
            </label>
            <p className="mb-2.5 text-xs text-text-faint">
              Nhập mã nhóm bạn được chia sẻ, ví dụ <span className="font-mono text-text-muted">NMLT-BASIC</span>.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  setJoinError(null);
                }}
                icon={<KeyRound />}
                placeholder="Nhập mã hoặc dán liên kết mời..."
                containerClassName="min-w-56 flex-1"
                aria-invalid={joinError ? true : undefined}
                aria-describedby={joinError ? "join-code-error" : undefined}
              />
              <Button type="submit" variant="outline">
                Tham gia
              </Button>
            </div>
            {joinError && (
              <p id="join-code-error" role="alert" className="mt-2 text-xs font-medium text-primary">
                {joinError}
              </p>
            )}
          </form>

          <div className="shrink-0">
            <Button type="button" onClick={() => setIsCreating((v) => !v)}>
              {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Hủy" : "Tạo nhóm học tập"}
            </Button>
          </div>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="mt-5 border-t border-border-soft pt-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="group-name" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Tên nhóm
                </label>
                <Input
                  id="group-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="vd: Nhóm ôn thi cuối kỳ"
                  required
                />
              </div>
              <div>
                <label htmlFor="group-desc" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Mô tả
                </label>
                <Input
                  id="group-desc"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Nhóm này sẽ tập trung vào nội dung gì?"
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="mt-3">
              Tạo nhóm
            </Button>
          </form>
        )}
      </Card>

      <GroupSection
        title="Nhóm do bạn tạo"
        hint="Bạn toàn quyền quản lý tài liệu, bài tập và thành viên của những nhóm này."
        groups={ownedGroups}
        emptyMessage="Bạn chưa tạo nhóm nào. Nhấn “Tạo nhóm học tập” để bắt đầu."
      />

      <GroupSection
        title="Nhóm bạn đã tham gia"
        hint="Do người khác làm chủ nhóm — bạn luyện tập theo tài liệu và bài tập nhóm chia sẻ."
        groups={joinedGroups}
        emptyMessage="Bạn chưa tham gia nhóm nào khác. Nhập mã mời ở trên để tham gia."
      />
    </div>
  );
}
