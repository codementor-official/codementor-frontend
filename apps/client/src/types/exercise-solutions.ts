export interface ExerciseSolution {
  id: string;
  title: string;
  explanation: string;
  code: string | null;
  language: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  commentCount: number;
  votedByMe: boolean;
}

export interface ExerciseSolutionsPage {
  items: ExerciseSolution[];
  page: number;
  hasMore: boolean;
  total: number;
  languages: { language: string; count: number }[];
}

export interface ExerciseSolutionInput {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
}

export interface ExerciseSolutionComment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string;
}
