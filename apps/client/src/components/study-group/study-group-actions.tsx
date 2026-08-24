"use client";

import { useState } from "react";
import { KeyRound, Plus, X } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@codementor/ui";

type Panel = "join" | "create";

export function StudyGroupActions({
  onJoin,
  onCreate,
}: {
  onJoin: (code: string) => Promise<void>;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (next: Panel) => {
    setError(null);
    setPanel((current) => (current === next ? null : next));
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draftName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(draftName, draftDescription);
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
    if (!joinCode.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onJoin(joinCode);
      setJoinCode("");
      setPanel(null);
    } catch (cause) {
      setError(messageOf(cause, "Không thể tham gia nhóm. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
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

      {panel === "join" && (
        <Card className="mt-3 p-4">
          <form onSubmit={submitJoin}>
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
                id="join-code"
                autoFocus
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(event.target.value);
                  setError(null);
                }}
                icon={<KeyRound />}
                placeholder="Nhập mã mời..."
                containerClassName="min-w-48 flex-1"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "join-code-error" : undefined}
              />
              <Button type="submit" variant="outline" disabled={submitting}>
                Tham gia
              </Button>
            </div>
            {error && (
              <p
                id="join-code-error"
                role="alert"
                className="mt-2 text-xs font-medium text-primary"
              >
                {error}
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
                <label
                  htmlFor="group-name"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Tên nhóm
                </label>
                <Input
                  id="group-name"
                  autoFocus
                  required
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="vd: Nhóm ôn thi cuối kỳ"
                />
              </div>
              <div>
                <label
                  htmlFor="group-desc"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Mô tả
                </label>
                <Input
                  id="group-desc"
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  placeholder="Nhóm này sẽ tập trung vào nội dung gì?"
                />
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
