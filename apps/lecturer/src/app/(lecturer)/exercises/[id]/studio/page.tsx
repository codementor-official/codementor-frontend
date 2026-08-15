"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Button, PageHeader, StatusBadge } from "@codementor/ui";
import { CodeProblemForm, type ExerciseDraft } from "@/features/exercises/code-problem-form";
import {
  STATUS_LABELS,
  STATUS_TONES,
  type Exercise,
  type ExerciseStatus,
} from "@/features/exercises/types";
import { api } from "@/lib/api";

function toDraft(exercise: Exercise): ExerciseDraft {
  return {
    slug: exercise.slug,
    title: exercise.title,
    summary: exercise.summary ?? "",
    difficulty: exercise.difficulty,
    // Form làm việc bằng chuỗi để ô nhập rỗng được; đổi sang số lúc gửi đi.
    estimatedMinutes: exercise.estimatedMinutes?.toString() ?? "",
    timeLimitMs: exercise.timeLimitMs.toString(),
    memoryLimitKb: exercise.memoryLimitKb.toString(),
    content: exercise.content ?? {},
  };
}

function numberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ExerciseStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [draft, setDraft] = useState<ExerciseDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Cờ hủy: rời trang trước khi request về thì response cũ không được ghi đè state
    // của màn hình kế tiếp.
    let cancelled = false;
    api.exercises
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        setExercise(loaded);
        setDraft(toDraft(loaded));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const run = async (action: () => Promise<Exercise>, done: string) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await action();
      setExercise(updated);
      setDraft(toDraft(updated));
      setNotice(done);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Metadata ở PostgreSQL, thân bài ở MongoDB — hai lệnh ghi, theo thứ tự metadata
   * trước. Ngược lại thì một tiêu đề sai kiểu sẽ chặn luôn cả phần nội dung vừa soạn.
   */
  const save = () =>
    draft &&
    exercise &&
    run(async () => {
      await api.exercises.update(id, {
        // Chỉ gửi khi thực sự đổi: backend từ chối đổi slug của bài đã công khai.
        ...(draft.slug !== exercise.slug ? { slug: draft.slug } : {}),
        title: draft.title,
        summary: draft.summary || null,
        difficulty: draft.difficulty,
        estimatedMinutes: numberOrNull(draft.estimatedMinutes),
        timeLimitMs: numberOrNull(draft.timeLimitMs) ?? 1000,
        memoryLimitKb: numberOrNull(draft.memoryLimitKb) ?? 262144,
      });
      return api.exercises.saveContent(id, draft.content);
    }, "Đã lưu");

  if (error && !exercise) {
    return (
      <>
        <PageHeader title="Studio bài code" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </>
    );
  }

  if (!exercise || !draft) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  const locked = exercise.status === "pending_review";

  return (
    <>
      <Link
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        href="/exercises"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Bài code
      </Link>

      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium"
              href={`/exercises/${id}/solve`}
            >
              <Play aria-hidden="true" className="size-4" />
              Giải thử
            </Link>
            {locked ? (
              <Button
                disabled={saving}
                onClick={() => run(() => api.exercises.withdraw(id), "Đã hủy gửi duyệt")}
                type="button"
                variant="outline"
              >
                <Undo2 aria-hidden="true" className="size-4" />
                Hủy gửi duyệt
              </Button>
            ) : (
              <>
                <Button disabled={saving} onClick={() => void save()} type="button" variant="outline">
                  <Save aria-hidden="true" className="size-4" />
                  {saving ? "Đang lưu…" : "Lưu"}
                </Button>
                <Button
                  disabled={saving}
                  onClick={() => run(() => api.exercises.submit(id), "Đã gửi duyệt")}
                  type="button"
                >
                  <Send aria-hidden="true" className="size-4" />
                  Gửi duyệt
                </Button>
              </>
            )}
          </div>
        }
        description={exercise.slug}
        title={draft.title || "Bài tập chưa đặt tên"}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge tone={STATUS_TONES[exercise.status as ExerciseStatus]}>
          {STATUS_LABELS[exercise.status as ExerciseStatus]}
        </StatusBadge>
        {locked && (
          <span className="text-sm text-muted-foreground">
            Đang chờ duyệt nên không sửa được. Hủy gửi duyệt để sửa tiếp.
          </span>
        )}
      </div>

      {exercise.rejectionReason && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Lý do bị trả về: {exercise.rejectionReason}
        </p>
      )}

      {error && (
        <p
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {notice && (
        <p className="mb-4 text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}

      <CodeProblemForm
        onChange={setDraft}
        readOnly={locked}
        slugLocked={exercise.status === "published"}
        value={draft}
      />

      <div className="mt-6 flex justify-end">
        <Button
          disabled={saving}
          onClick={() =>
            run(async () => {
              await api.exercises.remove(id);
              router.push("/exercises");
              return exercise;
            }, "Đã xoá")
          }
          type="button"
          variant="ghost"
        >
          Xoá bài này
        </Button>
      </div>
    </>
  );
}

/** Thông điệp của backend nói rõ thiếu gì khi gửi duyệt; đừng thay bằng câu chung chung. */
function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
