import type { ReactNode } from "react";

/**
 * Padding and scrolling for an ordinary, document-shaped screen.
 *
 * The shell deliberately hands `<main>` over with neither, because the studio and solve
 * screens are split panes that must reach the edges and manage their own scrolling. Every
 * other screen wraps itself in this instead.
 */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto px-4 py-4 sm:px-5">{children}</div>;
}
