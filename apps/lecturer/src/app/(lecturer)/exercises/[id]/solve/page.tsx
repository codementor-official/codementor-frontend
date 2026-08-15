"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@codementor/ui";
import { SolvePreview } from "@/features/exercises/solve-preview";
import type { Exercise } from "@/features/exercises/types";
import { api } from "@/lib/api";
import { useResolvedTheme } from "@/lib/use-resolved-theme";

export default function SolvePage() {
  const { id } = useParams<{ id: string }>();
  const theme = useResolvedTheme();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.exercises
      .get(id)
      .then((loaded) => {
        if (!cancelled) setExercise(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Không tải được bài");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <PageHeader title="Giải thử" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!exercise) {
    return <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">Đang tải…</p>;
  }

  return <SolvePreview exercise={exercise} theme={theme} />;
}
