"use client";

import { useState } from "react";
import { Info, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PERMISSION_LABELS } from "@/lib/study-group/group-detail-meta";
import { ROLE_LABEL } from "@/lib/study-group/study-group-stats";
import type { StudyGroup } from "@/types/study-group";
import type {
  ConfigurableRole,
  GroupMember,
  PermissionKey,
  RolePermissions,
} from "@/types/study-group-detail";

const SECTIONS = [
  { id: "general", label: "Tổng quan", icon: Info },
  { id: "members", label: "Thành viên", icon: Users },
  { id: "danger", label: "Vùng nguy hiểm", icon: ShieldAlert },
] as const;

const CONFIGURABLE_ROLES: ConfigurableRole[] = ["deputy", "member"];

function SectionHeading({ id, title, hint }: { id: string; title: string; hint: string }) {
  return (
    <div id={id} className="scroll-mt-4">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <p className="mt-0.5 mb-3 text-xs text-text-faint">{hint}</p>
    </div>
  );
}

function PermissionToggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${on ? "left-4.5" : "left-0.5"}`}
      />
    </button>
  );
}

export function SettingsTab({
  group,
  members,
  permissions: initialPermissions,
}: {
  group: StudyGroup;
  members: GroupMember[];
  permissions: RolePermissions;
}) {
  const [permissions, setPermissions] = useState(initialPermissions);
  // Compared against the last saved snapshot, not the mount value, so saving clears
  // the dirty state and toggling back to the original clears it too.
  const [savedPermissions, setSavedPermissions] = useState(initialPermissions);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [topic, setTopic] = useState(group.topic);
  const [transferTo, setTransferTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const togglePermission = (role: ConfigurableRole, key: PermissionKey) =>
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }));

  const permissionsDirty = CONFIGURABLE_ROLES.some((role) =>
    PERMISSION_LABELS.some((p) => permissions[role][p.key] !== savedPermissions[role][p.key]),
  );

  const transferCandidates = members.filter((m) => m.role !== "owner");

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Table of contents — this is one page, the rail just jumps within it. */}
      <nav aria-label="Mục cài đặt" className="lg:sticky lg:top-4 lg:w-52 lg:shrink-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-text-muted hover:bg-bg hover:text-navy"
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Card className="p-5">
          <SectionHeading
            id="general"
            title="Thông tin chung"
            hint="Tên, mô tả và ảnh đại diện hiển thị cho mọi thành viên."
          />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-xl font-bold text-on-ink">
                {group.tile}
              </span>
              <div>
                <Button size="sm" variant="outline">
                  Đổi ảnh đại diện
                </Button>
                <p className="mt-1.5 text-xs text-text-faint">PNG hoặc JPG, tối thiểu 128×128.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="group-name" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Tên nhóm
                </label>
                <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="group-topic" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Chủ đề đang học
                </label>
                <Input id="group-topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
            </div>

            <div>
              <label htmlFor="group-description" className="mb-1.5 block text-xs font-medium text-text-muted">
                Mô tả nhóm
              </label>
              <textarea
                id="group-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-faint focus:border-navy"
              />
            </div>

            <div>
              <Button size="sm">Lưu thay đổi</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading
            id="members"
            title="Phân quyền theo vai trò"
            hint="Chủ nhóm luôn có toàn quyền. Bật/tắt quyền cho Phó nhóm và Thành viên tại đây."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-lg border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left text-2xs font-bold tracking-wide text-text-faint uppercase">
                    Quyền hạn
                  </th>
                  {CONFIGURABLE_ROLES.map((role) => (
                    <th
                      key={role}
                      className="w-28 py-2 text-center text-2xs font-bold tracking-wide text-text-faint uppercase"
                    >
                      {ROLE_LABEL[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_LABELS.map((perm) => (
                  <tr key={perm.key} className="border-t border-border-soft">
                    <td className="py-2.5 pr-4">
                      <div className="text-sm font-medium text-navy">{perm.label}</div>
                      <div className="text-xs text-text-faint">{perm.hint}</div>
                    </td>
                    {CONFIGURABLE_ROLES.map((role) => (
                      <td key={role} className="py-2.5 text-center">
                        <div className="flex justify-center">
                          <PermissionToggle
                            on={permissions[role][perm.key]}
                            onToggle={() => togglePermission(role, perm.key)}
                            label={`${perm.label} cho ${ROLE_LABEL[role]}`}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {permissionsDirty && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-soft pt-4">
              <span className="mr-auto text-xs text-text-muted">
                Có thay đổi chưa lưu trong bảng phân quyền.
              </span>
              <Button size="sm" variant="outline" onClick={() => setPermissions(savedPermissions)}>
                Hoàn tác
              </Button>
              <Button size="sm" onClick={() => setSavedPermissions(permissions)}>
                Lưu phân quyền
              </Button>
            </div>
          )}
        </Card>

        <Card className="border-primary p-5">
          <SectionHeading
            id="danger"
            title="Vùng nguy hiểm"
            hint="Những thao tác dưới đây không thể hoàn tác."
          />
          <div className="flex flex-col divide-y divide-border-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy">Chuyển quyền sở hữu</div>
                <p className="text-xs text-text-faint">
                  Bạn sẽ trở thành Phó nhóm sau khi chuyển quyền cho người khác.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  label="Chọn thành viên nhận quyền"
                  shape="box"
                  value={transferTo}
                  onChange={setTransferTo}
                  options={[
                    { value: "", label: "Chọn thành viên..." },
                    ...transferCandidates.map((m) => ({ value: m.id, label: m.name })),
                  ]}
                />
                <Button size="sm" variant="outline" disabled={!transferTo}>
                  Chuyển quyền
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy">Xóa nhóm học tập</div>
                <p className="text-xs text-text-faint">
                  Toàn bộ tài liệu, bài tập và tiến độ của {members.length} thành viên sẽ bị xóa.
                </p>
              </div>
              <Button size="sm" onClick={() => setConfirmDelete(true)}>
                Xóa nhóm
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteInput("");
        }}
        title="Xóa nhóm học tập?"
        description="Thao tác này không thể hoàn tác."
        width="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                setDeleteInput("");
              }}
            >
              Hủy
            </Button>
            <Button size="sm" disabled={deleteInput !== group.name}>
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text">
          Nhập <span className="font-semibold text-navy">{group.name}</span> để xác nhận.
        </p>
        <Input
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder="Nhập tên nhóm..."
          aria-label="Xác nhận tên nhóm"
        />
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="primary">Cảnh báo</Badge>
          <span className="text-xs text-text-muted">
            {members.length} thành viên sẽ mất quyền truy cập ngay lập tức.
          </span>
        </div>
      </Modal>
    </div>
  );
}
