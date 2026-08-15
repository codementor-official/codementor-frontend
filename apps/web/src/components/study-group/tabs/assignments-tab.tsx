"use client";

import { ClipboardCheck, UsersRound } from "lucide-react";
import { AssignmentManagerTable } from "@/components/study-group/assignment-manager-table";
import { AssignmentMemberList } from "@/components/study-group/assignment-member-list";
import { Card } from "@/components/ui/card";
import type { Assignment, GroupExercise, GroupMember } from "@/types/study-group-detail";

/**
 * Assignment surfaces deliberately split at the role boundary: members only receive
 * their own work while reviewers receive the management table and per-exercise drawer.
 * Replace these props with groupDetailService queries once the API is available.
 */
export function AssignmentsTab({
  exercises,
  members,
  assignments,
  canReview,
  currentMemberId,
}: {
  groupId: string;
  exercises: GroupExercise[];
  members: GroupMember[];
  assignments: Assignment[];
  canReview: boolean;
  currentMemberId: string;
}) {
  const myAssignments = assignments.filter((assignment) => assignment.memberId === currentMemberId);
  return <div>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-base font-bold text-navy">{canReview ? <UsersRound className="h-4 w-4 text-primary" /> : <ClipboardCheck className="h-4 w-4 text-primary" />}{canReview ? "Theo dõi bài nộp của nhóm" : "Bài tập của bạn"}</h2><p className="mt-1 text-xs text-text-faint">{canReview ? "Xem tiến độ theo từng bài tập, mở drawer để quản lý kết quả từng thành viên." : "Theo dõi hạn nộp, điểm, lượt làm và lịch sử kết quả của riêng bạn."}</p></div>{!canReview && <Card className="px-3 py-2 text-right"><div className="text-lg font-bold text-navy">{myAssignments.length}</div><div className="text-2xs text-text-faint">bài được giao</div></Card>}</div>
    {canReview ? <AssignmentManagerTable exercises={exercises} assignments={assignments} members={members} /> : <AssignmentMemberList assignments={myAssignments} exercises={exercises} />}
  </div>;
}
