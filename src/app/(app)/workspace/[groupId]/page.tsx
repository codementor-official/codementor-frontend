import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GroupTabNav } from "@/components/study-group/group-tab-nav";
import { resolveTab } from "@/components/study-group/group-tabs";
import { AssignmentsTab } from "@/components/study-group/tabs/assignments-tab";
import { DocumentsTab } from "@/components/study-group/tabs/documents-tab";
import { ExercisesTab } from "@/components/study-group/tabs/exercises-tab";
import { MembersTab } from "@/components/study-group/tabs/members-tab";
import { OverviewTab } from "@/components/study-group/tabs/overview-tab";
import { SettingsTab } from "@/components/study-group/tabs/settings-tab";
import { groupDetailService } from "@/lib/study-group/group-detail-service";
import { studyGroupService } from "@/lib/study-group/study-group-service";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";

export default async function WorkspaceGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { groupId } = await params;
  const { tab: rawTab } = await searchParams;

  const group = await studyGroupService.getById(groupId);
  if (!group) notFound();

  const detail = await groupDetailService.get(groupId);
  const isOwner = group.role === "owner";
  const tab = resolveTab(rawTab, isOwner);
  // Deputies inherit the management-facing controls; plain members get read-only tables.
  const canManage = isOwner || group.role === "deputy";

  return (
    <div>
      <Link
        href="/workspace"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách nhóm
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-white">
          {group.tile}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-navy">{group.name}</h1>
          <p className="text-xs text-text-faint">
            {detail.members.length} thành viên · {group.openTaskCount} bài tập đang mở
          </p>
        </div>
        <Badge tone={isOwner ? "brown" : "neutral"}>{ROLE_LABEL[group.role]}</Badge>
      </div>

      <GroupTabNav groupId={groupId} active={tab} isOwner={isOwner} />

      {tab === "overview" && <OverviewTab group={group} detail={detail} />}
      {tab === "docs" && <DocumentsTab documents={detail.documents} canManage={canManage} />}
      {tab === "exercises" && (
        <ExercisesTab
          exercises={detail.exercises}
          members={detail.members}
          assignments={detail.assignments}
          canManage={canManage}
        />
      )}
      {tab === "assignments" && (
        <AssignmentsTab
          groupId={groupId}
          exercises={detail.exercises}
          members={detail.members}
          assignments={detail.assignments}
        />
      )}
      {tab === "members" && (
        <MembersTab members={detail.members} groupCode={group.code} canManage={isOwner} />
      )}
      {tab === "progress" && (
        <Card className="border-dashed p-12 text-center">
          <Construction className="mx-auto mb-2 h-6 w-6 text-text-faint" />
          <p className="text-sm font-semibold text-navy">Tiến độ đang được xây dựng</p>
          <p className="mt-1 text-xs text-text-faint">
            Biểu đồ tiến độ chi tiết của nhóm sẽ xuất hiện ở đây.
          </p>
        </Card>
      )}
      {tab === "settings" && (
        <SettingsTab group={group} members={detail.members} permissions={detail.permissions} />
      )}
    </div>
  );
}
