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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-navy hover:bg-bg"
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
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-101 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-md border border-border bg-surface p-1.5 shadow-dropdown"
            >
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    onChange(l);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs whitespace-nowrap text-text hover:bg-bg"
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
