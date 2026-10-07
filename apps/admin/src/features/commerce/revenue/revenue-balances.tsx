import type { RevenueInstructor } from "@codementor/types";
import { vnd } from "../api";

export function RevenueBalances({
  instructors,
  selectedId,
}: {
  instructors: RevenueInstructor[];
  selectedId: string;
}) {
  const scope = selectedId
    ? instructors.filter((i) => i.id === selectedId)
    : instructors;
  const balances = [
    {
      key: "pending",
      label: "Đang chờ khả dụng",
      description:
        "Doanh thu chưa hết thời gian giữ hoặc chưa đủ điều kiện đối soát.",
    },
    {
      key: "available",
      label: "Có thể yêu cầu rút",
      description: "Số dư đã đủ điều kiện để giảng viên tạo yêu cầu rút tiền.",
    },
    {
      key: "reserved",
      label: "Đang giữ để rút",
      description: "Đã được dành cho yêu cầu rút, chưa xác nhận chi trả.",
    },
    {
      key: "paid",
      label: "Đã chi trả",
      description: "Tổng chi trả đã xác nhận trong toàn bộ lịch sử.",
    },
  ] as const;
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold">
          Số dư {selectedId ? "giảng viên đã chọn" : "toàn hệ thống"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Số dư sổ cái tại thời điểm tải, không bị giới hạn bởi khoảng thời gian
          của báo cáo và không phải số dư ngân hàng. Hoàn tiền, nợ bù trừ hoặc
          chi trả chưa xác định có thể làm thay đổi khả năng rút thực tế.
        </p>
      </div>
      <dl className="divide-y">
        {balances.map((b) => (
          <div
            key={b.key}
            className="flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div>
              <dt className="font-medium">{b.label}</dt>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.description}
              </p>
            </div>
            <dd className="text-xl font-semibold tabular-nums">
              {vnd(scope.reduce((sum, i) => sum + i[b.key], 0))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
