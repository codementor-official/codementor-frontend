import type { Problem, TestCase } from "@/data/sample-problem";
import type { ExerciseDetail } from "@/types/catalogue";

const DIFFICULTY_LABEL = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
} as const satisfies Record<ExerciseDetail["difficulty"], Problem["difficulty"]>;

/** Both grading modes reach the judge; it picks by whether `spec` is present. */
function toCase({ input, args, expected }: NonNullable<ExerciseDetail["content"]>["testCases"][number]): TestCase {
  return { input, args, expected };
}

/**
 * Backend exercise → the shape the solve workspace renders and grades.
 *
 * Two fields the workspace shows have no counterpart on the server and stay empty rather
 * than being invented: `tags` and `constraints`. Starter code is different — authors can
 * now save it per language, so the editor opens with the author's skeleton when there is
 * one. Grading secrets are removed by exercise-service before this mapper runs.
 */
export function problemFromExercise(exercise: ExerciseDetail): Problem {
  const content = exercise.content;
  const cases = content?.testCases ?? [];
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

  const starter: Record<string, string> = {};
  for (const language of content?.languages ?? []) {
    if (language.starterCode) starter[language.label] = language.starterCode;
  }

  return {
    slug: exercise.slug,
    title: exercise.title,
    difficulty: DIFFICULTY_LABEL[exercise.difficulty],
    tags: [],
    description: content?.statement ?? "",
    constraints: content?.constraints ?? [],
    // Learner detail contains public cases only. Submit fetches the complete grading
    // snapshot inside submission-service; the browser never receives hidden cases.
    testCases: [...cases].sort(byOrder).map(toCase),
    // Kept as a separate field because the solve UI also supports older mock Problem shapes.
    publicTestCases: [...cases].filter((c) => c.visibility === "public").sort(byOrder).map(toCase),
    starter,
    // Only in function mode: sending a spec is what tells the judge to call a function
    // instead of piping stdin, so it must be absent for stdin/stdout exercises.
    spec:
      content?.ioMode === "function" && content.signature
        ? {
            functionName: content.signature.functionName,
            parameters: content.signature.parameters.map(({ name, type }) => ({ name, type })),
            returnType: content.signature.returnType,
          }
        : undefined,
    languages: content?.languages?.map(({ id, label }) => ({ id, label })),
    xpReward: exercise.xpReward,
    timeLimitMs: exercise.timeLimitMs,
    memoryLimitKb: exercise.memoryLimitKb,
  };
}
