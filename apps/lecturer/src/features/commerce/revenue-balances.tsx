import type { WalletSummary } from "@codementor/types";
import { vnd } from "./api";
import { formatHoldingPeriod } from "@codementor/utils";

export function LecturerRevenueBalances({
  wallet,
}: {
  wallet: WalletSummary | null;
}) {
  if (!wallet)
    return (
      <p className="text-sm text-muted-foreground">Chưa tải được số dư.</p>
    );
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold">Số dư & khả năng rút</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Số dư sổ cái của toàn bộ lịch sử, không phải số dư ngân hàng hay doanh
          thu trong kỳ. Đơn mới chờ{" "}
          {formatHoldingPeriod(
            wallet.policy.holdMinutes ?? wallet.policy.holdDays * 1440,
          )}{" "}
          và đủ điều kiện đối soát; từng đơn cũ giữ chính sách đã lưu.
        </p>
      </div>
      <dl className="divide-y">
        {[
          ["pending", "Doanh thu đang chờ"],
          ["available", "Sẵn sàng yêu cầu rút"],
          ["reserved", "Đang giữ để rút"],
          ["paid", "Đã chi trả"],
          ["refund_held", "Giữ để hoàn tiền"],
        ].map(([key, label]) => (
          <div key={key} className="flex flex-wrap justify-between gap-3 p-5">
            <dt className="font-medium">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {vnd(wallet.balances[key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
