"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * Bộ chọn ngôn ngữ ở thanh tiêu đề của trình soạn code.
 *
 * Nằm ở gói dùng chung chứ không ở một app: web và lecturer hiển thị **cùng một** khu vực làm
 * bài, và app không được import code của app khác. Vì thế nó chỉ dùng những token màu có ở cả
 * hai bảng màu (`border`, `card`, `muted`, `foreground`, `primary`) — `surface`, `navy`,
 * `text-faint` chỉ tồn tại bên web.
 *
 * Menu đi qua `createPortal`: nút này nằm trong một pane có `overflow-hidden`, nên menu render
 * tại chỗ sẽ bị cắt mất.
 */
export function LanguageDropdown({
  language,
  onChange,
  languages,
  label,
}: {
  language: string;
  onChange: (language: string) => void;
  languages: string[];
  /** Nhãn hiển thị, mặc định là chính giá trị. Dùng khi id khác tên hiển thị. */
  label?: (language: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const show = label ?? ((value: string) => value);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = languages.length * 34 + 12;
      // Mở lên trên khi dưới không đủ chỗ: nút này thường nằm sát đáy màn hình.
      const canOpenBelow = rect.bottom + 4 + menuHeight <= window.innerHeight - 8;
      setPosition({
        top: canOpenBelow ? rect.bottom + 4 : Math.max(8, rect.top - menuHeight - 4),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [languages.length, open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Chọn ngôn ngữ lập trình"
        onClick={() => setOpen((shown) => !shown)}
        className="flex min-w-14 items-center justify-end gap-1.5 rounded-md px-2 py-1 text-xs font-medium hover:bg-muted"
      >
        {show(language)}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        position &&
        createPortal(
          <>
            <div className="fixed inset-0 z-100" onClick={() => setOpen(false)} />
            <div
              role="menu"
              aria-label="Ngôn ngữ lập trình"
              style={{ top: position.top, right: position.right }}
              className="fixed z-101 flex w-44 flex-col gap-0.5 rounded-lg border border-border bg-card p-1.5 shadow-lg"
            >
              {languages.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option === language}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs whitespace-nowrap hover:bg-muted ${
                    option === language ? "bg-primary/10 font-semibold text-primary" : ""
                  }`}
                >
                  <Check
                    className={`size-3 shrink-0 text-primary ${option === language ? "opacity-100" : "opacity-0"}`}
                  />
                  {show(option)}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
