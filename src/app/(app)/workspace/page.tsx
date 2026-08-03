import { PageBanner } from "@/components/page-banner";
import { StudyGroupBoard } from "@/components/study-group/study-group-board";
import { CURRENT_USER_NAME } from "@/data/study-groups";
import { studyGroupService } from "@/lib/study-group/study-group-service";
import { PAGE_ILLUSTRATIONS } from "@/lib/content-illustrations";

export default async function WorkspaceListPage() {
  const groups = await studyGroupService.getAll();

  return (
    <div>
      <PageBanner
        illustrationSrc={PAGE_ILLUSTRATIONS.workspace}
        title="Không gian học tập"
        description="Nơi học và luyện tập cùng các nhóm của bạn — nhóm tự tạo hoặc tham gia qua lời mời từ người khác. Mỗi nhóm có tài liệu, bài tập và bảng tiến độ riêng."
      />
      <StudyGroupBoard groups={groups} currentUserName={CURRENT_USER_NAME} />
    </div>
  );
}
