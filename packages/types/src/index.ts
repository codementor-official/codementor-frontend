export type Role = "STUDENT" | "LECTURER" | "ADMIN" | "AI_AGENT";

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  roles: Role[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  requestId?: string;
}
