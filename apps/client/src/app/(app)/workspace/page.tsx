import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StudyGroupBoard } from "@/components/study-group/study-group-board";

export default function WorkspaceListPage() {
  return (
    <div>
      <PageHeader
        icon={Users}
        title="Nhóm học tập"
        subtitle="Nhóm bạn tự tạo hoặc tham gia qua lời mời. Mỗi nhóm có tài liệu, bài tập và bảng tiến độ riêng."
      />
      <StudyGroupBoard />
    </div>
  );
}
