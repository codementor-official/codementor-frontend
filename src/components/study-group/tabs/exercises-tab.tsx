"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Send, Trash2 } from "lucide-react";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, TableCheckbox, TableToolbar, useDataTable } from "@/components/ui/data-table";
import {
  EXERCISE_STATUS_META,
  exerciseCompletionPercent,
  formatDueDate,
  isOverdue,
} from "@/lib/study-group/group-detail-meta";
import type { GroupExercise } from "@/types/study-group-detail";

export function ExercisesTab({ exercises, canManage }: { exercises: GroupExercise[]; canManage: boolean }) {
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const rows = useMemo(
    () =>
      exercises
        .filter((e) => status === "all" || e.status === status)
        .filter((e) => difficulty === "all" || e.difficulty === difficulty),
    [exercises, status, difficulty],
  );

  const columns = useMemo<ColumnDef<GroupExercise, unknown>[]>(
    () => [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <TableCheckbox
            label="Chọn tất cả bài tập"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={(v) => table.toggleAllRowsSelected(v)}
          />
        ),
        cell: ({ row }) => (
          <TableCheckbox
            label={`Chọn ${row.original.title}`}
            checked={row.getIsSelected()}
            onChange={(v) => row.toggleSelected(v)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: "Bài tập",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-navy">{row.original.title}</div>
            <div className="truncate text-xs text-text-faint">
              {row.original.topic} · {row.original.source === "ai" ? "AI đề xuất" : "Tự soạn"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "difficulty",
        header: "Độ khó",
        size: 120,
        cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} />,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) => {
          const meta = EXERCISE_STATUS_META[row.original.status];
          return <Badge tone={meta.tone}>{meta.label}</Badge>;
        },
      },
      {
        id: "dueAt",
        header: "Hạn nộp",
        size: 120,
        // Undated exercises sort last instead of first — "no deadline" is not "due soonest".
        accessorFn: (row) => row.dueAt ?? "9999-12-31",
        cell: ({ row }) => {
          const overdue = isOverdue(row.original.dueAt);
          return (
            <span className={overdue ? "font-semibold text-primary" : ""}>
              {formatDueDate(row.original.dueAt)}
            </span>
          );
        },
      },
      {
        id: "completion",
        header: "Hoàn thành",
        size: 140,
        accessorFn: (row) => exerciseCompletionPercent(row),
        cell: ({ row }) => {
          const e = row.original;
          if (e.assignedCount === 0) return <span className="text-text-faint">Chưa phân công</span>;
          return (
            <div>
              <div className="text-xs font-medium text-navy">
                {e.completedCount}/{e.assignedCount} thành viên
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-border-soft">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${exerciseCompletionPercent(e)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      { accessorKey: "xp", header: "XP", size: 70 },
    ],
    [],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "dueAt", desc: false }],
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const globalFilter = table.getState().globalFilter ?? "";

  return (
    <div>
      <TableToolbar
        searchValue={globalFilter}
        onSearchChange={(v) => table.setGlobalFilter(v)}
        searchPlaceholder="Tìm bài tập theo tên, chủ đề..."
        selectedCount={selectedCount}
        onClearSelection={() => table.resetRowSelection()}
        filters={
          <>
            <Select
              label="Trạng thái"
              shape="box"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Mọi trạng thái" },
                { value: "published", label: "Đã công bố" },
                { value: "draft", label: "Bản nháp" },
                { value: "closed", label: "Tạm đóng" },
              ]}
            />
            <Select
              label="Độ khó"
              shape="box"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: "all", label: "Mọi độ khó" },
                { value: "Cơ bản", label: "Cơ bản" },
                { value: "Trung bình", label: "Trung bình" },
                { value: "Nâng cao", label: "Nâng cao" },
              ]}
            />
          </>
        }
        primaryAction={
          canManage ? (
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Tạo bài tập
            </Button>
          ) : undefined
        }
        bulkActions={
          canManage ? (
            <>
              <Button size="sm" variant="outline">
                <Send className="h-3.5 w-3.5" /> Phân công
              </Button>
              <Button size="sm" variant="outline" className="text-primary">
                <Trash2 className="h-3.5 w-3.5" /> Xóa
              </Button>
            </>
          ) : undefined
        }
      />
      <DataTable table={table} emptyMessage="Không có bài tập nào khớp bộ lọc." />
    </div>
  );
}
