import { EyeOff, Lock, TriangleAlert } from "lucide-react";
import type { GroupPlan, OverageReason } from "@codementor/types";
import { formatVnDate } from "@codementor/utils";
import { Button } from "@/components/ui/button";

const REASON: Record<OverageReason, string> = {
  groups: "chủ nhóm sở hữu nhiều nhóm hơn gói cho phép",
  members: "nhóm có nhiều thành viên hơn gói cho phép",
  storage: "dung lượng tài liệu vượt hạn mức gói",
};

/**
 * Tells everyone in a group why it is (or soon will be) restricted, and the owner what to do.
 * Nothing is shown while the group is within its owner's plan.
 */
export function GroupPlanBanner({ plan, owner }: { plan: GroupPlan; owner: boolean }) {
  const r = plan.restriction;
  if (!r) return null;
  const why = r.reasons.map((reason) => REASON[reason]).join(", ");
  const copy = {
    notice: {
      icon: TriangleAlert,
      tone: "border-warning/40 bg-warning/10",
      title: `Nhóm sẽ chuyển sang chỉ đọc từ ${formatVnDate(r.readOnlyAt)}`,
      body: owner
        ? `Lý do: ${why} (gói ${plan.name}). Nâng cấp hoặc dọn dẹp trước ngày này để nhóm hoạt động bình thường.`
        : `Lý do: ${why}. Mọi thứ vẫn hoạt động bình thường cho đến ngày này.`,
    },
    read_only: {
      icon: Lock,
      tone: "border-warning/40 bg-warning/10",
      title: "Nhóm đang ở chế độ chỉ đọc",
      body: owner
        ? `Lý do: ${why} (gói ${plan.name}). Từ ${formatVnDate(r.hiddenAt)} thành viên sẽ không mở được nhóm. Dữ liệu không bị xoá.`
        : `Bạn vẫn xem, tải tài liệu và làm bài đã giao; chưa thêm được nội dung mới. Lý do: ${why}.`,
    },
    hidden: {
      icon: EyeOff,
      tone: "border-danger/40 bg-danger/10",
      title: "Nhóm đang tạm ẩn với thành viên",
      body: `Lý do: ${why} (gói ${plan.name}). Chỉ bạn còn mở được nhóm để dọn dẹp. Dữ liệu vẫn được giữ nguyên.`,
    },
  }[r.stage];

  return (
    <div role="status" className={`mb-4 flex flex-wrap items-start gap-3 rounded-lg border p-4 text-sm text-text ${copy.tone}`}>
      <copy.icon className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy">{copy.title}</p>
        <p className="mt-0.5 text-text-muted">{copy.body}</p>
        {owner && (
          <p className="mt-1 text-xs text-text-faint">
            Mở lại ngay khi: gia hạn hoặc nâng cấp gói, xoá bớt thành viên hoặc tài liệu (kể cả trong thùng rác), hoặc chuyển nhóm cho người khác.
          </p>
        )}
      </div>
      {owner && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" href="/workspace/billing">
            Hạn mức của tôi
          </Button>
          <Button size="sm" href="/workspace/pricing">
            Xem các gói
          </Button>
        </div>
      )}
    </div>
  );
}
