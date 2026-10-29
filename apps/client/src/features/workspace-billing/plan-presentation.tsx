import { FileUp, HardDrive, Sparkles, UsersRound, LayoutGrid, type LucideIcon } from "lucide-react";
import type { BillingCycle, Entitlements, FeatureDefinition, SubscriptionState } from "@codementor/types";
import { formatBytes, formatLimit } from "@codementor/utils";

export interface LimitRow {
  key: keyof Omit<Entitlements, "features">;
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}

/** The limits a plan grants, in the order people compare them. */
export function limitRows(e: Entitlements): LimitRow[] {
  return [
    {
      key: "maxOwnedGroups",
      icon: LayoutGrid,
      label: "Nhóm sở hữu",
      value: `${formatLimit(e.maxOwnedGroups)} nhóm`,
      hint: "Số nhóm học tập bạn được làm Chủ nhóm, tính cả nhóm đã lưu trữ.",
    },
    {
      key: "maxMembersPerGroup",
      icon: UsersRound,
      label: "Thành viên mỗi nhóm",
      value: e.maxMembersPerGroup === null ? "Không giới hạn*" : `${formatLimit(e.maxMembersPerGroup)} người`,
      hint: "Tính riêng cho từng nhóm, gồm cả Chủ nhóm. * Không giới hạn theo chính sách sử dụng hợp lý.",
    },
    {
      key: "maxStorageBytes",
      icon: HardDrive,
      label: "Dung lượng tài liệu",
      value: formatBytes(e.maxStorageBytes),
      hint: "Tổng dung lượng tài liệu của tất cả nhóm bạn sở hữu, không reset theo tháng.",
    },
    {
      key: "maxUploadBytes",
      icon: FileUp,
      label: "Tệp tối đa",
      value: formatBytes(e.maxUploadBytes),
      hint: "Kích thước tối đa của một tệp tải lên. Tệp còn phải vừa với dung lượng còn lại.",
    },
    {
      key: "monthlyAiRequests",
      icon: Sparkles,
      label: "Lượt hỏi AI tài liệu",
      value: `${formatLimit(e.monthlyAiRequests)} / tháng`,
      hint: "Số câu hỏi Trợ lý AI tài liệu trong mọi nhóm bạn sở hữu, tính theo tháng (giờ Việt Nam).",
    },
  ];
}

export function featureLabel(features: FeatureDefinition[], key: string) {
  return features.find((f) => f.key === key);
}

export const CYCLE_LABEL: Record<BillingCycle, string> = { month: "tháng", year: "năm" };

export const STATE_LABEL: Record<SubscriptionState, { label: string; tone: "success" | "neutral" | "primary" | "danger" }> = {
  FREE: { label: "Miễn phí", tone: "neutral" },
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  CANCEL_SCHEDULED: { label: "Đã huỷ gia hạn", tone: "primary" },
  GRACE_PERIOD: { label: "Trong thời gian ân hạn", tone: "primary" },
  EXPIRED: { label: "Đã hết hạn", tone: "danger" },
  CANCELLED: { label: "Đã kết thúc", tone: "neutral" },
  SUSPENDED: { label: "Tạm ngưng", tone: "danger" },
};

/** Side-by-side limits, highlighting what goes down — shown before any plan change. */
export function EntitlementDiff({ from, to, fromLabel, toLabel }: { from: Entitlements; to: Entitlements; fromLabel: string; toLabel: string }) {
  const before = limitRows(from);
  const after = limitRows(to);
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-border-soft text-left text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Hạn mức</th>
            <th className="px-3 py-2 font-semibold">{fromLabel}</th>
            <th className="px-3 py-2 font-semibold">{toLabel}</th>
          </tr>
        </thead>
        <tbody>
          {before.map((row, i) => {
            const lower = isLower(row.key, from, to);
            return (
              <tr key={row.key} className="border-t border-border-soft">
                <td className="px-3 py-2 text-text-muted">{row.label}</td>
                <td className="px-3 py-2 text-text">{row.value}</td>
                <td className={`px-3 py-2 font-semibold ${lower ? "text-danger" : "text-navy"}`}>
                  {after[i].value}
                  {lower && <span className="sr-only"> (thấp hơn)</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function isLower(key: LimitRow["key"], from: Entitlements, to: Entitlements) {
  const a = from[key];
  const b = to[key];
  if (a === null) return b !== null;
  return b !== null && b < a;
}
