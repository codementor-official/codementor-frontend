"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { problemFromExercise } from "@/lib/exercise/problem-from-exercise";
import type { Problem } from "@/data/sample-problem";
import { SolveWorkspace, type LessonContext } from "./solve-workspace";

/**
 * Loads the exercise client-side, for the same reason the browse pages do: the access
 * token lives in an encrypted cookie the server component cannot read without the BFF, and
 * `/api/backend/*` already attaches it.
 */
export function SolveLoader({
  exerciseId,
  backHref,
  context,
}: {
  exerciseId: string;
  backHref: string;
  /** Khóa học và bài học mà bài code này được mở từ đó; vắng = luyện tập tự do. */
  context?: LessonContext;
}) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.exercises
      .detail(exerciseId)
      .then((exercise) => {
        if (!cancelled) setProblem(problemFromExercise(exercise));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Không tải được bài tập");
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm font-semibold text-navy">Không mở được bài tập này</p>
        <p className="max-w-md text-xs text-text-muted">{error}</p>
        <Link href={backHref} className="text-xs font-semibold text-primary hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài tập...
      </div>
    );
  }

  return <SolveWorkspace problem={problem} backHref={backHref} context={context} />;
}
