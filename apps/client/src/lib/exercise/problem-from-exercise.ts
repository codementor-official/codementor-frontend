import type { Problem } from "@/data/sample-problem";
import type { ExerciseDetail } from "@/types/catalogue";

const DIFFICULTY_LABEL = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
} as const satisfies Record<ExerciseDetail["difficulty"], Problem["difficulty"]>;

/**
 * Backend exercise → the shape the solve workspace renders.
 *
 * Three fields the workspace expects have no counterpart on the server, and are left empty
 * rather than filled in:
 *
 * - `tags` and `constraints` — the exercise service stores neither. Inventing them would
 *   put words on screen that no author wrote.
 * - `starter` — the only per-language code the server holds is `referenceSolution`, which
 *   is the *answer*. Seeding the editor with it would hand every learner the solution.
 *   Until authors can save real starter code, the editor opens empty.
 */
export function problemFromExercise(exercise: ExerciseDetail): Problem {
  const cases = exercise.content?.testCases ?? [];
  return {
    slug: exercise.slug,
    title: exercise.title,
    difficulty: DIFFICULTY_LABEL[exercise.difficulty],
    tags: [],
    description: exercise.content?.statement ?? "",
    constraints: [],
    // Ordered by the author's `order`, not by array position — the two agree today and
    // there is no reason to depend on that. Every case goes to the judge, or a "passed"
    // verdict would mean nothing.
    testCases: [...cases]
      .sort((a, b) => a.order - b.order)
      .map(({ input, expected }) => ({ input, expected })),
    // Only the public ones are rendered. They travel to the browser either way — the judge
    // takes its cases from the client — so this hides them from the page, not from anyone
    // reading the network tab. Real secrecy needs grading to move server-side.
    publicTestCases: [...cases]
      .filter((c) => c.visibility === "public")
      .sort((a, b) => a.order - b.order)
      .map(({ input, expected }) => ({ input, expected })),
    starter: {},
  };
}
