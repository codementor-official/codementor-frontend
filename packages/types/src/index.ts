export * from "./content";

/**
 * Vocabulary shared with the backend. These are not free choices: `Role` mirrors
 * the PostgreSQL `platform_role` enum and the Keycloak realm roles, and `User`
 * mirrors what core-service returns from `GET /api/v1/me`. Renaming a value here
 * without renaming it there produces a silent mismatch — a role that never
 * matches and a permission that is never granted.
 */
export type Role = "learner" | "lecturer" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  /** Exactly one platform role. Keycloak may grant several; the API resolves the highest. */
  role: Role;
  handle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  githubHandle?: string | null;
  locale?: string;
  timezone?: string;
  emailVerified?: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

/** Every backend response is wrapped by the response interceptor in libs/platform. */
export interface ApiResponse<T> {
  data: T;
  requestId?: string;
}
