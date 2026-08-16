"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { problems, type Problem } from "@/data/sample-problem";

export function ProblemPicker({ current }: { current: Problem }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg"
      >
        <span className="max-w-52 truncate text-sm font-semibold text-navy">{current.title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-menu-in absolute top-full left-0 z-20 mt-1 max-h-96 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-dropdown">
            {problems.map((p: Problem) => (
              <button
                key={p.slug}
                onClick={() => {
                  setOpen(false);
                  router.push(`/solve/${p.slug}`);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-bg ${
                  p.slug === current.slug ? "font-semibold text-navy" : "text-text"
                }`}
              >
                <span className="truncate">{p.title}</span>
                {/* Plain text, not a badge: in a list of three the pills were louder than
                 * the titles they were labelling. */}
                <span className="shrink-0 text-xs text-text-faint">{p.difficulty}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
