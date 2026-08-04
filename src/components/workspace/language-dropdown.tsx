"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export function LanguageDropdown({
  language,
  onChange,
  languages,
}: {
  language: string;
  onChange: (lang: string) => void;
  languages: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;

    const updatePosition = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = languages.length * 34 + 12;
      const canOpenBelow = rect.bottom + 4 + menuHeight <= window.innerHeight - 8;
      setPos({
        top: canOpenBelow ? rect.bottom + 4 : Math.max(8, rect.top - menuHeight - 4),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [languages.length, open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-14 items-center justify-end gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-navy hover:bg-bg"
      >
        {language}
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-100" onClick={() => setOpen(false)} />
            <div
              role="menu"
              aria-label="Chọn ngôn ngữ lập trình"
              style={{ top: pos.top, right: pos.right }}
              className="animate-menu-in fixed z-101 flex w-44 flex-col gap-0.5 rounded-lg border border-border bg-surface p-1.5 shadow-dropdown"
            >
              {languages.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="menuitemradio"
                  aria-checked={l === language}
                  onClick={() => {
                    onChange(l);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs whitespace-nowrap hover:bg-bg ${l === language ? "bg-primary-tint font-semibold text-primary" : "text-text"}`}
                >
                  <Check className={`h-3 w-3 shrink-0 text-primary ${l === language ? "opacity-100" : "opacity-0"}`} />
                  {l}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
