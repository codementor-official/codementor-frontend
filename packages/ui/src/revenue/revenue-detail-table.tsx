"use client";
import { useState } from "react";
import type { RevenueReport } from "@codementor/types";
import { ServerPagination } from "../server-pagination";
import { revenueDate, revenueMoney } from "./format";

export function RevenueDetailTable({ report }: { report: RevenueReport }) {
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const rows = report.daily
    .filter((p) => !activeOnly || p.orders > 0)
    .sort((a, b) =>
      sort === "revenue"
        ? b.revenue - a.revenue
        : sort === "oldest"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h3 className="text-lg font-semibold">Số liệu từng ngày</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} ngày · Kỳ {revenueDate(report.from)} –{" "}
            {revenueDate(report.to)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(1);
              }}
            />
            Chỉ ngày có đơn
          </label>
          <select
            aria-label="Sắp xếp số liệu từng ngày"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Ngày mới nhất</option>
            <option value="oldest">Ngày cũ nhất</option>
            <option value="revenue">Doanh thu cao nhất</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <caption className="sr-only">
            Số liệu doanh thu theo ngày, cùng kỳ và phạm vi với biểu đồ
          </caption>
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {[
                "Ngày",
                "Số đơn",
                "Giá trị đơn (VNĐ)",
                report.scope === "admin"
                  ? "Phần CodeMentor (VNĐ)"
                  : "Thu giảng viên (VNĐ)",
                "Hoàn tiền (VNĐ)",
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
            {rows.slice((currentPage - 1) * 10, currentPage * 10).map((p) => (
              <tr key={p.date} className="hover:bg-muted/30">
                <td className="px-5 py-4">{revenueDate(p.date)}</td>
                {[
                  p.orders.toLocaleString("vi-VN"),
                  revenueMoney(p.gross),
                  revenueMoney(p.revenue),
                  revenueMoney(p.refunded),
                ].map((value, index) => (
                  <td key={index} className="px-5 py-4 text-right tabular-nums">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Không có ngày phù hợp.
        </p>
      )}
      <ServerPagination
        page={currentPage}
        total={rows.length}
        pageSize={10}
        onPageChange={setPage}
      />
    </section>
  );
}

export function RevenueCourseTable({
  report,
  onSelect,
}: {
  report: RevenueReport;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("revenue");
  const [page, setPage] = useState(1);
  const rows = report.courses
    .filter((c) =>
      c.title.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")),
    )
    .sort((a, b) =>
      sort === "orders"
        ? b.orders - a.orders
        : sort === "name"
          ? a.title.localeCompare(b.title, "vi")
          : b.revenue - a.revenue,
    );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b p-5">
        <h3 className="mr-auto text-lg font-semibold">Chi tiết khóa học</h3>
        <input
          aria-label="Tìm khóa học trong báo cáo"
          className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Tên khóa học"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Sắp xếp khóa học trong báo cáo"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="revenue">Phần thu cao nhất</option>
          <option value="orders">Nhiều đơn nhất</option>
          <option value="name">Tên A–Z</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-medium">Khóa học</th>
              <th className="px-5 py-4 text-right font-medium">Số đơn</th>
              <th className="px-5 py-4 text-right font-medium">
                {report.scope === "admin"
                  ? "Phần CodeMentor (VNĐ)"
                  : "Thu giảng viên (VNĐ)"}
              </th>
              <th className="px-5 py-4 text-right font-medium">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.slice((currentPage - 1) * 10, currentPage * 10).map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-4 font-medium">
                  <p className="line-clamp-2">{c.title}</p>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {c.orders}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {revenueMoney(c.revenue)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    className="rounded-md border px-3 py-2 transition-colors hover:bg-muted"
                    onClick={() => onSelect(c.id)}
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Không có khóa học phù hợp.
        </p>
      )}
      <ServerPagination
        page={currentPage}
        total={rows.length}
        pageSize={10}
        onPageChange={setPage}
      />
    </section>
  );
}
