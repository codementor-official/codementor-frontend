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
  completed: "Đã xử lý",
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
  const income = result.stages.find((stage) => stage.name === "income");
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
        {!alreadyRunning && (
          <section className="rounded-lg border bg-muted/40 p-4">
            <h3 className="font-semibold">
              {result.releasedAmountVnd > 0
                ? `Đã chuyển ${vnd(result.releasedAmountVnd)} sang số dư khả dụng`
                : "Lượt này không tăng số dư khả dụng"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {income?.completed
                ? `${income.completed} đơn đã được mở doanh thu. `
                : "Không có đơn mới được mở doanh thu trong lượt này. "}
              {result.debtOffsetVnd > 0 &&
                `${vnd(result.debtOffsetVnd)} được dùng bù khoản cần thu hồi, không cộng vào tiền có thể rút. `}
              Đây là thay đổi của lượt vừa chạy, không phải số dư hiện tại; hệ
              thống có thể đã mở doanh thu ở lượt tự động trước đó.
            </p>
            {result.status === "partial" && (
              <p className="mt-2 text-destructive">
                Một số tác vụ gặp lỗi. Các thay đổi thành công vẫn được ghi
                nhận; xem chi tiết tác vụ bên dưới trước khi chạy lại.
              </p>
            )}
          </section>
        )}
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
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">
              Chi tiết 5 tác vụ trong lượt này
            </summary>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    {["Tác vụ", "Đến lượt", "Đã xử lý", "Còn chờ", "Lỗi"].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap p-3 font-medium"
                        >
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
            <p className="mt-3 text-xs text-muted-foreground">
              Đã xử lý nghĩa là đã có kết quả cuối, có thể là thành công hoặc
              thất bại. Mỗi tác vụ đếm riêng; một đơn có thể xuất hiện ở nhiều
              tác vụ, không cộng các cột thành số đơn duy nhất.
            </p>
          </details>
        )}
        {!alreadyRunning && (
          <section className="rounded-lg border p-4">
            <h3 className="font-semibold">
              Các khoản còn chờ & việc cần làm tiếp
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
            {result.remaining && (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {result.remaining.holding > 0 && (
                  <li>
                    • Chưa hết hạn giữ: đợi mốc giờ đã lưu trên từng đơn. Đổi
                    chính sách không rút ngắn hạn của đơn cũ.
                  </li>
                )}
                {result.remaining.unverified > 0 && (
                  <li>
                    • Chưa xác minh: đợi lượt tra soát cổng thanh toán. VNPAY
                    yêu cầu các lượt của cùng giao dịch cách nhau ít nhất 6
                    phút, độc lập với thời gian giữ 1 phút.
                  </li>
                )}
                {result.remaining.refundBlocked > 0 && (
                  <li>
                    • Có hoàn tiền: kiểm tra mục Hoàn tiền, chưa chuyển khoản
                    đang bị chặn sang khả dụng.
                  </li>
                )}
                {result.remaining.eligible > 0 && (
                  <li>
                    • Đủ điều kiện còn trong hàng đợi: đợi lượt tự động tiếp
                    theo; nếu tác vụ mở doanh thu có lỗi, kiểm tra lỗi trước khi
                    chạy lại.
                  </li>
                )}
                <li>
                  • Mở Doanh thu hệ thống → Số dư & nghĩa vụ để xem số dư hiện
                  tại của từng giảng viên. Đối soát chỉ chuyển doanh thu đủ điều
                  kiện, không tự duyệt yêu cầu rút mới.
                </li>
              </ul>
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
