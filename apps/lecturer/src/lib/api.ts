import { createApiClient } from "@codementor/api-client";
import type { ApiResponse, User } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";

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

export interface UpdateProfileInput {
  displayName: string;
}

export const api = {
  me: () => unwrap<User>("/me"),
  updateProfile: (input: UpdateProfileInput) =>
    unwrap<User>("/me", { method: "PATCH", body: { ...input } }),
};
