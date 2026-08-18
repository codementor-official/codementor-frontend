"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useResolvedTheme } from "@codementor/ui";
import { SolvePreview, type Exercise } from "@codementor/solve";
import { useAdminApi } from "@/features/auth/admin-api";
import { ModerationActions } from "@/features/moderation/moderation-actions";
import { describeError } from "@/features/moderation/use-moderation";
import { moderationApi } from "@/lib/api";

/**
 * Bài code như học viên gặp nó, cộng bộ nút quyết định.
 *
 * Dùng chính màn hình `@codementor/solve` mà giảng viên xem thử: admin phải chạy được đề
 * qua judge trước khi từ chối, và "đề này không chạy" chỉ chứng minh được bằng cách chạy.
 * Hai bên nhìn hai màn hình khác nhau thì mọi tranh cãi về một lần từ chối là vô nghĩa.
 */
export function ExerciseReview({ id }: { id: string }) {
  const request = useAdminApi();
  const router = useRouter();
  const theme = useResolvedTheme();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    moderationApi
      .exercise(request, id)
      .then((loaded) => {
        if (!cancelled) setExercise(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, request]);

  if (error) {
    return (
      <p className="m-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!exercise) return <p className="p-4 text-sm text-muted-foreground">Đang tải…</p>;

  return (
    <SolvePreview
      actions={
        <ModerationActions
          id={exercise.id}
          kind="exercises"
          layout="compact"
          onDone={() => router.push("/moderation/exercises")}
          status={exercise.status}
          title={exercise.title}
        />
      }
      back={{ href: "/moderation/exercises", label: "Bài code" }}
      exercise={exercise}
      run={(body) => moderationApi.judgeRun(request, body)}
      theme={theme}
    />
  );
}
