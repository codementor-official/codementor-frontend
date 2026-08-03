"use client";

import { useMemo, useState } from "react";
import { sortableDate } from "@/lib/sortable-date";
import type { ColumnDef } from "@tanstack/react-table";
import { Code2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  DataTable,
  TablePagination,
  TableToolbar,
  useDataTable,
} from "@/components/ui/data-table";
import { submissionHistory } from "@/data/submission-history";
import type { SubmissionHistoryItem } from "@/types/submission";

const RESULT_LABEL: Record<SubmissionHistoryItem["result"], string> = {
  "Đạt": "Đạt",
  "Không đạt": "Cần xem lại",
  "Lỗi biên dịch": "Lỗi biên dịch",
};

export function SubmissionsTab() {
  const [result, setResult] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [selected, setSelected] = useState<SubmissionHistoryItem | null>(null);

  const rows = useMemo(
    () =>
      submissionHistory
        .filter((item) => result === "all" || item.result === result)
        .filter((item) => origin === "all" || item.origin === origin),
    [result, origin],
  );

  const columns = useMemo<ColumnDef<SubmissionHistoryItem, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Bài tập",
        accessorFn: (row) => `${row.title} ${row.groupName ?? ""} ${row.language}`,
        cell: ({ row }) => {
          const item = row.original;
          const fromGroup = item.origin === "Nhóm học tập";
          return (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg text-text-muted">
                {fromGroup ? <UsersRound className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium text-navy">{item.title}</div>
                <div className="truncate text-xs text-text-faint">
                  {item.groupName ?? "Ngân hàng bài luyện tập"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "result",
        header: "Kết quả",
        size: 170,
        accessorFn: (row) => row.result,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              {/* Passing is the only state worth colouring — the two failure modes are
               * distinguished by their label and the test count below. */}
              <div className={item.result === "Đạt" ? "font-medium text-navy" : "text-text-muted"}>
                {RESULT_LABEL[item.result]}
              </div>
              <div className="text-xs text-text-faint">
                {item.passedTests}/{item.totalTests} test · {item.score} điểm
              </div>
            </div>
          );
        },
      },
      {
        id: "language",
        header: "Ngôn ngữ",
        size: 120,
        accessorFn: (row) => row.language,
        cell: ({ row }) => <span className="text-text-muted">{row.original.language}</span>,
      },
      {
        id: "submittedAt",
        header: "Lần nộp gần nhất",
        size: 180,
        // Display order must be chronological, not lexicographic on DD/MM/YYYY.
        accessorFn: (row) => sortableDate(row.submittedAt),
        cell: ({ row }) => (
          <div>
            <div className="text-text">{row.original.submittedAt}</div>
            <div className="text-xs text-text-faint">Lần {row.original.version}</div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(row.original)}
              className="whitespace-nowrap"
            >
              Chi tiết
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "submittedAt", desc: true }],
    pageSize: 10,
  });

  const accepted = submissionHistory.filter((item) => item.result === "Đạt").length;
  const fromGroups = submissionHistory.filter((item) => item.origin === "Nhóm học tập").length;

  return (
    <div>
      <Card className="mb-4 flex flex-wrap divide-y divide-border-soft sm:divide-x sm:divide-y-0">
        {[
          { label: "Lần nộp", value: String(submissionHistory.length) },
          { label: "Đạt yêu cầu", value: `${accepted}/${submissionHistory.length}` },
          { label: "Bài từ nhóm", value: String(fromGroups) },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-1 items-baseline gap-2 px-4 py-2.5">
            <span className="text-lg font-bold text-navy">{stat.value}</span>
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
        ))}
      </Card>

      <TableToolbar
        searchValue={(table.getState().globalFilter as string) ?? ""}
        onSearchChange={table.setGlobalFilter}
        searchPlaceholder="Tìm bài tập, nhóm hoặc ngôn ngữ..."
        selectedCount={0}
        onClearSelection={() => {}}
        filters={
          <>
            <Select
              label="Kết quả"
              shape="box"
              value={result}
              onChange={setResult}
              options={[
                { value: "all", label: "Mọi kết quả" },
                { value: "Đạt", label: "Đạt" },
                { value: "Không đạt", label: "Cần xem lại" },
                { value: "Lỗi biên dịch", label: "Lỗi biên dịch" },
              ]}
            />
            <Select
              label="Nguồn bài"
              shape="box"
              value={origin}
              onChange={setOrigin}
              options={[
                { value: "all", label: "Mọi nguồn bài" },
                { value: "Nhóm học tập", label: "Bài từ nhóm" },
                { value: "Bài luyện tập", label: "Bài luyện tập" },
              ]}
            />
          </>
        }
      />

      <DataTable
        table={table}
        emptyMessage="Chưa có lượt nộp nào khớp bộ lọc."
        onRowClick={setSelected}
      />
      <TablePagination table={table} />

      <SubmissionDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function SubmissionDrawer({
  item,
  onClose,
}: {
  item: SubmissionHistoryItem | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <SideDrawer
      open
      width="wide"
      onClose={onClose}
      title={item.title}
      description={`${item.origin} · ${item.groupName ?? "Ngân hàng bài luyện tập"}`}
      footer={
        <Button size="sm" variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <section className="rounded-lg border border-border bg-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-navy">
              {RESULT_LABEL[item.result]} · {item.score}/100
            </span>
            <span className="text-xs text-text-muted">
              Nộp lúc {item.submittedAt} · phiên bản {item.version}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Test case", `${item.passedTests}/${item.totalTests}`],
              ["Thời gian", item.runtime],
              ["Bộ nhớ", item.memory],
              ["Ngôn ngữ", item.language],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border-soft bg-surface p-3">
                <p className="text-2xs text-text-faint">{label}</p>
                <p className="mt-1 text-sm font-bold text-navy">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-bold text-navy">Nhận xét kết quả</h2>
          <p className="mt-2 text-sm leading-6 text-text">{item.note}</p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-navy">Mã nguồn đã nộp</h2>
          <pre className="overflow-x-auto rounded-lg bg-navy p-5 text-xs leading-6 text-zinc-100">
            <code>{item.sourceCode}</code>
          </pre>
        </section>
      </div>
    </SideDrawer>
  );
}
