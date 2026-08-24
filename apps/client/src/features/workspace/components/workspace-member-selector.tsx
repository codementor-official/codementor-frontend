"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import type { WorkspaceMember } from "../types";

export function WorkspaceMemberSelector({
  members,
  selectedIds,
  onChange,
  id,
}: {
  members: WorkspaceMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  id?: string;
}) {
  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return members;
    return members.filter((member) =>
      `${member.user.displayName} ${member.user.email ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(query),
    );
  }, [members, search]);

  const toggle = (memberId: string) =>
    onChange(
      selectedIds.includes(memberId)
        ? selectedIds.filter((id) => id !== memberId)
        : [...selectedIds, memberId],
    );

  return (
    <section
      id={id}
      className="rounded-lg border border-border-soft bg-bg/30 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-semibold text-navy hover:bg-bg"
          onClick={() => onChange(members.map((member) => member.id))}
        >
          <Users className="h-3.5 w-3.5" />
          Chọn toàn bộ
        </button>
        <button
          type="button"
          className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs font-semibold text-navy hover:bg-bg"
          onClick={() => onChange([])}
        >
          Xóa lựa chọn
        </button>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {selectedIds.length}/{members.length} đã chọn
        </span>
        <label className="relative ml-auto min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm thành viên..."
            className="h-8 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-xs text-navy focus:border-navy"
          />
        </label>
      </div>

      <div className="mt-2.5 grid max-h-44 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((member) => {
          const checked = selectedIds.includes(member.id);
          return (
            <label
              key={member.id}
              className={`flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-xs transition-colors ${
                checked ? "bg-primary/10 text-navy" : "hover:bg-border-soft/60"
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 accent-primary"
                checked={checked}
                onChange={() => toggle(member.id)}
              />
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-bold text-on-ink">
                {initialsOf(member.user.displayName)}
              </span>
              <span className="truncate font-medium">
                {member.user.displayName}
              </span>
            </label>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-text-faint">
            Không tìm thấy thành viên phù hợp.
          </p>
        )}
      </div>
    </section>
  );
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
