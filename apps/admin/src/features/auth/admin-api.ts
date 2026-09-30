"use client";

import { ApiClientError, createApiClient } from "@codementor/api-client";
import { useMemo } from "react";

export function useAdminApi() {
  return useMemo(() => {
    const request = createApiClient({ baseUrl: "/api/backend" });
    return async <T,>(path: string, options = {}) => {
      try {
        return await request<T>(path, options);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401 && typeof window !== "undefined") {
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        }
        throw error;
      }
    };
  }, []);
}
