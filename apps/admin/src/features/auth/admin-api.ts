"use client";

import { createApiClient } from "@codementor/api-client";
import { useMemo } from "react";
import { useAdminAuth } from "./auth-provider";

export function useAdminApi() {
  const { getAccessToken } = useAdminAuth();
  return useMemo(
    () =>
      createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
        getAccessToken,
      }),
    [getAccessToken],
  );
}
