"use client";

import dynamic from "next/dynamic";

/** Monaco ships a worker bundle that can't run during SSR, so it's client-only —
 * same pattern as the solve workspace. */
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
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
  theme = "light",
}: {
  language: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Any CSS length. `"100%"` lets the editor fill a resizable pane. */
  height?: number | string;
  /**
   * Monaco ships its own themes, and "vs-dark" in a light UI was the original
   * mismatch. Passed in rather than read from a store, so this package does not
   * depend on whichever state library the consuming application happens to use.
   */
  theme?: "light" | "dark";
}) {
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
        <span className="pointer-events-none absolute top-2.5 left-14 font-mono text-[13px] text-muted-foreground">
          {placeholder}
        </span>
      )}
    </div>
  );
}
