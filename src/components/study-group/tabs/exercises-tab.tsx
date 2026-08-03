"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Globe, Lock, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  DataTable,
  TableCheckbox,
  TablePagination,
  TableToolbar,
  useDataTable,
} from "@/components/ui/data-table";
import {
  EXERCISE_STATUS_META,
  exerciseCompletionPercent,
  formatDueDate,
  isOverdue,
  visibleExercises,
} from "@/lib/study-group/group-detail-meta";
import { AssignExerciseModal } from "@/components/study-group/assign-exercise-modal";
import {
  CreateExerciseModal,
  ExerciseEditModal,
  ExercisePreviewModal,
} from "@/components/study-group/exercise-modals";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type {
  Assignment,
  GroupDocument,
  GroupExercise,
  GroupMember,
} from "@/types/study-group-detail";

/** ponytail: stands in for the signed-in user's own problem library until there's an API. */
const PERSONAL_EXERCISES = [
  { id: "p-1", title: "Đếm số nguyên tố trong khoảng", difficulty: "Trung bình" as const, topic: "Số học" },
  { id: "p-2", title: "Kiểm tra chuỗi đối xứng", difficulty: "Cơ bản" as const, topic: "Chuỗi" },
  { id: "p-3", title: "Tìm kiếm nhị phân", difficulty: "Nâng cao" as const, topic: "Thuật toán" },
];

export function ExercisesTab({
  exercises,
  members,
  assignments,
  documents,
  canManage,
}: {
  exercises: GroupExercise[];
  members: GroupMember[];
  assignments: Assignment[];
  documents: GroupDocument[];
  canManage: boolean;
}) {
  // ponytail: session-scoped. Swap for a service call once there's a backend.
  const [items, setItems] = useState(exercises);
  const [assignedByExercise, setAssignedByExercise] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const a of assignments) (map[a.exerciseId] ??= []).push(a.memberId);
    return map;
  });
  const [assigning, setAssigning] = useState<GroupExercise | null>(null);
  const [previewing, setPreviewing] = useState<GroupExercise | null>(null);
  const [editing, setEditing] = useState<GroupExercise | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const setStatusFor = (targets: GroupExercise[], next: GroupExercise["status"]) => {
    const ids = new Set(targets.map((e) => e.id));
    setItems((prev) => prev.map((e) => (ids.has(e.id) ? { ...e, status: next } : e)));
  };

  const rows = useMemo(
    () =>
      visibleExercises(items, canManage)
        .filter((e) => status === "all" || e.status === status)
        .filter((e) => difficulty === "all" || e.difficulty === difficulty),
    [items, canManage, status, difficulty],
  );

  const columns = useMemo<ColumnDef<GroupExercise, unknown>[]>(
    () => [
      ...(canManage
        ? [
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
            } satisfies ColumnDef<GroupExercise, unknown>,
          ]
        : []),
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
        cell: ({ row }) => <span className="text-text">{row.original.difficulty}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) => {
          const meta = EXERCISE_STATUS_META[row.original.status];
          return <span className={meta.tone === "primary" ? "text-primary" : "text-text"}>{meta.label}</span>;
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
      {
        id: "actions",
        header: "",
        size: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const ex = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                title="Xem trước bài tập"
                aria-label={`Xem trước ${ex.title}`}
                onClick={() => setPreviewing(ex)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                {canManage && (
                  <RowActionMenu
                    label={`Tùy chọn cho ${ex.title}`}
                    sections={[
                      {
                        label: "Hiển thị",
                        items: [
                          {
                            key: "published",
                            label: "Công khai",
                            icon: <Globe className="h-3.5 w-3.5" />,
                            disabled: ex.status === "published",
                            onSelect: () => setStatusFor([ex], "published"),
                          },
                          {
                            key: "draft",
                            label: "Bản nháp",
                            icon: <Pencil className="h-3.5 w-3.5" />,
                            disabled: ex.status === "draft",
                            onSelect: () => setStatusFor([ex], "draft"),
                          },
                          {
                            key: "closed",
                            label: "Tạm đóng",
                            icon: <Lock className="h-3.5 w-3.5" />,
                            disabled: ex.status === "closed",
                            onSelect: () => setStatusFor([ex], "closed"),
                          },
                        ],
                      },
                    ]}
                    items={[
                      {
                        key: "edit",
                        label: "Chỉnh sửa",
                        icon: <Pencil className="h-3.5 w-3.5" />,
                        separatorBefore: true,
                        onSelect: () => setEditing(ex),
                      },
                      {
                        key: "assign",
                        label: "Phân công",
                        icon: <UsersRound className="h-3.5 w-3.5" />,
                        onSelect: () => setAssigning(ex),
                      },
                      {
                        key: "delete",
                        label: "Xóa",
                        icon: <Trash2 className="h-3.5 w-3.5" />,
                        danger: true,
                        separatorBefore: true,
                        onSelect: () => setItems((prev) => prev.filter((e) => e.id !== ex.id)),
                      },
                    ]}
                  />
                )}
              </span>
            </div>
          );
        },
      },
    ],
    [canManage],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "dueAt", desc: false }],
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedCount = selectedRows.length;
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
                { value: "hidden", label: "Đã ẩn" },
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Tạo bài tập
            </Button>
          ) : undefined
        }
        bulkActions={
          canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setStatusFor(selectedRows, "hidden")}>
                <Lock className="h-3.5 w-3.5" /> Ẩn
              </Button>
              <Button size="sm" variant="outline" className="text-primary">
                <Trash2 className="h-3.5 w-3.5" /> Xóa
              </Button>
            </>
          ) : undefined
        }
      />
      <DataTable table={table} emptyMessage="Không có bài tập nào khớp bộ lọc." />
      <TablePagination table={table} />

      <ExercisePreviewModal exercise={previewing} onClose={() => setPreviewing(null)} />

      <ExerciseEditModal
        exercise={editing}
        onClose={() => setEditing(null)}
        onSave={(next) => {
          setItems((prev) => prev.map((e) => (e.id === next.id ? next : e)));
          setEditing(null);
        }}
      />

      <CreateExerciseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        documents={documents.filter((d) => d.status === "published")}
        personalExercises={PERSONAL_EXERCISES}
        onCreate={(title) => {
          setItems((prev) => [
            {
              id: `created-${Date.now()}`,
              title,
              difficulty: "Cơ bản",
              source: "manual",
              status: "draft",
              topic: "Chưa đặt chủ đề",
              xp: 30,
              dueAt: null,
              assignedCount: 0,
              completedCount: 0,
              objective: "Nội dung đang được soạn.",
              estTime: "15 phút",
              sampleInput: "(chưa có)",
              sampleOutput: "(chưa có)",
              criteria: "",
              phase: "",
              refDoc: "",
            },
            ...prev,
          ]);
          setCreateOpen(false);
        }}
      />

      <AssignExerciseModal
        exercise={assigning}
        members={members}
        assignedMemberIds={assigning ? (assignedByExercise[assigning.id] ?? []) : []}
        onClose={() => setAssigning(null)}
        onSave={(exerciseId, memberIds) => {
          setAssignedByExercise((prev) => ({ ...prev, [exerciseId]: memberIds }));
          setItems((prev) =>
            prev.map((e) => (e.id === exerciseId ? { ...e, assignedCount: memberIds.length } : e)),
          );
          setAssigning(null);
        }}
      />
    </div>
  );
}
