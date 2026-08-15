"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { StudyGroupRole } from "@/types/study-group";

/** Two ways in: share the link/code, or invite by username. Both in one dialog. */
export function InviteMemberModal({
  open,
  onClose,
  groupCode,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  groupCode: string;
  onInvite: (identifier: string, role: StudyGroupRole) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<StudyGroupRole>("member");
  const [copied, setCopied] = useState(false);

  const inviteLink = `codementor.app/join/${groupCode.toLowerCase()}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, insecure context) — the link is
      // visible and selectable either way, so a failed copy is not an error state.
      setCopied(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    onInvite(identifier.trim(), role);
    setIdentifier("");
    setRole("member");
  };

  return (
    <Modal open={open} onClose={onClose} title="Mời thành viên" description={`Nhóm ${groupCode}`}>
      <section className="mb-5">
        <h3 className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
          Chia sẻ liên kết mời
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-48 flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 font-mono text-xs text-navy">
            {inviteLink}
          </code>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã sao chép" : "Sao chép"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-text-faint">
          Ai có liên kết này đều có thể xin tham gia nhóm.
        </p>
      </section>

      <form onSubmit={submit} className="border-t border-border-soft pt-4">
        <h3 className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
          Mời trực tiếp
        </h3>
        <div className="flex flex-wrap items-start gap-2">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<Mail />}
            placeholder="Tên đăng nhập hoặc email..."
            containerClassName="min-w-48 flex-1"
            aria-label="Tên đăng nhập hoặc email"
          />
          <Select
            label="Vai trò"
            shape="box"
            value={role}
            onChange={(v) => setRole(v as StudyGroupRole)}
            className="h-10"
            options={[
              { value: "member", label: "Thành viên" },
              { value: "deputy", label: "Phó nhóm" },
            ]}
          />
          <Button type="submit" size="md" disabled={!identifier.trim()}>
            Gửi lời mời
          </Button>
        </div>
      </form>
    </Modal>
  );
}
