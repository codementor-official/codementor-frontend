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
}

export interface AuthoredTheoryLesson extends AuthoredBase {
  kind: "theory";
  chapter: string;
  durationMinutes: number;
  objectiveCount: number;
  /** How many learners have opened the lesson. */
  readerCount: number;
}

export type AuthoredProblem = AuthoredCodeProblem | AuthoredTheoryLesson;
