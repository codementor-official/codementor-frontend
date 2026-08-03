"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, Mail, Trophy, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable, TableCheckbox, TableToolbar, useDataTable } from "@/components/ui/data-table";
import { ROLE_LABEL, formatRelativeTime } from "@/lib/study-group/study-group-stats";
import { rankMembers } from "@/lib/study-group/group-detail-meta";
import type { GroupMember } from "@/types/study-group-detail";

/** Order is 2nd, 1st, 3rd so the winner stands in the middle, on the tallest step. */
const PODIUM_LAYOUT = [
  { rank: 2, height: "h-12", step: "border-border bg-bg" },
  { rank: 1, height: "h-20", step: "border-primary bg-primary-tint" },
  { rank: 3, height: "h-8", step: "border-border bg-bg" },
] as const;

function Podium({ ranked, onOpen }: { ranked: GroupMember[]; onOpen: (m: GroupMember) => void }) {
  const top = PODIUM_LAYOUT.map((step) => ({ ...step, member: ranked[step.rank - 1] })).filter(
    (s) => s.member,
  );
  if (top.length === 0) return null;

  return (
    <Card className="mb-5 px-5 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-navy">Bảng xếp hạng</h3>
        <span className="text-xs text-text-faint">Theo XP tích lũy trong nhóm</span>
      </div>

      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {top.map(({ rank, height, step, member }) => (
          <div key={rank} className="flex w-full max-w-40 flex-col items-center">
            <span
              className={`mb-1.5 flex items-center justify-center rounded-full bg-navy font-semibold text-white ${
                rank === 1 ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs"
              }`}
            >
              {member.initials}
            </span>
            <span className="line-clamp-2 text-center text-xs font-semibold text-navy">{member.name}</span>
            <span className="mt-0.5 text-center text-2xs text-text-faint">
              {member.xp.toLocaleString("vi-VN")} XP · {member.solvedCount} bài
            </span>
            <button
              type="button"
              onClick={() => onOpen(member)}
              className="mt-1 mb-2 text-2xs font-semibold text-primary hover:underline"
            >
              Thành tích
            </button>
            {/* The step itself carries the rank, so the podium reads as a podium. */}
            <div
              className={`flex w-full items-start justify-center rounded-t-md border border-b-0 pt-1.5 ${height} ${step}`}
            >
              <span className={`text-sm font-bold ${rank === 1 ? "text-primary" : "text-text-faint"}`}>
                {rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MembersTab({ members, canManage }: { members: GroupMember[]; canManage: boolean }) {
  const [role, setRole] = useState("all");
  const [detailMember, setDetailMember] = useState<GroupMember | null>(null);

  const ranked = useMemo(() => rankMembers(members), [members]);
  const rows = useMemo(
    () => ranked.filter((m) => role === "all" || m.role === role),
    [ranked, role],
  );

  const columns = useMemo<ColumnDef<GroupMember, unknown>[]>(
    () => [
      ...(canManage
        ? [
            {
              id: "select",
              size: 40,
              enableSorting: false,
              header: ({ table }) => (
                <TableCheckbox
                  label="Chọn tất cả thành viên"
                  checked={table.getIsAllRowsSelected()}
                  indeterminate={table.getIsSomeRowsSelected()}
                  onChange={(v) => table.toggleAllRowsSelected(v)}
                />
              ),
              cell: ({ row }) => (
                <TableCheckbox
                  label={`Chọn ${row.original.name}`}
                  checked={row.getIsSelected()}
                  onChange={(v) => row.toggleSelected(v)}
                />
              ),
            } satisfies ColumnDef<GroupMember, unknown>,
          ]
        : []),
      {
        accessorKey: "name",
        header: "Thành viên",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-white">
              {row.original.initials}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-navy">{row.original.name}</div>
              <div className="text-xs text-text-faint">Tham gia {row.original.joinedAt}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        size: 120,
        cell: ({ row }) => (
          <Badge tone={row.original.role === "owner" ? "brown" : "neutral"}>
            {ROLE_LABEL[row.original.role]}
          </Badge>
        ),
      },
      {
        accessorKey: "progressPercent",
        header: "Tiến độ",
        size: 130,
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-medium text-navy">{row.original.progressPercent}%</div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${row.original.progressPercent}%` }}
              />
            </div>
          </div>
        ),
      },
      { accessorKey: "solvedCount", header: "Bài đã làm", size: 110 },
      {
        accessorKey: "xp",
        header: "XP",
        size: 90,
        cell: ({ row }) => row.original.xp.toLocaleString("vi-VN"),
      },
      {
        accessorKey: "lastActiveMinutesAgo",
        header: "Hoạt động",
        size: 120,
        cell: ({ row }) => formatRelativeTime(row.original.lastActiveMinutesAgo),
      },
      {
        id: "actions",
        header: "",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setDetailMember(row.original)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Award className="h-3.5 w-3.5" /> Thành tích
          </button>
        ),
      },
    ],
    [canManage],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "xp", desc: true }],
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const globalFilter = table.getState().globalFilter ?? "";

  return (
    <div>
      <Podium ranked={ranked} onOpen={setDetailMember} />

      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={(v) => table.setGlobalFilter(v)}
        searchPlaceholder="Tìm thành viên theo tên..."
        selectedCount={selectedCount}
        onClearSelection={() => table.resetRowSelection()}
        filters={
          <Select
            label="Vai trò"
            shape="box"
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: "Mọi vai trò" },
              { value: "owner", label: "Chủ nhóm" },
              { value: "deputy", label: "Phó nhóm" },
              { value: "member", label: "Thành viên" },
            ]}
          />
        }
        primaryAction={
          canManage ? (
            <Button size="sm">
              <Mail className="h-3.5 w-3.5" /> Mời thành viên
            </Button>
          ) : undefined
        }
        bulkActions={
          canManage ? (
            <Button size="sm" variant="outline" className="text-primary">
              <UserMinus className="h-3.5 w-3.5" /> Xóa khỏi nhóm
            </Button>
          ) : undefined
        }
      />

      <DataTable table={table} emptyMessage="Không có thành viên nào khớp bộ lọc." />

      <Modal
        open={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title={detailMember ? `Thành tích của ${detailMember.name}` : ""}
        description="Số liệu tổng hợp trên toàn bộ nền tảng, không chỉ trong nhóm này."
      >
        {detailMember && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "XP", value: detailMember.xp.toLocaleString("vi-VN") },
                { label: "Bài đã làm", value: String(detailMember.solvedCount) },
                { label: "Chuỗi ngày", value: `${detailMember.streakDays}` },
              ].map((s) => (
                <div key={s.label} className="rounded-md bg-bg p-3 text-center">
                  <div className="text-lg font-bold text-navy">{s.value}</div>
                  <div className="text-2xs text-text-faint">{s.label}</div>
                </div>
              ))}
            </div>
            <dl className="flex flex-col divide-y divide-border-soft">
              {detailMember.achievements.map((a) => (
                <div key={a.label} className="flex items-start justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <dt className="text-sm font-medium text-navy">{a.label}</dt>
                    <dd className="text-xs text-text-faint">{a.hint}</dd>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-navy">{a.value}</span>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
