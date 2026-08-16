"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "Nhờ gợi ý theo mức, mình tự tìm ra lỗi thay vì chờ đáp án. Kỹ năng cải thiện rõ chỉ sau một tháng luyện đều.",
    initials: "TN",
    name: "Nguyễn Trung Nguyên",
    role: "Người mới học lập trình",
  },
  {
    quote:
      "Mình dùng CodeMentor để ôn thuật toán trước phỏng vấn — lộ trình rõ ràng, luyện tập bám sát đề thật rất hiệu quả.",
    initials: "TC",
    name: "Lê Thanh Cường",
    role: "Chuẩn bị phỏng vấn",
  },
  {
    quote:
      "Bảng tiến độ chỉ đúng chỗ mình yếu là đệ quy. Luyện thêm một tuần theo bài hệ thống gợi ý là làm chủ được.",
    initials: "VB",
    name: "Trần Văn Bình",
    role: "Lập trình viên tự học",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="w-full shrink-0 rounded-xl border border-border bg-surface p-8 text-center sm:p-11"
            >
              <p className="mb-5 text-base leading-relaxed text-navy">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-on-ink">
                  {t.initials}
                </span>
                <div className="text-left">
                  <div className="text-sm font-semibold text-navy">{t.name}</div>
                  <div className="text-xs text-text-faint">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
        aria-label="Đánh giá trước"
        className="absolute top-1/2 -left-4 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-navy shadow-card"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
        aria-label="Đánh giá tiếp theo"
        className="absolute top-1/2 -right-4 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-navy shadow-card"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="mt-4 flex justify-center gap-1.5">
        {testimonials.map((t, i) => (
          <button
            key={t.name}
            onClick={() => setIndex(i)}
            aria-label={`Xem đánh giá ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-5 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
