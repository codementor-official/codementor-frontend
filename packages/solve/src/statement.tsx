"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

/** Đề bài viết bằng Markdown, vẽ đúng như người học đọc. App phải nạp kiểu `.rich-text`. */
export function ExerciseStatement({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`rich-text ${className}`}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{text}</ReactMarkdown>
    </div>
  );
}
