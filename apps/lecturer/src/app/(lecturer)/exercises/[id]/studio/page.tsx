"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Group, Panel } from "react-resizable-panels";
import { Button, PageHeader, ResizeHandle, StatusBadge, useResolvedTheme, useToast } from "@codementor/ui";
import { DangerZone } from "@/components/page/danger-zone";
import { StudioShell } from "@/components/page/studio-shell";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import {
  ExerciseBriefForm,
  ExerciseCodeForm,
  type ExerciseDraft,
} from "@/features/exercises/code-problem-form";
import {
  STATUS_LABELS,
  STATUS_TONES,
  type Exercise,
  type ExerciseStatus,
} from "@codementor/solve";
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

  const toast = useToast();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [draft, setDraft] = useState<ExerciseDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const theme = useResolvedTheme();

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
    try {
      const updated = await action();
      setExercise(updated);
      setDraft(toDraft(updated));
      toast.success(done);
    } catch (cause) {
      // Lỗi của một thao tác đi bằng toast; `error` chỉ còn giữ lỗi tải trang, thứ khiến
      // màn hình không vẽ được gì.
      toast.error(describe(cause));
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

  // Trước early return: hook phải chạy ở mọi lần render.
  const unsavedDialog = useUnsavedGuard(
    Boolean(exercise && draft) && JSON.stringify(draft) !== JSON.stringify(toDraft(exercise as Exercise)),
  );

  if (error && !exercise) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <PageHeader title="Studio bài code" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!exercise || !draft) {
    return <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">Đang tải…</p>;
  }

  const locked = exercise.status === "pending_review";

  return (
    <>
    {unsavedDialog}
    <StudioShell
      actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"
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
      backHref="/exercises"
      backLabel="Bài code"
      meta={`${exercise.timeLimitMs} ms · ${Math.round(exercise.memoryLimitKb / 1024)} MB${
        locked ? " · đang chờ duyệt nên không sửa được" : ""
      }`}
      rejectionReason={exercise.rejectionReason}
      slug={exercise.slug}
      status={
        <StatusBadge tone={STATUS_TONES[exercise.status as ExerciseStatus]}>
          {STATUS_LABELS[exercise.status as ExerciseStatus]}
        </StatusBadge>
      }
      title={draft.title || "Bài tập chưa đặt tên"}
    >
      {/* Bên trái là bài đọc ra sao, bên phải là bài chạy và chấm ra sao. Hai nửa dài
          gần bằng nhau và người soạn đi lại giữa chúng liên tục, nên chúng là hai pane
          cuộn độc lập chứ không phải một cột dài. */}
      <Group orientation="horizontal" className="h-full">
        <Panel id="brief" defaultSize="50%" minSize="25%" className="min-h-0">
          <div className="h-full overflow-y-auto p-3">
            <ExerciseBriefForm
              onChange={setDraft}
              readOnly={locked}
              slugLocked={exercise.status === "published"}
              value={draft}
            />

            <div className="mt-4">
              <DangerZone
                actionLabel="Xoá bài này"
                confirmDescription={`Bài “${draft.title || exercise.slug}” sẽ bị xoá cùng đề bài, test case và lời giải mẫu. Khóa học nào đang gắn bài này sẽ mất ô bài code đó. Không hoàn tác được.`}
                confirmTitle="Xoá bài code này?"
                description="Xoá bài code này cùng đề bài, test case và lời giải mẫu. Khóa học nào đang gắn bài này sẽ mất ô bài code đó. Không hoàn tác được."
                disabled={saving}
                onConfirm={() =>
                  run(async () => {
                    await api.exercises.remove(id);
                    router.push("/exercises");
                    return exercise;
                  }, "Đã xoá")
                }
                title="Xoá bài code"
              />
            </div>
          </div>
        </Panel>

        <ResizeHandle orientation="horizontal" />

        <Panel id="code" defaultSize="50%" minSize="25%" className="min-h-0">
          <div className="h-full overflow-y-auto p-3">
            <ExerciseCodeForm
              onChange={setDraft}
              readOnly={locked}
              theme={theme}
              value={draft}
            />
          </div>
        </Panel>
      </Group>
    </StudioShell>
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
