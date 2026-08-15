export type SubmissionOrigin = "Nhóm học tập" | "Bài luyện tập";

export type SubmissionResult = "Đạt" | "Không đạt" | "Lỗi biên dịch";

export interface SubmissionHistoryItem {
  id: string;
  title: string;
  origin: SubmissionOrigin;
  groupName?: string;
  language: string;
  result: SubmissionResult;
  score: number;
  passedTests: number;
  totalTests: number;
  runtime: string;
  memory: string;
  submittedAt: string;
  version: number;
  sourceCode: string;
  note: string;
}
