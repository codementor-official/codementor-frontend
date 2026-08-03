"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, TablePagination, useDataTable } from "@/components/ui/data-table";
import { SplitStatusPill } from "@/components/study-group/status-pill";
import { REVIEW_STATUS_META, SUBMISSION_STATUS_META } from "@/lib/study-group/group-detail-meta";
import type { Assignment, GroupMember } from "@/types/study-group-detail";

/** One exercise's assignees, as a table rather than a stack of list rows. */
export function SubmissionsTable({
  rows,
  memberById,
  commentCounts,
  onReview,
}: {
  rows: Assignment[];
  memberById: Map<string, GroupMember>;
  commentCounts: Record<string, number>;
  onReview: (assignment: Assignment) => void;
}) {
  const columns = useMemo<ColumnDef<Assignment, unknown>[]>(
    () => [
      {
        id: "member",
        header: "Thành viên",
        accessorFn: (row) => memberById.get(row.memberId)?.name ?? "",
        cell: ({ row }) => {
          const member = memberById.get(row.original.memberId);
          return (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-semibold text-white">
                {member?.initials ?? "?"}
              </span>
              <span className="min-w-0 truncate font-medium text-navy">
                {member?.name ?? "Thành viên đã rời nhóm"}
              </span>
            </div>
          );
        },
      },
      {
        id: "lastSubmission",
        header: "Lần nộp gần nhất",
        accessorFn: (row) => row.submissions.at(-1)?.submittedAt ?? "",
        cell: ({ row }) => {
          const last = row.original.submissions.at(-1);
          if (!last) return <span className="text-text-faint">Chưa nộp lần nào</span>;
          return (
            <div className="min-w-0">
              <div className="truncate text-text">
                Lần {last.version} · {last.submittedAt}
              </div>
              <div className="truncate text-xs text-text-faint">{last.detail}</div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Trạng thái",
        size: 220,
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <SplitStatusPill
            left={SUBMISSION_STATUS_META[row.original.status].label}
            right={REVIEW_STATUS_META[row.original.reviewStatus].label}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const count = commentCounts[row.original.id] ?? 0;
          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(row.original)}
                className="whitespace-nowrap"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Đánh giá
                {count > 0 && (
                  <span className="rounded-full bg-border-soft px-1.5 text-2xs text-text-muted">{count}</span>
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [memberById, commentCounts, onReview],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    pageSize: 10,
  });

  return (
    <div className="p-3">
      <DataTable table={table} emptyMessage="Không có thành viên nào khớp bộ lọc." />
      <TablePagination table={table} />
    </div>
  );
}
