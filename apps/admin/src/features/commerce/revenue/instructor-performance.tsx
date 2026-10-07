"use client";
import { useMemo, useState } from "react";
import type { RevenueInstructor } from "@codementor/types";
import {
  Button,
  RevenueBreakdownChart,
  ServerPagination,
} from "@codementor/ui";
import { Download } from "lucide-react";
import { downloadCsv } from "@codementor/utils";
import { vnd } from "../api";

export type InstructorRevenueMetric = "revenue" | "platformRevenue" | "orders";

export function InstructorPerformance({
  instructors,
  selectedId,
  onSelect,
  metric,
  onMetricChange,
}: {
  instructors: RevenueInstructor[];
  selectedId: string;
  onSelect: (id: string) => void;
  metric: InstructorRevenueMetric;
  onMetricChange: (metric: InstructorRevenueMetric) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("revenue");
  const [page, setPage] = useState(1);
  const scope = useMemo(
    () =>
      selectedId ? instructors.filter((i) => i.id === selectedId) : instructors,
    [instructors, selectedId],
  );
  const rows = useMemo(
    () =>
      scope
        .filter((i) =>
          `${i.name} ${i.email}`
            .toLocaleLowerCase("vi")
            .includes(query.toLocaleLowerCase("vi")),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name, "vi")
            : b[sort as "revenue" | "orders"] -
                a[sort as "revenue" | "orders"] || a.id.localeCompare(b.id),
        ),
    [scope, query, sort],
  );
  const activePage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  const label =
    metric === "revenue"
      ? "Thu nhập giảng viên trước phí"
      : metric === "platformRevenue"
        ? "Phần CodeMentor"
        : "Số đơn đã thanh toán / hoàn tiền";
  const data = scope.map((i) => ({
    id: i.id,
    label: i.name,
    value: i[metric],
  }));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Hiệu quả giảng viên</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cùng kỳ và phạm vi báo cáo; không phải số dư có thể rút.
          </p>
        </div>
        <select
          aria-label="Chỉ số giảng viên"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={metric}
          onChange={(e) =>
            onMetricChange(e.target.value as InstructorRevenueMetric)
          }
        >
          <option value="revenue">Thu nhập giảng viên (VNĐ)</option>
          <option value="platformRevenue">Phần CodeMentor (VNĐ)</option>
          <option value="orders">Số đơn</option>
        </select>
      </div>
      {selectedId && (
        <Button variant="outline" onClick={() => onSelect("")}>
          Xem so sánh tất cả giảng viên
        </Button>
      )}
      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <RevenueBreakdownChart
          title="Giảng viên dẫn đầu"
          description={label}
          variant="ranking"
          data={data}
          unit={metric === "orders" ? "đơn" : "VNĐ"}
          onSelect={onSelect}
        />
        <RevenueBreakdownChart
          title="Tỷ trọng theo giảng viên"
          description={label}
          data={data}
          unit={metric === "orders" ? "đơn" : "VNĐ"}
          onSelect={onSelect}
        />
      </div>
      <details className="min-w-0">
        <summary className="w-fit cursor-pointer py-2 text-sm font-medium">
          Mở danh sách {scope.length} giảng viên
        </summary>
        <div className="mt-2 overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b p-5">
            <input
              aria-label="Tìm giảng viên trong bảng"
              placeholder="Tên hoặc email"
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <select
              aria-label="Sắp xếp giảng viên"
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="revenue">Thu nhập cao nhất</option>
              <option value="orders">Nhiều đơn nhất</option>
              <option value="name">Tên A–Z</option>
            </select>
            <Button
              variant="outline"
              disabled={!rows.length}
              onClick={() =>
                downloadCsv(
                  "doanh-thu-giang-vien.csv",
                  [
                    "Giảng viên",
                    "Email",
                    "Số đơn",
                    "Thu giảng viên",
                    "Phần CodeMentor",
                  ],
                  rows.map((i) => [
                    i.name,
                    i.email,
                    i.orders,
                    i.revenue,
                    i.platformRevenue,
                  ]),
                )
              }
            >
              <Download className="size-4" />
              Xuất CSV danh sách
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {[
                    "Giảng viên",
                    "Số đơn",
                    "Thu giảng viên (VNĐ)",
                    "Phần CodeMentor (VNĐ)",
                    "Thao tác",
                  ].map((label, index) => (
                    <th
                      key={label}
                      className={`px-5 py-4 font-medium ${index ? "text-right" : ""}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice((activePage - 1) * 10, activePage * 10).map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.email}</p>
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {i.orders}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {vnd(i.revenue)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {vnd(i.platformRevenue)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="outline" onClick={() => onSelect(i.id)}>
                        Xem báo cáo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p className="p-6 text-sm text-muted-foreground">
              Không có giảng viên phù hợp.
            </p>
          )}
          <ServerPagination
            page={activePage}
            total={rows.length}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </details>
    </div>
  );
}
