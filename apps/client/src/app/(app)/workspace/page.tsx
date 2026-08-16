import { StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { StudyGroupBoard } from "@/components/study-group/study-group-board";
import { CURRENT_USER_NAME } from "@/data/study-groups";
import { studyGroupService } from "@/lib/study-group/study-group-service";
import { summarizeGroups } from "@/lib/study-group/study-group-stats";

export default async function WorkspaceListPage() {
  const groups = await studyGroupService.getAll();
  const summary = summarizeGroups(groups);

  return (
    <div>
      <PageHeader
        title="Nhóm học tập"
        subtitle="Nhóm bạn tự tạo hoặc tham gia qua lời mời. Mỗi nhóm có tài liệu, bài tập và bảng tiến độ riêng."
      />
      {/* Counted from the groups themselves — the banner's "1 bài đang chờ" and
        * "Tuần này" were fixed strings that never moved. */}
      <StatStrip
        className="mb-5"
        stats={[
          { label: "Nhóm", value: summary.totalGroups },
          { label: "Bạn quản lý", value: summary.ownedCount },
          { label: "Đã tham gia", value: summary.joinedCount },
          { label: "Bài tập đang mở", value: summary.openTaskCount },
        ]}
      />
      <StudyGroupBoard groups={groups} currentUserName={CURRENT_USER_NAME} />
    </div>
  );
}
