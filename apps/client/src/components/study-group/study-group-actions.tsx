"use client";

import { useState } from "react";
import { KeyRound, Plus, X } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CharCount, FieldError, fieldA11y, Input, useFieldErrors } from "@codementor/ui";
import { length } from "@codementor/utils";

type Panel = "join" | "create";

export function StudyGroupActions({
  onJoin,
  onCreate,
  leading,
}: {
  onJoin: (code: string) => Promise<void>;
  onCreate: (name: string, description: string) => Promise<void>;
  /** Nằm cùng hàng, bên trái hai nút (bộ lọc phạm vi). Panel vẫn mở ngay dưới hàng này. */
  leading?: React.ReactNode;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // `JoinWorkspaceDto.inviteCode` ≤ 32; `CreateWorkspaceDto` tên 1–120, mô tả ≤ 2000.
  const joinForm = useFieldErrors({ joinCode }, { joinCode: length(joinCode, "Mã mời", { min: 1, max: 32 }) });
  const createForm = useFieldErrors(
    { draftName, draftDescription },
    {
      draftName: length(draftName, "Tên nhóm", { min: 1, max: 120 }),
      draftDescription: length(draftDescription, "Mô tả", { max: 2000 }),
    },
  );

  const toggle = (next: Panel) => {
    setError(null);
    joinForm.reset();
    createForm.reset();
    setPanel((current) => (current === next ? null : next));
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(draftName.trim(), draftDescription.trim());
      setDraftName("");
      setDraftDescription("");
      setPanel(null);
    } catch (cause) {
      setError(messageOf(cause, "Không thể tạo nhóm. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joinForm.validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onJoin(joinCode.trim());
      setJoinCode("");
      setPanel(null);
    } catch (cause) {
      setError(messageOf(cause, "Không thể tham gia nhóm. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {leading}
        <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => toggle("create")}
          aria-expanded={panel === "create"}
        >
          {panel === "create" ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Tạo nhóm học tập
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => toggle("join")}
          aria-expanded={panel === "join"}
        >
          {panel === "join" ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          Tham gia bằng mã mời
        </Button>
        </div>
      </div>

      {panel === "join" && (
        <Card className="mt-3 p-4">
          <form noValidate onSubmit={submitJoin}>
            <label
              htmlFor="join-code"
              className="mb-1.5 block text-sm font-semibold text-navy"
            >
              Tham gia bằng mã mời
            </label>
            <p className="mb-2.5 text-xs text-text-faint">
              Nhập mã nhóm được Chủ nhóm chia sẻ.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <Input
                {...fieldA11y("join-code", joinForm.errors.joinCode)}
                autoFocus
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(event.target.value);
                  setError(null);
                }}
                icon={<KeyRound />}
                placeholder="Nhập mã mời..."
                containerClassName="min-w-48 flex-1"
              />
              <Button type="submit" variant="outline" disabled={submitting}>
                Tham gia
              </Button>
            </div>
            <FieldError className="mt-2" error={joinForm.errors.joinCode} htmlFor="join-code" />
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-primary">
                {error}
              </p>
            )}
          </form>
        </Card>
      )}

      {panel === "create" && (
        <Card className="mt-3 p-4">
          <form noValidate onSubmit={submitCreate}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="group-name"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Tên nhóm
                </label>
                <Input
                  {...fieldA11y("group-name", createForm.errors.draftName)}
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="vd: Nhóm ôn thi cuối kỳ"
                />
                <FieldError className="mt-1.5" error={createForm.errors.draftName} htmlFor="group-name" />
              </div>
              <div>
                <label
                  htmlFor="group-desc"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Mô tả
                </label>
                <textarea
                  {...fieldA11y("group-desc", createForm.errors.draftDescription)}
                  className="min-h-20 w-full resize-y rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground"
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  placeholder="Nhóm này sẽ tập trung vào nội dung gì?"
                  rows={3}
                />
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <FieldError error={createForm.errors.draftDescription} htmlFor="group-desc" />
                  <span className="ml-auto"><CharCount value={draftDescription} max={2000} /></span>
                </div>
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-primary">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="sm"
              className="mt-3"
              disabled={submitting}
            >
              Tạo nhóm
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError ? cause.message : fallback;
}
