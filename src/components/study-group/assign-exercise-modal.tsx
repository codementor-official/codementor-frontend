"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import type { GroupExercise, GroupMember } from "@/types/study-group-detail";

/**
 * Picks which members an exercise is assigned to. Opens pre-checked with whoever is
 * already assigned, so saving without touching anything is a no-op rather than a wipe.
 */
export function AssignExerciseModal({
  exercise,
  members,
  assignedMemberIds,
  onClose,
  onSave,
}: {
  exercise: GroupExercise | null;
  members: GroupMember[];
  assignedMemberIds: string[];
  onClose: () => void;
  onSave: (exerciseId: string, memberIds: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(assignedMemberIds);
  const [search, setSearch] = useState("");

  // Re-seed when a different exercise opens the modal.
  useEffect(() => {
    setPicked(assignedMemberIds);
    setSearch("");
  }, [exercise?.id, assignedMemberIds]);

  const query = search.trim().toLowerCase();
  const shown = useMemo(
    () => members.filter((m) => !query || m.name.toLowerCase().includes(query)),
    [members, query],
  );

  if (!exercise) return null;

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal
      open
      onClose={onClose}
      title="Phân công bài tập"
      description={exercise.title}
      footer={
        <>
          <span className="mr-auto self-center text-xs text-text-muted">
            Đã chọn {picked.length}/{members.length} thành viên
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button size="sm" onClick={() => onSave(exercise.id, picked)}>
            Lưu phân công
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="h-9 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setPicked(members.map((m) => m.id))}>
          Chọn tất cả
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPicked([])}>
          Bỏ chọn
        </Button>
      </div>

      <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {shown.length === 0 && (
          <li className="py-6 text-center text-sm text-text-faint">Không tìm thấy thành viên phù hợp.</li>
        )}
        {shown.map((member) => {
          const checked = picked.includes(member.id);
          return (
            <li key={member.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${
                  checked ? "border-primary bg-primary-tint" : "border-border-soft hover:bg-bg"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(member.id)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-white">
                  {member.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy">{member.name}</span>
                  <span className="block text-xs text-text-faint">
                    {ROLE_LABEL[member.role]} · đã giải {member.solvedCount} bài
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
