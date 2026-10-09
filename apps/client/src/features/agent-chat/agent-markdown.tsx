"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

/**
 * Markdown của câu trả lời agent: cùng `.rich-text` với studio, có tô màu code.
 *
 * Ảnh và liên kết bị tắt có chủ đích. Model đọc tài liệu do người dùng tải lên, và một câu
 * "chèn ảnh này" nằm trong tài liệu là đủ để câu trả lời gọi ra một URL lạ ngay khi được vẽ
 * (ảnh tự tải, không cần ai bấm). Prompt đã bảo model không tạo URL; đây là chỗ không phụ thuộc
 * vào việc model nghe lời.
 */
export function AgentMarkdown({ content }: { content: string }) {
  return (
    <div className="rich-text break-words text-sm leading-7 text-text [&_pre]:overflow-x-auto">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{ img: () => null, a: ({ children }) => <span>{children}</span> }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
