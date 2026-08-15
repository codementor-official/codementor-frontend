"use client";

import { createApiClient } from "@codementor/api-client";
import { useMemo } from "react";

export function useAdminApi() {
  return useMemo(() => createApiClient({ baseUrl: "/api/backend" }), []);
}
