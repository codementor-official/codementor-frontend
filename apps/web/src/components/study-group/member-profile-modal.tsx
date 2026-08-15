"use client";

import { useMemo, useState } from "react";
import { Flame, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PERMISSION_LABELS } from "@/lib/study-group/group-detail-meta";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import {
  effectiveMemberPermissions,
  type Assignment,
  type GroupExercise,
  type GroupMember,
  type PermissionKey,
  type RolePermissions,
} from "@/types/study-group-detail";

function PermissionToggle({ on, onToggle, label, disabled }: { on: boolean; onToggle: () => void; label: string; disabled: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${on ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${on ? "left-4.5" : "left-0.5"}`} />
    </button>
  );
}

function ActivityGrid({ member }: { member: GroupMember }) {
  const cells = useMemo(
    () => Array.from({ length: 91 }, (_, index) => (index * 11 + member.solvedCount + member.streakDays * 3) % 8),
    [member.solvedCount, member.streakDays],
  );
  return (
    <div className="grid grid-cols-13 gap-1" aria-label="Hoạt động 13 tuần gần nhất">
      {cells.map((level, index) => (
        <span
          key={index}
          title={`${level} hoạt động`}
          className={`h-2.5 rounded-[2px] ${level === 0 ? "bg-border-soft" : level < 3 ? "bg-primary/25" : level < 5 ? "bg-primary/55" : "bg-primary"}`}
        />
      ))}
    </div>
  );
}

export function MemberProfileModal({
  member,
  assignments,
  exercises,
  permissions,
  canManage,
  onClose,
  onSaveOverrides,
}: {
  member: GroupMember;
  assignments: Assignment[];
  exercises: GroupExercise[];
  permissions: RolePermissions;
  canManage: boolean;
  onClose: () => void;
  onSaveOverrides: (overrides: Partial<Record<PermissionKey, boolean>>) => void;
}) {
  const [overrides, setOverrides] = useState(member.permissionOverrides ?? {});
  const basePermissions = member.role === "owner"
    ? effectiveMemberPermissions({ ...member, permissionOverrides: {} }, permissions)
    : permissions[member.role];
  const effectivePermissions = { ...basePermissions, ...overrides };
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const submissions = assignments.filter((assignment) => assignment.memberId === member.id);
  const submittedCount = submissions.filter((assignment) => assignment.submissions.length > 0).length;
  const customPermissionCount = Object.keys(overrides).length;

  const togglePermission = (key: PermissionKey) => {
    setOverrides((previous) => {
      const next = !effectivePermissions[key];
      if (next === basePermissions[key]) {
        const rest = { ...previous };
        delete rest[key];
        return rest;
      }
      return { ...previous, [key]: next };
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={`Hồ sơ của ${member.name}`}
      description="Tiến độ, hoạt động, bài đã nộp và quyền áp dụng riêng cho thành viên này."
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>Đóng</Button>
          {canManage && member.role !== "owner" && (
            <Button size="sm" onClick={() => { onSaveOverrides(overrides); onClose(); }}>Lưu quyền riêng</Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-soft bg-bg p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-on-ink">{member.initials}</span>
          <div className="min-w-36 flex-1">
            <div className="font-bold text-navy">{member.name}</div>
            <div className="mt-0.5 text-xs text-text-faint">Tham gia {member.joinedAt} · hoạt động {member.lastActiveMinutesAgo < 60 ? `${member.lastActiveMinutesAgo} phút trước` : "gần đây"}</div>
          </div>
          <Badge tone={member.role === "owner" ? "brown" : "neutral"}>{ROLE_LABEL[member.role]}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "XP", value: member.xp.toLocaleString("vi-VN") },
            { label: "Bài đã làm", value: String(member.solvedCount) },
            { label: "Chuỗi ngày", value: `${member.streakDays} ngày` },
            { label: "Đã nộp", value: `${submittedCount}/${submissions.length}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border-soft p-3 text-center">
              <div className="text-base font-bold text-navy">{stat.value}</div>
              <div className="mt-0.5 text-2xs text-text-faint">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-border-soft p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy"><Flame className="h-4 w-4 text-primary" /> Hoạt động 13 tuần gần nhất</div>
          <ActivityGrid member={member} />
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-border-soft p-4">
            <h3 className="mb-2 text-sm font-bold text-navy">Công nghệ đang học</h3>
            <div className="flex flex-wrap gap-1.5">
              {(member.technologies?.length ? member.technologies : ["Chưa cập nhật"]).map((technology) => (
                <span key={technology} className="rounded-md bg-bg px-2.5 py-1 text-xs font-medium text-navy">{technology}</span>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-border-soft p-4">
            <h3 className="mb-2 text-sm font-bold text-navy">Khóa học đã / đang hoàn thành</h3>
            <div className="space-y-2.5">
              {(member.courses?.length ? member.courses : [{ title: "Chưa cập nhật", progressPercent: 0 }]).map((course) => (
                <div key={course.title}>
                  <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate text-text">{course.title}</span><span className="font-semibold text-primary">{course.progressPercent}%</span></div>
                  <div className="h-1.5 rounded-full bg-border-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {canManage && <section className="rounded-lg border border-border-soft p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-navy"><ShieldCheck className="h-4 w-4 text-primary" /> Quyền riêng của thành viên này</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-faint">Quyền này ghi đè quyền theo vai trò. Hai thành viên cùng vai trò vẫn có thể có quyền khác nhau.</p>
          {customPermissionCount > 0 && <div className="mt-2 text-xs font-semibold text-primary">Đang có {customPermissionCount} quyền được tùy chỉnh</div>}
          <div className="mt-3 divide-y divide-border-soft">
            {PERMISSION_LABELS.map((permission) => {
              const isCustom = overrides[permission.key] !== undefined;
              return (
                <div key={permission.key} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1"><div className="text-sm font-medium text-navy">{permission.label}{isCustom && <span className="ml-2 rounded-sm bg-primary-tint px-1.5 py-0.5 text-2xs font-bold text-primary">Tùy chỉnh</span>}</div><div className="text-xs text-text-faint">{permission.hint}</div></div>
                  <PermissionToggle on={effectivePermissions[permission.key]} onToggle={() => togglePermission(permission.key)} label={permission.label} disabled={!canManage || member.role === "owner"} />
                </div>
              );
            })}
          </div>
        </section>}

        <section className="rounded-lg border border-border-soft p-4">
          <h3 className="mb-3 text-sm font-bold text-navy">Bài đã nộp trong nhóm</h3>
          {submissions.length === 0 ? <p className="text-sm text-text-faint">Chưa có bài tập nào được phân công.</p> : (
            <div className="divide-y divide-border-soft">
              {submissions.map((assignment) => {
                const exercise = exerciseById.get(assignment.exerciseId);
                const latest = assignment.submissions.at(-1);
                return <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><div><div className="text-sm font-medium text-navy">{exercise?.title ?? "Bài tập đã xóa"}</div><div className="text-xs text-text-faint">{latest ? `${latest.result} · ${latest.detail}` : "Chưa nộp bài"}</div></div><span className="text-xs font-semibold text-text-muted">{assignment.submissions.length} lần nộp</span></div>;
              })}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
