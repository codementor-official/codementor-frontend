import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RecommendedGroups } from "@/components/study-group/recommended-groups";
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
      <StudyGroupBoard initialScope={tab === "public" ? "public" : "mine"} />
      {/* Gợi ý đứng SAU nhóm của chính người dùng: người vào trang này phần lớn để mở lại
          nhóm đang học, và trên mobile hai thẻ gợi ý từng đẩy nhóm của họ xuống hơn một màn.
          Tab Nhóm công khai phía trên vẫn là catalogue đầy đủ. */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold text-navy">Nhóm có thể hợp với bạn</h2>
        <RecommendedGroups />
      </section>
    </div>
  );
}
