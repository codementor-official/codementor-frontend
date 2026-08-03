"use client";

import { usePathname } from "next/navigation";

/** Keeps catalogue pages comfortably constrained while the lesson player can use every
 * available pixel after the app sidebar, just like an IDE or video-learning workspace. */
export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLearningWorkspace = /^\/paths\/[^/]+\/courses\/[^/]+\/learn\/[^/]+$/.test(pathname);

  return (
    <main className={`flex-1 overflow-y-auto ${isLearningWorkspace ? "p-0" : "p-5"}`}>
      {isLearningWorkspace ? <div className="mx-auto w-full py-3 sm:w-[94%] sm:py-4 xl:w-[90%]">{children}</div> : <div className="mx-auto max-w-(--container-max)">{children}</div>}
    </main>
  );
}
