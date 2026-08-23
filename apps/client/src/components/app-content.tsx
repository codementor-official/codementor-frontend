"use client";

import { usePathname } from "next/navigation";

/**
 * The application's only width ceiling. Pages fill what this gives them and never clamp
 * themselves — a page that sets its own `max-w-*` inside an already-clamped shell starves
 * its own content to leave empty gutters, which is exactly what /practice and /exercises
 * used to do. Prose is the one exception, and it clamps at `max-w-[72ch]` at the point the
 * text is rendered, not at the page root.
 */
export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The lesson player and the AI workspace are tool surfaces: they use every available
  // pixel after the sidebar, like an IDE, so they skip both the padding and the ceiling.
  const isFullBleed =
    /^\/roadmaps\/[^/]+\/courses\/[^/]+\/learn\/[^/]+$/.test(pathname) || pathname === "/ai-tutor";

  return (
    // `scroll-smooth` has to sit here, not on <html>: this element is the scroll container,
    // so it is what an in-page anchor (the settings TOC) actually scrolls.
    <main className={`flex-1 overflow-y-auto scroll-smooth ${isFullBleed ? "p-0" : "px-6 py-5"}`}>
      {isFullBleed ? children : <div className="mx-auto w-full max-w-(--container-wide)">{children}</div>}
    </main>
  );
}
