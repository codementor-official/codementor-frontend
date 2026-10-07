"use client";
import { Download } from "lucide-react";
import { Button, Modal } from "@codementor/ui";
import {
  COMMERCE_STATUS,
  type CommerceJobRun,
  type CommerceJobStage,
} from "@codementor/types";
import { downloadCsv } from "@codementor/utils";
import { vnd } from "./api";

const labels: Record<CommerceJobStage["name"], string> = {
  payments: "Xác minh thanh toán",
  refunds: "Kiểm tra hoàn tiền",
  expiry: "Đánh dấu đơn hết hạn",
  income: "Mở doanh thu khả dụng",
  payouts: "Xử lý chi trả đã duyệt",
};
const outcomes = {
  completed: "Đã xác nhận",
  waiting: "Còn chờ",
  failed: "Cần kiểm tra",
};

export function JobResultDialog({
  result,
  close,
  policy,
}: {
  result: CommerceJobRun | null;
  close: () => void;
  policy: () => void;
}) {
  if (!result) return null;
  const alreadyRunning = result.status === "already_running";
  const totalSelected = result.stages.reduce((n, s) => n + s.selected, 0);
  const title = alreadyRunning
    ? "Đã có lượt đối soát đang chạy"
    : result.status === "partial"
      ? "Đối soát hoàn tất một phần"
      : "Kết quả đối soát";
  return (
    <Modal
      open
      onClose={close}
      width="lg"
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={policy}>
            Chính sách doanh thu
          </Button>
          <Button
            variant="outline"
            disabled={alreadyRunning}
            onClick={() =>
              downloadCsv(
                `doi-soat-${result.runId}.csv`,
                [
                  "Mã lượt",
                  "Bắt đầu",
                  "Kết thúc",
                  "Tác vụ",
                  "Được chọn",
                  "Đã xác nhận",
                  "Còn chờ",
                  "Lỗi",
                  "Thông báo",
                ],
                result.stages.map((s) => [
                  result.runId,
                  result.startedAt,
                  result.finishedAt,
                  labels[s.name],
                  s.selected,
                  s.completed,
                  s.waiting,
                  s.failed,
                  s.error ?? "",
                ]),
              )
            }
          >
            <Download className="size-4" /> Xuất kết quả
          </Button>
          <Button onClick={close}>Đóng báo cáo</Button>
        </>
      }
    >
      <div className="space-y-5 text-sm">
        <p className="text-muted-foreground">
          {alreadyRunning
            ? "Không khởi chạy thêm lượt mới. Đợi tác vụ hiện tại hoàn tất rồi làm mới dữ liệu."
            : totalSelected === 0 && result.status === "completed"
              ? "Không có giao dịch đến lượt xử lý trong lần này. Số dư không bị thay đổi."
              : "Số liệu dưới đây là kết quả của lượt này, không phải toàn bộ lịch sử giao dịch."}
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">
              Doanh thu chuyển sang khả dụng
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {vnd(result.releasedAmountVnd)}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">
              Doanh thu dùng bù khoản cần thu hồi
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {vnd(result.debtOffsetVnd)}
            </dd>
          </div>
        </dl>
        {!alreadyRunning && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-lg text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  {["Tác vụ", "Được chọn", "Đã xác nhận", "Còn chờ", "Lỗi"].map(
                    (h) => (
                      <th key={h} className="whitespace-nowrap p-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.stages.map((s) => (
                  <tr key={s.name}>
                    <td className="p-3 font-medium">
                      {labels[s.name]}
                      {s.error && (
                        <p
                          role="alert"
                          className="mt-1 text-xs text-destructive"
                        >
                          {s.error}
                        </p>
                      )}
                    </td>
                    {[s.selected, s.completed, s.waiting, s.failed].map(
                      (n, i) => (
                        <td key={i} className="p-3 tabular-nums">
                          {n}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!alreadyRunning && (
          <p className="text-xs text-muted-foreground">
            “Đã xác nhận” nghĩa là đã có kết quả cuối, kể cả thanh toán/hoàn
            tiền/chi trả thất bại; không đồng nghĩa tất cả đã thành công. “Lỗi”
            là thao tác hoặc đọc kết quả gặp sự cố. Mở doanh thu chỉ đếm giao
            dịch thật sự chuyển trạng thái.
          </p>
        )}
        {!alreadyRunning && (
          <section className="rounded-lg border p-4">
            <h3 className="font-semibold">
              Vì sao vẫn còn doanh thu đang chờ?
            </h3>
            {result.remaining ? (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ["Chưa hết thời gian giữ", result.remaining.holding],
                  [
                    "Đang bị chặn bởi hoàn tiền",
                    result.remaining.refundBlocked,
                  ],
                  ["Chưa xác minh thanh toán", result.remaining.unverified],
                  [
                    "Đủ điều kiện, còn trong hàng đợi",
                    result.remaining.eligible,
                  ],
                ].map(([label, n]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{n}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Chưa đọc được thống kê còn chờ. Hãy làm mới dữ liệu; không coi
                đây là 0 giao dịch.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Mỗi lượt xử lý tối đa 20 thanh toán, 20 hoàn tiền, 50 đơn mở doanh
              thu và 50 yêu cầu chi trả. VNPAY chưa đến lượt tra soát sẽ được
              giữ lại; đơn hết hạn được đánh dấu riêng. Đối soát không rút ngắn
              thời gian giữ hoặc tự duyệt rút tiền.
            </p>
          </section>
        )}
        {result.stages.some((s) => s.items.length > 0) && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">
              Xem các giao dịch trong lượt này
            </summary>
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="p-2">Tác vụ / mã</th>
                    <th className="p-2">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {result.stages.flatMap((s) =>
                    s.items.map((item) => (
                      <tr key={`${s.name}-${item.id}`} className="border-t">
                        <td className="break-all p-2">
                          {labels[s.name]}
                          <p className="text-muted-foreground">{item.id}</p>
                        </td>
                        <td className="p-2">
                          {outcomes[item.outcome]}
                          {item.status && (
                            <p className="text-muted-foreground">
                              {COMMERCE_STATUS[item.status] ?? item.status}
                            </p>
                          )}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </details>
        )}
        <p className="break-all text-xs text-muted-foreground">
          Mã lượt: {result.runId}
          <br />
          {new Date(result.startedAt).toLocaleString("vi-VN")} →{" "}
          {new Date(result.finishedAt).toLocaleString("vi-VN")}
          <br />
          Báo cáo được giữ trong trang hiện tại. Nhật ký và biến động số dư lưu
          các thay đổi đã ghi nhận.
        </p>
      </div>
    </Modal>
  );
}
