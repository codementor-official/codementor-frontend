import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { ProgressTab } from "@/components/study-group/tabs/progress-tab";
import { groupDetailService } from "@/lib/study-group/group-detail-service";
import { studyGroupService } from "@/lib/study-group/study-group-service";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import { effectiveMemberPermissions } from "@/types/study-group-detail";

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
  const currentMember = group.role === "member"
    ? detail.members.find((member) => member.id === "van-b")
    : detail.members.find((member) => member.id === "gia-si") ?? detail.members[0];
  const currentPermissions = currentMember
    ? effectiveMemberPermissions(currentMember, detail.permissions)
    : null;

  return (
    <div>
      <Link
        href="/workspace"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách nhóm
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-on-ink">
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
          documents={detail.documents}
          canManage={canManage}
          canCreate={canManage || Boolean(currentPermissions?.createExercise)}
          currentMemberId={currentMember?.id ?? ""}
          currentMemberName={currentMember?.name ?? "Bạn"}
        />
      )}
      {tab === "assignments" && (
        <AssignmentsTab
          groupId={groupId}
          exercises={detail.exercises}
          members={detail.members}
          assignments={detail.assignments}
          canReview={canManage || Boolean(currentPermissions?.reviewSubmission)}
          currentMemberId={currentMember?.id ?? ""}
        />
      )}
      {tab === "members" && (
        <MembersTab
          members={detail.members}
          groupCode={group.code}
          canManage={isOwner}
          assignments={detail.assignments}
          exercises={detail.exercises}
          permissions={detail.permissions}
        />
      )}
      {tab === "progress" && <ProgressTab detail={detail} />}
      {tab === "settings" && (
        <SettingsTab group={group} members={detail.members} permissions={detail.permissions} />
      )}
    </div>
  );
}
