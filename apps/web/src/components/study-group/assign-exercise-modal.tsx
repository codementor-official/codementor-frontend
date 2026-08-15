"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import type { GroupExercise, GroupMember } from "@/types/study-group-detail";

const MEMBERS_PER_PAGE = 5;

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
  const [page, setPage] = useState(0);

  // Re-seed when a different exercise opens the modal.
  useEffect(() => {
    setPicked(assignedMemberIds);
    setSearch("");
    setPage(0);
  }, [exercise?.id, assignedMemberIds]);

  const query = search.trim().toLowerCase();
  const matched = useMemo(
    () => members.filter((m) => !query || m.name.toLowerCase().includes(query)),
    [members, query],
  );
  const pageCount = Math.max(1, Math.ceil(matched.length / MEMBERS_PER_PAGE));
  // Filtering can shrink the list under the current page — clamp instead of showing blank.
  const safePage = Math.min(page, pageCount - 1);
  const shown = matched.slice(safePage * MEMBERS_PER_PAGE, (safePage + 1) * MEMBERS_PER_PAGE);

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-on-ink">
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

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted">{matched.length} thành viên</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Trang trước"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted hover:bg-bg hover:text-navy disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 text-xs font-medium text-navy">
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Trang sau"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted hover:bg-bg hover:text-navy disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
