"use client";

import { useState } from "react";
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-white/10"
      >
        {language}
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-md border border-zinc-700 bg-zinc-800 p-1.5 shadow-dropdown">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => {
                  onChange(l);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs whitespace-nowrap text-zinc-200 hover:bg-white/10"
              >
                <Check className={`h-3 w-3 shrink-0 text-primary ${l === language ? "opacity-100" : "opacity-0"}`} />
                {l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
