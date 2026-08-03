"use client";

import { useEffect, useState } from "react";
import { resolveTheme, useThemeStore } from "./theme-store";

/**
 * The concrete theme in effect — "system" already collapsed to light or dark, and kept in
 * sync when the OS setting changes.
 *
 * Returns "light" until mounted: the server can't know the stored preference, so committing
 * to one before hydration would mismatch. Consumers that paint (Monaco) only care about the
 * post-mount value anyway.
 */
export function useResolvedTheme(): "light" | "dark" {
  const preference = useThemeStore((s) => s.preference);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    setResolved(resolveTheme(preference));
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return resolved;
}
