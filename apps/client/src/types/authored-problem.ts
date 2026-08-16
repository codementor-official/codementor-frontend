/** Which tab of `/create-problem` produced this item. */
export type AuthoredKind = "code" | "theory";

export type AuthoredStatus = "draft" | "published";

interface AuthoredBase {
  id: string;
  title: string;
  status: AuthoredStatus;
  updatedAt: string;
  /** Study groups this has been assigned to; empty means it only sits in the bank. */
  assignedGroups: string[];
}

export interface AuthoredCodeProblem extends AuthoredBase {
  kind: "code";
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  languageCount: number;
  testCaseCount: number;
  /** How many learners have submitted at least once. */
  solverCount: number;
  statement: string;
  examples: { input: string; output: string }[];
  constraints: string[];
  /** Slug of the problem the solve workspace opens. */
  solveSlug: string;
}

export interface AuthoredTheoryLesson extends AuthoredBase {
  kind: "theory";
  chapter: string;
  durationMinutes: number;
  objectiveCount: number;
  /** How many learners have opened the lesson. */
  readerCount: number;
  summary: string;
  objectives: string[];
  /** Lesson body as HTML — what the Tiptap editor produces. */
  contentHtml: string;
}

export type AuthoredProblem = AuthoredCodeProblem | AuthoredTheoryLesson;
