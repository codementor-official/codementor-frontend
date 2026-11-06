"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, DifficultyBadge, type Difficulty } from "@/components/ui/badge";

const GAP = 6; // gap-1.5
const POPOVER_WIDTH = 256;
const EDGE = 8;

/**
 * Độ khó + tag trên đúng MỘT dòng. Tag không vừa thì gom vào chip "…"; rê chuột hoặc tab
 * tới chip đó thì hiện đủ danh sách.
 *
 * Đo bằng một hàng ẩn chứa đủ mọi chip: hàng thật chỉ vẽ phần vừa, nên không đo được
 * bề rộng của chính những chip nó đã bỏ đi.
 *
 * Danh sách đầy đủ vẽ ở `document.body`, không phải `absolute` cạnh chip: thẻ có
 * `overflow-hidden` sẽ cắt mất nó (cùng lý do với `InfoHint`).
 */
export function TagRow({ difficulty, tags }: { difficulty?: Difficulty; tags: string[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(tags.length);
  const [popover, setPopover] = useState<{ top: number; left: number } | null>(null);
  const tagKey = tags.join("\u0000");

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const fit = () => {
      const chips = [...measure.children] as HTMLElement[];
      const more = chips.pop()!; // chip "…" luôn nằm cuối hàng đo
      const widths = chips.map((chip) => chip.offsetWidth);
      const lead = difficulty ? 1 : 0;
      const available = row.clientWidth;
      const total = widths.reduce((sum, w) => sum + w, 0) + GAP * Math.max(0, widths.length - 1);
      if (total <= available) return setShown(tags.length);
      // Chừa chỗ cho chip "…", rồi lấy tag theo thứ tự tới khi hết chỗ.
      let used = more.offsetWidth;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        if (used + GAP + widths[i] > available && i >= lead) break;
        used += GAP + widths[i];
        if (i >= lead) count++;
      }
      setShown(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
    // `tagKey` thay cho `tags`: mảng mới mỗi lần render nhưng nội dung như cũ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagKey, difficulty]);

  if (!difficulty && tags.length === 0) return null;
  const hidden = tags.length - shown;

  const open = () => {
    const anchor = triggerRef.current?.getBoundingClientRect();
    if (!anchor) return;
    setPopover({
      top: anchor.bottom + 6,
      left: Math.min(Math.max(EDGE, anchor.left), window.innerWidth - POPOVER_WIDTH - EDGE),
    });
  };

  return (
    <div ref={rowRef} className="relative flex min-w-0 flex-nowrap gap-1.5 overflow-hidden">
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex gap-1.5 whitespace-nowrap"
      >
        {difficulty && <DifficultyBadge difficulty={difficulty} />}
        {tags.map((t) => (
          <Badge key={t} tone="neutral">{t}</Badge>
        ))}
        <Badge tone="neutral">…</Badge>
      </div>
      {difficulty && <DifficultyBadge difficulty={difficulty} />}
      {tags.slice(0, shown).map((t) => (
        <Badge key={t} tone="neutral">{t}</Badge>
      ))}
      {hidden > 0 && (
        // `relative z-10`: nằm trên link phủ cả thẻ, nếu không link nuốt mất hover.
        <span
          ref={triggerRef}
          tabIndex={0}
          aria-label={`Xem đủ ${tags.length} thẻ: ${tags.join(", ")}`}
          className="relative z-10 shrink-0 cursor-default rounded-sm"
          onMouseEnter={open}
          onMouseLeave={() => setPopover(null)}
          onFocus={open}
          onBlur={() => setPopover(null)}
        >
          <Badge tone="neutral">…</Badge>
        </span>
      )}
      {popover &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: popover.top, left: popover.left, maxWidth: POPOVER_WIDTH }}
            className="fixed z-50 flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-2 shadow-lg"
          >
            {tags.map((t) => (
              <Badge key={t} tone="neutral">{t}</Badge>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
