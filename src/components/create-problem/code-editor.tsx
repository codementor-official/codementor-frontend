"use client";

import dynamic from "next/dynamic";
import { useResolvedTheme } from "@/lib/store/use-resolved-theme";

/** Monaco ships a worker bundle that can't run during SSR, so it's client-only —
 * same pattern as the solve workspace. */
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-text-faint">
      Đang tải trình soạn thảo...
    </div>
  ),
});

export function CodeEditor({
  language,
  value,
  onChange,
  placeholder,
  height = 240,
}: {
  language: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}) {
  // Monaco ships its own themes; "vs-dark" in a light UI was the mismatch here.
  const theme = useResolvedTheme();
  return (
    <div className="relative overflow-hidden rounded-md border border-border" style={{ height }}>
      <Editor
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 10 },
          lineNumbersMinChars: 3,
        }}
      />
      {/* Monaco has no placeholder API — an overlay is the usual workaround. It must not
       * swallow the click that focuses the editor underneath. */}
      {value === "" && placeholder && (
        <span className="pointer-events-none absolute top-2.5 left-14 font-mono text-[13px] text-text-faint">
          {placeholder}
        </span>
      )}
    </div>
  );
}
