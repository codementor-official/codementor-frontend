"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface RowActionItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Renders in the danger colour and sits below a divider. */
  danger?: boolean;
  /** Starts a new group with a divider above it. */
  separatorBefore?: boolean;
  disabled?: boolean;
}

export interface RowActionSection {
  /** Small uppercase caption above a group of items, e.g. "Hiển thị". */
  label: string;
  items: RowActionItem[];
}

/**
 * The single "⋮" menu on a table row. Portalled to the body and positioned from the
 * trigger's rect so it escapes the table's `overflow-x-auto` clip instead of being
 * cut off at the table edge.
 */
export function RowActionMenu({
  items = [],
  sections = [],
  label = "Tùy chọn",
}: {
  items?: RowActionItem[];
  sections?: RowActionSection[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Any scroll invalidates the anchored position, so close rather than drift.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const renderItem = (item: RowActionItem) => (
    <button
      key={item.key}
      type="button"
      disabled={item.disabled}
      onClick={() => {
        setOpen(false);
        item.onSelect();
      }}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
        item.danger ? "text-primary hover:bg-primary-tint" : "text-text hover:bg-bg"
      }`}
    >
      {item.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{item.icon}</span>}
      {item.label}
    </button>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-100" onClick={() => setOpen(false)} />
            <div
              role="menu"
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-101 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-dropdown"
            >
              {sections.map((section, i) => (
                <div key={section.label} className={i > 0 ? "mt-1 border-t border-border-soft pt-1" : ""}>
                  <div className="px-2.5 py-1 text-2xs font-bold tracking-wide text-text-faint uppercase">
                    {section.label}
                  </div>
                  {section.items.map(renderItem)}
                </div>
              ))}
              {items.map((item) => (
                <div
                  key={item.key}
                  className={item.separatorBefore ? "mt-1 border-t border-border-soft pt-1" : ""}
                >
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
