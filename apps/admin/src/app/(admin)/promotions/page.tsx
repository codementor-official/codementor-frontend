import { BadgePercent } from "lucide-react";
import { PageHeader } from "@codementor/ui";
import { PromotionManager } from "@/features/commerce/promotion-manager";

export default function Page() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon={BadgePercent}
        title="Quản lý khuyến mãi"
        description="Duyệt đề xuất của giảng viên và quản lý các chương trình ưu đãi trên toàn hệ thống."
      />
      <PromotionManager />
    </div>
  );
}
