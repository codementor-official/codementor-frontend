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

/**
 * Ngôn ngữ Monaco tự mang formatter (qua worker của chính nó); mọi ngôn ngữ khác — python,
 * java, c, cpp, go, php — không có formatter nào đăng ký nên "Định dạng code" không làm gì
 * cả. Nút gọi hành động này chỉ nên hiện ra ở đây.
 */
export const FORMATTABLE_LANGUAGES = new Set(["javascript", "typescript", "json", "html", "css"]);

export function CodeEditor({
  language,
  value,
  onChange,
  placeholder,
  height = 240,
  theme = "light",
  readOnly = false,
  onMount,
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
  /** Mã khởi tạo sinh từ chữ ký hàm: chỉ đọc, vì sửa được là mở đường cho một bài không thể giải đúng. */
  readOnly?: boolean;
  /**
   * Nhận instance Monaco. Cần cho những hành động chỉ gọi được trên editor — "Format code"
   * là `editor.action.formatDocument`, không có API nào khác thay thế.
   */
  onMount?: (editor: { getAction: (id: string) => { run: () => void } | null }) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border" style={{ height }}>
      <Editor
        onMount={(editor, monaco) => {
          // `quickSuggestions: false` chỉ tắt gợi ý tự động khi gõ; Ctrl+Space vẫn gọi thẳng
          // lệnh "Trigger Suggest" và mở popup (dù rỗng). Đè phím tắt thành no-op mới chặn
          // được — không có option nào tắt lệnh này.
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {});
          onMount?.(editor);
        }}
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
          readOnly,
          // Không gợi ý — bài chấm code cần học viên tự gõ, không phải đoán qua autocomplete.
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          wordBasedSuggestions: "off",
          tabCompletion: "off",
          snippetSuggestions: "none",
          inlineSuggest: { enabled: false },
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
