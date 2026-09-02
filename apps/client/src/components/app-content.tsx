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
  // Only the lesson player is a tool surface: it uses every available pixel after the
  // sidebar, like an IDE, so it skips both the padding and the ceiling. `/ai-tutor` used
  // to be here too, but it is a normal page — header, cards, a right rail — and without
  // the shell's padding it sat flush against the sidebar and ran off the right edge.
  const isFullBleed = /^\/roadmaps\/[^/]+\/courses\/[^/]+\/learn\/[^/]+$/.test(pathname);

  return (
    // `scroll-smooth` has to sit here, not on <html>: this element is the scroll container,
    // so it is what an in-page anchor (the settings TOC) actually scrolls.
    <main className={`flex-1 overflow-y-auto scroll-smooth ${isFullBleed ? "p-0" : "px-6 py-5"}`}>
      {isFullBleed ? children : <div className="mx-auto w-full max-w-(--container-wide)">{children}</div>}
    </main>
  );
}
