import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RecommendedGroups } from "@/components/recommendation/recommended";
import { StudyGroupBoard } from "@/components/study-group/study-group-board";

export default async function WorkspaceListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div>
      <PageHeader
        icon={Users}
        title="Nhóm học tập"
        subtitle="Quản lý nhóm của bạn hoặc tìm nhóm công khai để xem thông tin và gửi yêu cầu tham gia."
      />
      {/* Dải cá nhân hóa giúp người dùng thấy gợi ý ngay; tab Nhóm công khai bên
          dưới là catalogue đầy đủ, có tìm kiếm và phân trang server-side. */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-navy">Nhóm có thể hợp với bạn</h2>
        <RecommendedGroups />
      </section>
      <StudyGroupBoard initialScope={tab === "public" ? "public" : "mine"} />
    </div>
  );
}
