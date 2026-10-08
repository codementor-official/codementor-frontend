"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, Modal, ServerPagination } from "@codementor/ui";
import {
  COMMERCE_INCOME_STATUS,
  COMMERCE_STATUS,
  type CommerceOrder,
  type CoursePurchasePage,
} from "@codementor/types";
import {
  downloadCsv,
  printDocument,
  formatHoldingPeriod,
} from "@codementor/utils";
import { holdingDeadline, OrderHoldingHint } from "./holding-explanation";
import { Download, Eye, Printer } from "lucide-react";
import { earningsApi, vnd } from "./api";

export function CoursePurchases({ courseId }: { courseId: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [detail, setDetail] = useState<CommerceOrder | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<CoursePurchasePage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await earningsApi.courseOrders(courseId, page, status, query, sort),
      );
      setError("");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [courseId, page, status, query, sort]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="font-semibold">Học viên đã mua</h2>
            <p className="text-sm text-muted-foreground">
              {data?.total ?? 0} giao dịch
              {status || query ? " phù hợp bộ lọc" : ""}. Quyền học chỉ được cấp
              sau khi thanh toán thành công.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!data?.items.length}
              onClick={() =>
                downloadCsv(
                  "hoc-vien-da-mua.csv",
                  [
                    "Học viên",
                    "Email",
                    "Ngày mua",
                    "Giá khóa học",
                    "Doanh thu giảng viên",
                    "Trạng thái",
                  ],
                  (data?.items ?? []).map((o) => [
                    o.buyer?.name ?? "Học viên",
                    o.buyer?.email ?? "",
                    new Date(o.createdAt).toLocaleString("vi-VN"),
                    o.amount,
                    o.instructorAmount,
                    COMMERCE_STATUS[o.status] ?? o.status,
                  ]),
                )
              }
            >
              <Download className="size-4" /> Xuất CSV trang này
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => void load()}
            >
              Làm mới
            </Button>
          </div>
        </div>
        {data && (
          <dl className="grid gap-3 border-b border-border p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Đã thanh toán</dt>
              <dd className="mt-1 text-lg font-semibold">
                {data.summary.paidCount} học viên
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Doanh số khóa học</dt>
              <dd className="mt-1 text-lg font-semibold">
                {vnd(data.summary.grossAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phần giảng viên</dt>
              <dd className="mt-1 text-lg font-semibold">
                {vnd(data.summary.instructorAmount)}
              </dd>
            </div>
          </dl>
        )}
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search.trim());
            }}
          >
            <input
              aria-label="Tìm học viên"
              className="min-w-56 rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Tên hoặc email học viên"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Tìm
            </Button>
          </form>
          <select
            aria-label="Lọc giao dịch"
            className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Mọi trạng thái</option>
            {[
              "paid",
              "pending",
              "failed",
              "cancelled",
              "review",
              "refunded",
            ].map((s) => (
              <option key={s} value={s}>
                {COMMERCE_STATUS[s]}
              </option>
            ))}
          </select>
          <select
            aria-label="Sắp xếp học viên đã mua"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="amount_high">Số tiền cao nhất</option>
            <option value="amount_low">Số tiền thấp nhất</option>
          </select>
        </div>
        {error && (
          <p role="alert" className="p-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p
            role="status"
            className="p-8 text-center text-sm text-muted-foreground"
          >
            Đang tải giao dịch…
          </p>
        ) : !data?.items.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Chưa có giao dịch phù hợp.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Học viên</th>
                  <th className="p-3 font-medium">Ngày mua</th>
                  <th className="p-3 font-medium">Giá khóa học</th>
                  <th className="p-3 font-medium">Doanh thu giảng viên</th>
                  <th className="p-3 font-medium">Trạng thái</th>
                  <th className="p-3 font-medium">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3">
                      <p className="font-medium">
                        {o.buyer?.name ?? "Học viên"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.buyer?.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap p-3">{vnd(o.amount)}</td>
                    <td className="whitespace-nowrap p-3">
                      {vnd(o.instructorAmount)}
                    </td>
                    <td className="p-3">
                      {COMMERCE_STATUS[o.status] ?? o.status}
                    </td>
                    <td className="p-3">
                      <Button variant="outline" onClick={() => setDetail(o)}>
                        <Eye className="size-4" /> Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <ServerPagination
            page={page}
            total={data.total}
            pageSize={data.limit}
            disabled={loading}
            onPageChange={setPage}
          />
        )}
      </Card>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết học viên mua khóa học"
        width="lg"
      >
        {detail && <PurchaseDetail item={detail} />}
      </Modal>
    </>
  );
}

function PurchaseDetail({ item }: { item: CommerceOrder }) {
  const rows: Array<[string, string]> = [
    ["Mã đơn", item.id],
    ["Khóa học", item.courseTitle],
    ["Học viên", item.buyer?.name ?? "Học viên"],
    ["Email", item.buyer?.email ?? ""],
    ["Ngày mua", new Date(item.createdAt).toLocaleString("vi-VN")],
    ["Giá bán", vnd(item.amount)],
    ["Doanh thu giảng viên", vnd(item.instructorAmount)],
    ["Trạng thái thanh toán", COMMERCE_STATUS[item.status] ?? item.status],
    [
      "Trạng thái doanh thu",
      COMMERCE_INCOME_STATUS[item.incomeState] ?? item.incomeState,
    ],
    [
      "Hạn giữ (giờ Việt Nam)",
      item.availableAt ? holdingDeadline(item.availableAt) : "Chưa xác định",
    ],
    [
      "Thời gian giữ đã lưu",
      item.holdMinutes != null
        ? formatHoldingPeriod(item.holdMinutes)
        : "Theo chính sách khi tạo đơn",
    ],
  ];
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <OrderHoldingHint order={item} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "hoc-vien-mua-khoa-hoc.csv",
              ["Thông tin", "Giá trị"],
              rows,
            )
          }
        >
          <Download className="size-4" /> Xuất CSV
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            printDocument({ title: "Chứng từ doanh thu khóa học", rows })
          }
        >
          <Printer className="size-4" /> In / lưu PDF
        </Button>
      </div>
    </div>
  );
}
