"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import type { Problem } from "@/data/sample-problem";
import type { ExerciseSummary } from "@/types/catalogue";

const DIFFICULTY_LABEL: Record<ExerciseSummary["difficulty"], string> = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};

/**
 * Lists the published bank, not the mock catalogue. It navigates by id because that is
 * what `/solve/[exerciseId]` resolves — the slugs it used to push only ever matched mock
 * entries, which is why switching problems here landed on the quadratic-equation sample.
 */
export function ProblemPicker({ current }: { current: Problem }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ExerciseSummary[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;
    api.exercises
      .bank({ limit: 50 })
      .then((page) => !cancelled && setItems(page.items))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [open, items]);

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
            {items === null && (
              <p className="px-3 py-2 text-xs text-text-faint">Đang tải danh sách...</p>
            )}
            {items?.length === 0 && (
              <p className="px-3 py-2 text-xs text-text-faint">Chưa có bài nào được công khai.</p>
            )}
            {items?.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  router.push(`/solve/${item.id}`);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-bg ${
                  item.slug === current.slug ? "font-semibold text-navy" : "text-text"
                }`}
              >
                <span className="truncate">{item.title}</span>
                {/* Plain text, not a badge: in a short list the pills were louder than
                 * the titles they were labelling. */}
                <span className="shrink-0 text-xs text-text-faint">{DIFFICULTY_LABEL[item.difficulty]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
