"use client";

import { useEffect } from "react";
import { getUserManager } from "@codementor/auth";
import { keycloakConfig } from "@/lib/env";

/**
 * Loaded inside a hidden iframe by `automaticSilentRenew`, never by a person.
 * It hands the result to the parent window's UserManager and renders nothing.
 */
export default function SilentRenewPage() {
  useEffect(() => {
    void getUserManager(keycloakConfig, window.location.origin).signinSilentCallback();
  }, []);

  return null;
}
