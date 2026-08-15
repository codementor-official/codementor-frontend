"use client";

import { Modal } from "@/components/ui/modal";
import type { GroupMember } from "@/types/study-group-detail";

export function MemberAchievementsModal({
  member,
  onClose,
}: {
  member: GroupMember | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={member !== null}
      onClose={onClose}
      title={member ? `Thành tích của ${member.name}` : ""}
      description="Số liệu tổng hợp trên toàn bộ nền tảng, không chỉ trong nhóm này."
    >
      {member && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "XP", value: member.xp.toLocaleString("vi-VN") },
              { label: "Bài đã làm", value: String(member.solvedCount) },
              { label: "Chuỗi ngày", value: `${member.streakDays}` },
            ].map((s) => (
              <div key={s.label} className="rounded-md bg-bg p-3 text-center">
                <div className="text-lg font-bold text-navy">{s.value}</div>
                <div className="text-2xs text-text-faint">{s.label}</div>
              </div>
            ))}
          </div>
          <dl className="flex flex-col divide-y divide-border-soft">
            {member.achievements.map((a) => (
              <div key={a.label} className="flex items-start justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <dt className="text-sm font-medium text-navy">{a.label}</dt>
                  <dd className="text-xs text-text-faint">{a.hint}</dd>
                </div>
                <span className="shrink-0 text-sm font-bold text-navy">{a.value}</span>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Modal>
  );
}
