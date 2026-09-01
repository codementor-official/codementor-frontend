import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RecommendedGroups } from "@/components/recommendation/recommended";
import { StudyGroupBoard } from "@/components/study-group/study-group-board";

export default function WorkspaceListPage() {
  return (
    <div>
      <PageHeader
        icon={Users}
        title="Nhóm học tập"
        subtitle="Nhóm bạn tự tạo hoặc tham gia qua lời mời. Mỗi nhóm có tài liệu, bài tập và bảng tiến độ riêng."
      />
      {/* Đứng TRƯỚC bảng nhóm: tab mặc định của bảng là "Nhóm của tôi", nên người chưa vào
          nhóm nào sẽ gặp một màn hình rỗng nếu không có dải này. Đề xuất chỉ lấy nhóm công
          khai chưa tham gia, không trùng với bất kỳ tab nào bên dưới. */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-navy">Nhóm có thể hợp với bạn</h2>
        <RecommendedGroups />
      </section>
      <StudyGroupBoard />
    </div>
  );
}
