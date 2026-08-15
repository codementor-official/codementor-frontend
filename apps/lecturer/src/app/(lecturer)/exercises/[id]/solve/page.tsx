"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Button, SegmentedTabs, StatusBadge } from "@codementor/ui";
import { CodeEditor } from "@codementor/editor";
import { PageHeader } from "@/components/page/page-header";
import {
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type Exercise,
  type ExerciseStatus,
} from "@/features/exercises/types";
import { api } from "@/lib/api";

/**
 * Xem bài dưới góc nhìn học viên: đề bài bên trái, trình soạn code bên phải, chỉ hiện
 * test case công khai.
 *
 * Chưa chấm được — chạy code cần sandbox của judge-service (Phase 5b). Trang này để
 * giảng viên đọc lại bài mình vừa soạn đúng như học viên sẽ thấy, nên nút "Chạy thử"
 * cố tình chưa có: một nút bấm không làm gì còn tệ hơn không có nút.
 */
export default function SolvePage() {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string>("");
  const [code, setCode] = useState("");

  useEffect(() => {
    api
      .exercises.get(id)
      .then((loaded) => {
        setExercise(loaded);
        const first = loaded.content?.languages?.[0];
        if (first) {
          setLanguageId(first.id);
          setCode(first.starterCode ?? "");
        }
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Không tải được bài"),
      );
  }, [id]);

  const languages = exercise?.content?.languages ?? [];
  const language = languages.find((item) => item.id === languageId);
  const publicCases = useMemo(
    () => (exercise?.content?.testCases ?? []).filter((item) => item.visibility === "public"),
    [exercise],
  );

  if (error) {
    return (
      <>
        <PageHeader title="Giải thử" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </>
    );
  }

  if (!exercise) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

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
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium"
            href={`/exercises/${id}/studio`}
          >
            Mở studio
          </Link>
        }
        description={`${DIFFICULTY_LABELS[exercise.difficulty]} · ${exercise.timeLimitMs} ms · ${Math.round(exercise.memoryLimitKb / 1024)} MB`}
        title={exercise.title}
      />

      <div className="mb-4">
        <StatusBadge tone={STATUS_TONES[exercise.status as ExerciseStatus]}>
          {STATUS_LABELS[exercise.status as ExerciseStatus]}
        </StatusBadge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Đề bài</h2>
          <div className="prose prose-sm max-w-none text-sm">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {exercise.content?.statement || "_Bài này chưa có đề._"}
            </ReactMarkdown>
          </div>

          <h3 className="mt-6 mb-2 text-sm font-semibold">Ví dụ</h3>
          {publicCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có test case công khai nào.</p>
          ) : (
            publicCases.map((testCase) => (
              <div className="mb-2 rounded-lg border p-3 font-mono text-xs" key={testCase.order}>
                <p className="text-muted-foreground">Đầu vào</p>
                <pre className="mt-1 whitespace-pre-wrap">{testCase.input || "(rỗng)"}</pre>
                <p className="mt-2 text-muted-foreground">Đầu ra</p>
                <pre className="mt-1 whitespace-pre-wrap">{testCase.expected || "(rỗng)"}</pre>
              </div>
            ))
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Bài làm</h2>
            {languages.length > 0 && (
              <SegmentedTabs
                onChange={(value) => {
                  setLanguageId(value);
                  setCode(languages.find((item) => item.id === value)?.starterCode ?? "");
                }}
                options={languages.map((item) => ({ value: item.id, label: item.label }))}
                value={languageId}
              />
            )}
          </div>

          {language ? (
            <>
              <CodeEditor
                height={420}
                language={language.monaco ?? language.id}
                onChange={setCode}
                value={code}
              />
              <div className="mt-3 flex items-center gap-3">
                <Button disabled title="Cần sandbox của judge-service — Phase 5b" type="button">
                  Chấm bài
                </Button>
                <span className="text-sm text-muted-foreground">
                  Chưa chấm được: judge-service chưa có sandbox chạy code.
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bài này chưa khai báo ngôn ngữ nào.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
