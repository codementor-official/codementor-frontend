"use client";

import { useEffect, useRef } from "react";
import { getUserManager } from "@codementor/auth";
import { keycloakConfig } from "@/lib/env";

/**
 * Loaded inside a hidden iframe by `automaticSilentRenew`, never by a person.
 * It hands the result to the parent window's UserManager and renders nothing.
 */
export default function SilentRenewPage() {
  const started = useRef(false);

  useEffect(() => {
    // React Strict Mode chạy effect hai lần trong development, trong khi authorization
    // code/state của OIDC chỉ được tiêu thụ một lần. Lần gọi thứ hai từng phát lỗi renew
    // và khiến provider ở cửa sổ cha quay về login.
    if (started.current) return;
    started.current = true;
    void getUserManager(keycloakConfig, window.location.origin)
      .signinSilentCallback()
      .catch(() => undefined);
  }, []);

  return null;
}
