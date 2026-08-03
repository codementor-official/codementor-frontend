"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sortableDate } from "@/lib/sortable-date";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, Code2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  DataTable,
  TablePagination,
  TableToolbar,
  useDataTable,
} from "@/components/ui/data-table";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { authoredProblems } from "@/data/authored-problems";
import type { AuthoredProblem } from "@/types/authored-problem";

const KIND_META = {
  code: { label: "Bài code", icon: Code2, tab: "code" },
  theory: { label: "Bài lý thuyết", icon: BookOpen, tab: "theory" },
} as const;

const DIFFICULTY_LABEL = { easy: "Cơ bản", medium: "Trung bình", hard: "Nâng cao" } as const;

/** One line of "what's inside", so the two kinds stay comparable in a single table. */
function describe(problem: AuthoredProblem): string {
  if (problem.kind === "code") {
    return `${DIFFICULTY_LABEL[problem.difficulty]} · ${problem.languageCount} ngôn ngữ · ${problem.testCaseCount} test case`;
  }
  return `${problem.chapter} · ${problem.durationMinutes} phút · ${problem.objectiveCount} mục tiêu`;
}

function learnerCount(problem: AuthoredProblem): number {
  return problem.kind === "code" ? problem.solverCount : problem.readerCount;
}

export function AuthoredProblemsTab() {
  const router = useRouter();
  const [problems, setProblems] = useState(authoredProblems);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      problems
        .filter((p) => kind === "all" || p.kind === kind)
        .filter((p) => status === "all" || p.status === status),
    [problems, kind, status],
  );

  const columns = useMemo<ColumnDef<AuthoredProblem, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Bài tập",
        accessorFn: (row) => `${row.title} ${KIND_META[row.kind].label}`,
        cell: ({ row }) => {
          const problem = row.original;
          const Icon = KIND_META[problem.kind].icon;
          return (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg text-text-muted">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium text-navy">{problem.title}</div>
                <div className="truncate text-xs text-text-faint">{describe(problem)}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: "kind",
        header: "Loại",
        size: 130,
        accessorFn: (row) => KIND_META[row.kind].label,
        cell: ({ row }) => (
          <span className="text-text-muted">{KIND_META[row.original.kind].label}</span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        size: 120,
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <span className={row.original.status === "draft" ? "text-text-faint" : "text-navy"}>
            {row.original.status === "draft" ? "Bản nháp" : "Đã đăng"}
          </span>
        ),
      },
      {
        id: "assigned",
        header: "Đã giao",
        size: 200,
        accessorFn: (row) => row.assignedGroups.length,
        cell: ({ row }) => {
          const groups = row.original.assignedGroups;
          if (groups.length === 0) return <span className="text-text-faint">Chưa giao</span>;
          return (
            <span className="text-text-muted" title={groups.join(", ")}>
              {groups.length === 1 ? groups[0] : `${groups.length} nhóm`}
            </span>
          );
        },
      },
      {
        id: "learners",
        header: "Người học",
        size: 110,
        accessorFn: learnerCount,
        cell: ({ row }) => {
          const count = learnerCount(row.original);
          return (
            <span className={count === 0 ? "text-text-faint" : "text-navy"}>
              {count === 0 ? "—" : count}
            </span>
          );
        },
      },
      {
        id: "updatedAt",
        header: "Cập nhật",
        size: 150,
        // Display order must be chronological, not lexicographic on DD/MM/YYYY.
        accessorFn: (row) => sortableDate(row.updatedAt),
        cell: ({ row }) => <span className="text-text-muted">{row.original.updatedAt}</span>,
      },
      {
        id: "actions",
        header: "",
        size: 56,
        enableSorting: false,
        cell: ({ row }) => {
          const problem = row.original;
          return (
            <div className="flex justify-end">
              <RowActionMenu
                label={`Tùy chọn cho ${problem.title}`}
                items={[
                  {
                    key: "edit",
                    label: "Chỉnh sửa",
                    onSelect: () =>
                      router.push(`/create-problem?tab=${KIND_META[problem.kind].tab}`),
                  },
                  {
                    key: "status",
                    label: problem.status === "draft" ? "Đăng bài" : "Chuyển về nháp",
                    onSelect: () =>
                      setProblems((prev) =>
                        prev.map((p) =>
                          p.id === problem.id
                            ? { ...p, status: p.status === "draft" ? "published" : "draft" }
                            : p,
                        ),
                      ),
                  },
                  {
                    key: "delete",
                    label: "Xóa",
                    danger: true,
                    onSelect: () => setProblems((prev) => prev.filter((p) => p.id !== problem.id)),
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [router],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "updatedAt", desc: true }],
    pageSize: 10,
  });

  const drafts = problems.filter((p) => p.status === "draft").length;

  return (
    <div>
      <Card className="mb-4 flex flex-wrap divide-y divide-border-soft sm:divide-x sm:divide-y-0">
        {[
          { label: "Bài đã tạo", value: problems.length },
          { label: "Bài code", value: problems.filter((p) => p.kind === "code").length },
          { label: "Bài lý thuyết", value: problems.filter((p) => p.kind === "theory").length },
          { label: "Bản nháp chưa đăng", value: drafts, alert: true },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-1 items-baseline gap-2 px-4 py-2.5">
            <span
              className={`text-lg font-bold ${stat.alert && stat.value > 0 ? "text-primary" : "text-navy"}`}
            >
              {stat.value}
            </span>
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
        ))}
      </Card>

      <TableToolbar
        searchValue={(table.getState().globalFilter as string) ?? ""}
        onSearchChange={table.setGlobalFilter}
        searchPlaceholder="Tìm theo tên bài tập..."
        selectedCount={0}
        onClearSelection={() => {}}
        filters={
          <>
            <Select
              label="Loại bài"
              shape="box"
              value={kind}
              onChange={setKind}
              options={[
                { value: "all", label: "Mọi loại bài" },
                { value: "code", label: "Bài code" },
                { value: "theory", label: "Bài lý thuyết" },
              ]}
            />
            <Select
              label="Trạng thái"
              shape="box"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Mọi trạng thái" },
                { value: "published", label: "Đã đăng" },
                { value: "draft", label: "Bản nháp" },
              ]}
            />
          </>
        }
        primaryAction={
          <Button size="sm" href="/create-problem">
            <Plus className="h-3.5 w-3.5" /> Tạo bài tập
          </Button>
        }
      />

      <DataTable table={table} emptyMessage="Chưa có bài tập nào khớp bộ lọc." />
      <TablePagination table={table} />
    </div>
  );
}
