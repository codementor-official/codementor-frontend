import { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";
import type { UpdateProfileInput, UserProfile } from "@/features/profile/types";
import type {
  Exercise,
  ExerciseContent,
  ExerciseListItem,
  JudgeRunResult,
  Page,
} from "@/features/exercises/types";
import type { Roadmap, RoadmapListItem } from "@/features/roadmaps/types";
import type { Course, CourseListItem, LessonContent } from "@/features/courses/types";

/**
 * The single place that knows a backend URL. Everything below calls the gateway, so
 * moving a resource between services, or putting a different gateway in front, is a
 * change to kong.yml and to nothing in this application.
 */
let readAccessToken: () => string | null = () => null;

/** Called once by the auth provider; keeps the client free of React imports. */
export function setAccessTokenReader(reader: () => string | null): void {
  readAccessToken = reader;
}

const request = createApiClient({
  baseUrl: apiBaseUrl,
  getAccessToken: () => readAccessToken(),
});

/** Every backend response is wrapped by the response interceptor in libs/platform. */
async function unwrap<T>(path: string, options?: Parameters<typeof request>[1]): Promise<T> {
  const response = await request<ApiResponse<T>>(path, options);
  return response.data;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

/** Tham số danh sách dùng chung; mỗi domain chỉ đọc những khoá nó hiểu. */
export interface ListExercisesParams {
  q?: string;
  difficulty?: string;
  status?: string;
  kind?: string;
  field?: string;
  level?: string;
  cursor?: string;
  limit?: number;
}

export const api = {
  me: () => unwrap<UserProfile>("/me"),
  updateProfile: (input: UpdateProfileInput) =>
    unwrap<UserProfile>("/me", { method: "PATCH", body: { ...input } }),

  exercises: {
    /** Kho bài chung: chỉ bài public đã công khai, mọi tác giả. */
    bank: (params: ListExercisesParams = {}) =>
      unwrap<Page<ExerciseListItem>>(`/exercises${query({ ...params })}`),
    /** Bài của tôi, mọi trạng thái. Hai phạm vi là hai đường dẫn, không phải một cờ. */
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<ExerciseListItem>>(`/exercises/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Exercise>(`/exercises/${id}`),
    create: (body: { title: string; kind: string; difficulty: string; summary?: string | null }) =>
      unwrap<Exercise>("/exercises", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Exercise>(`/exercises/${id}`, { method: "PATCH", body }),
    saveContent: (id: string, content: ExerciseContent) =>
      unwrap<Exercise>(`/exercises/${id}/content`, {
        method: "PUT",
        body: content as Record<string, unknown>,
      }),
    remove: (id: string) => unwrap<void>(`/exercises/${id}`, { method: "DELETE" }),
    fork: (id: string) => unwrap<Exercise>(`/exercises/${id}/fork`, { method: "POST" }),
    submit: (id: string) => unwrap<Exercise>(`/exercises/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Exercise>(`/exercises/${id}/withdraw`, { method: "POST" }),
  },

  roadmaps: {
    catalogue: (params: ListExercisesParams = {}) =>
      unwrap<Page<RoadmapListItem>>(`/roadmaps${query({ ...params })}`),
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<RoadmapListItem>>(`/roadmaps/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}`),
    create: (body: { title: string; field: string; level: string }) =>
      unwrap<Roadmap>("/roadmaps", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Roadmap>(`/roadmaps/${id}`, { method: "PATCH", body }),
    /** Ghi cả danh sách; thứ tự lấy theo thứ tự mảng, backend tự tính lại tổng giờ. */
    replaceCourses: (id: string, courses: { courseId: string; isOptional: boolean }[]) =>
      unwrap<Roadmap>(`/roadmaps/${id}/courses`, { method: "PUT", body: { courses } }),
    submit: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}/withdraw`, { method: "POST" }),
    remove: (id: string) => unwrap<void>(`/roadmaps/${id}`, { method: "DELETE" }),
  },

  /**
   * judge-service chấm đồng bộ. Đây là đường "chạy thử": không tạo bài nộp, không ghi lịch
   * sử — giảng viên chỉ muốn biết đề của mình chạy có ra kết quả không.
   */
  judge: {
    run: (body: {
      language: string;
      sourceCode: string;
      timeLimitMs: number;
      memoryLimitKb: number;
      testCases: { order: number; input: string; expected: string; weight?: number }[];
    }) => unwrap<JudgeRunResult>("/judge/run", { method: "POST", body }),
  },

  courses: {
    catalogue: (params: ListExercisesParams = {}) =>
      unwrap<Page<CourseListItem>>(`/courses${query({ ...params })}`),
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<CourseListItem>>(`/courses/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Course>(`/courses/${id}`),
    create: (body: { title: string; level: string }) =>
      unwrap<Course>("/courses", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Course>(`/courses/${id}`, { method: "PATCH", body }),
    /** Ghi cả cây; thứ tự lấy theo thứ tự mảng, id giữ nguyên để không mất tiến độ. */
    saveCurriculum: (id: string, chapters: unknown[]) =>
      unwrap<Course>(`/courses/${id}/curriculum`, { method: "PUT", body: { chapters } }),
    lessonContent: (id: string, lessonId: string) =>
      unwrap<LessonContent | null>(`/courses/${id}/lessons/${lessonId}/content`),
    saveLessonContent: (id: string, lessonId: string, content: LessonContent) =>
      unwrap<LessonContent>(`/courses/${id}/lessons/${lessonId}/content`, {
        method: "PUT",
        body: content as Record<string, unknown>,
      }),
    submit: (id: string) => unwrap<Course>(`/courses/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Course>(`/courses/${id}/withdraw`, { method: "POST" }),
    remove: (id: string) => unwrap<void>(`/courses/${id}`, { method: "DELETE" }),
  },
};
