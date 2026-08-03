"use client";

import { useState } from "react";
import { KeyRound, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Panel = "join" | "create";

/**
 * Collapsed to two buttons by default — the page is for managing groups, so the
 * join/create forms only take up space once you ask for them. One panel at a time.
 */
export function StudyGroupActions({
  leading,
  onJoin,
  onCreate,
  joinError,
  onClearJoinError,
}: {
  /** Sits opposite the buttons on the same row — used for the page's one-line summary. */
  leading?: React.ReactNode;
  /** Returns nothing on success (the caller navigates); the error surfaces via `joinError`. */
  onJoin: (code: string) => void;
  onCreate: (name: string, description: string) => void;
  joinError: string | null;
  onClearJoinError: () => void;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const toggle = (next: Panel) => {
    onClearJoinError();
    setPanel((cur) => (cur === next ? null : next));
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    onCreate(draftName, draftDescription);
    setDraftName("");
    setDraftDescription("");
    setPanel(null);
  };

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {leading}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => toggle("create")} aria-expanded={panel === "create"}>
            {panel === "create" ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            Tạo nhóm học tập
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toggle("join")}
            aria-expanded={panel === "join"}
          >
            {panel === "join" ? <X className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
            Tham gia bằng mã mời
          </Button>
        </div>
      </div>

      {panel === "join" && (
        <Card className="mt-3 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoin(joinCode);
            }}
          >
            <label htmlFor="join-code" className="mb-1.5 block text-sm font-semibold text-navy">
              Tham gia bằng mã mời
            </label>
            <p className="mb-2.5 text-xs text-text-faint">
              Nhập mã nhóm bạn được chia sẻ, ví dụ{" "}
              <span className="font-mono text-text-muted">NMLT-BASIC</span>.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <Input
                id="join-code"
                autoFocus
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  onClearJoinError();
                }}
                icon={<KeyRound />}
                placeholder="Nhập mã hoặc dán liên kết mời..."
                containerClassName="min-w-48 flex-1"
                aria-invalid={joinError ? true : undefined}
                aria-describedby={joinError ? "join-code-error" : undefined}
              />
              <Button type="submit" variant="outline">
                Tham gia
              </Button>
            </div>
            {joinError && (
              <p id="join-code-error" role="alert" className="mt-2 text-xs font-medium text-primary">
                {joinError}
              </p>
            )}
          </form>
        </Card>
      )}

      {panel === "create" && (
        <Card className="mt-3 p-4">
          <form onSubmit={submitCreate}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="group-name" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Tên nhóm
                </label>
                <Input
                  id="group-name"
                  autoFocus
                  required
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="vd: Nhóm ôn thi cuối kỳ"
                />
              </div>
              <div>
                <label htmlFor="group-desc" className="mb-1.5 block text-xs font-medium text-text-muted">
                  Mô tả
                </label>
                <Input
                  id="group-desc"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Nhóm này sẽ tập trung vào nội dung gì?"
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="mt-3">
              Tạo nhóm
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
