"use client";

import { useEffect, useState } from "react";

/**
 * Whether the page is currently dark, for the components that need a colour value rather
 * than a CSS class — Monaco takes its theme as a prop and cannot read `.dark` off an
 * ancestor.
 *
 * Reads the class the topbar toggles instead of the stored preference, because "system"
 * resolves to either value; observing the class covers the OS flipping under us too.
 */
export function useResolvedTheme(): "light" | "dark" {
  // Always light on the first paint: the server has no DOM, and guessing differently here
  // is a hydration mismatch. The effect corrects it before anything is interactive.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
