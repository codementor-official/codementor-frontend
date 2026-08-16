"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "CodeMentor phù hợp với ai?",
    a: "Với tất cả mọi người muốn học và luyện lập trình — từ người mới bắt đầu, người tự học, đến lập trình viên luyện thuật toán hoặc chuẩn bị phỏng vấn.",
  },
  {
    q: "AI có đưa đáp án hoàn chỉnh không?",
    a: "Không. AI chỉ gợi ý theo 3 mức: hướng tiếp cận, khung code và giải thích lỗi. Mục tiêu là bạn tự viết được lời giải.",
  },
  {
    q: "Hệ thống hỗ trợ những ngôn ngữ nào?",
    a: "C, C++, Java, Python, JavaScript và Go.",
  },
  {
    q: "Làm sao để tham gia một nhóm học tập?",
    a: "Nhập mã mời hoặc dán liên kết mời trong mục Nhóm học tập. Chủ nhóm cũng có thể thêm bạn trực tiếp bằng tên đăng nhập.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="rounded-xl border border-border bg-surface">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-navy">{f.q}</span>
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0 text-text-faint" />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-text-faint" />
              )}
            </button>
            {isOpen && (
              <p className="px-5 pb-4 text-sm leading-relaxed text-text-muted">{f.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
