/** Languages a problem can be authored for. `monaco` is the id Monaco knows it by. */
export interface ProblemLanguage {
  id: string;
  label: string;
  monaco: string;
}

export interface ProblemExample {
  id: string;
  input: string;
  output: string;
}

export interface ProblemTestCase {
  id: string;
  input: string;
  expected: string;
  visibility: "public" | "hidden";
  /** Set once the reference solution has produced `expected`, so authors can tell a
   * generated output from one they typed by hand. */
  generated: boolean;
}

export interface TheoryLessonDraft {
  title: string;
  chapter: string;
  /** Estimated reading/watching time, in minutes. */
  durationMinutes: number;
  summary: string;
  /** The "Sau bài này bạn có thể" checklist shown above the content. */
  objectives: string[];
  /** Rich-text body as HTML — what the Tiptap editor produces. */
  content: string;
}

/** Starter and reference code are per language — both keyed by `ProblemLanguage.id`. */
export interface CodeProblemDraft {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  statement: string;
  examples: ProblemExample[];
  constraints: string[];
  languageIds: string[];
  starter: Record<string, string>;
  solution: Record<string, string>;
  testCases: ProblemTestCase[];
}
