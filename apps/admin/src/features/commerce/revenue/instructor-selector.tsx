"use client";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import type { RevenueInstructor } from "@codementor/types";
import { Check, ChevronDown, Search, Users } from "lucide-react";

export function InstructorSelector({
  instructors,
  value,
  onChange,
}: {
  instructors: RevenueInstructor[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);
  const [active, setActive] = useState(0);
  const deferredQuery = useDeferredValue(query).trim().toLocaleLowerCase("vi");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const selected = instructors.find((i) => i.id === value);
  const results = instructors.filter((i) =>
    `${i.name} ${i.email}`.toLocaleLowerCase("vi").includes(deferredQuery),
  );
  const options = [
    { id: "", name: "Tất cả giảng viên", email: "Báo cáo toàn hệ thống" },
    ...results.slice(0, limit),
  ];
  const activeIndex = Math.min(active, options.length - 1);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function choose(next: string) {
    onChange(next);
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      ref={root}
      className="relative w-full min-w-0 sm:w-auto sm:min-w-64 sm:flex-1"
    >
      <span className="mb-1.5 block text-sm font-medium">Giảng viên</span>
      <button
        ref={trigger}
        type="button"
        aria-label="Chọn giảng viên báo cáo"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => {
          setOpen(!open);
          setQuery("");
          setLimit(50);
          setActive(0);
        }}
        className="flex w-full items-center gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        <Users className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">
          {selected?.name ??
            (value ? "Đang tải giảng viên…" : "Tất cả giảng viên")}
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-0 rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b p-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={input}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={`${id}-${activeIndex}`}
              aria-label="Tìm giảng viên theo tên hoặc email"
              placeholder="Tìm tên hoặc email…"
              className="min-w-0 w-full bg-transparent text-sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(50);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  trigger.current?.focus();
                }
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const next = Math.max(
                    0,
                    Math.min(
                      options.length - 1,
                      activeIndex + (e.key === "ArrowDown" ? 1 : -1),
                    ),
                  );
                  setActive(next);
                  document
                    .getElementById(`${id}-${next}`)
                    ?.scrollIntoView({ block: "nearest" });
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  choose(options[activeIndex].id);
                }
              }}
            />
          </div>
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label="Danh sách giảng viên"
            className="max-h-72 overflow-y-auto p-1"
          >
            {options.map((i, index) => (
              <button
                key={i.id}
                id={`${id}-${index}`}
                role="option"
                aria-selected={value === i.id}
                type="button"
                onClick={() => choose(i.id)}
                className={`flex w-full items-center gap-3 rounded-md p-3 text-left text-sm transition-colors hover:bg-muted ${index === activeIndex ? "bg-muted" : ""}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                  {i.id ? (
                    i.name
                      .trim()
                      .split(/\s+/)
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")
                      .toLocaleUpperCase("vi")
                  ) : (
                    <Users className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{i.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {i.email}
                  </span>
                </span>
                {value === i.id && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
          {!results.length && query && (
            <p
              role="status"
              className="px-4 py-3 text-sm text-muted-foreground"
            >
              Không tìm thấy giảng viên phù hợp.
            </p>
          )}
          {results.length > limit && (
            <button
              type="button"
              className="w-full border-t p-3 text-sm font-medium text-primary hover:bg-muted"
              onClick={() => setLimit((n) => n + 50)}
            >
              Xem thêm 50 giảng viên ({results.length - limit} còn lại)
            </button>
          )}
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            {results.length} giảng viên · ↑↓ để chọn · Enter để áp dụng
          </p>
        </div>
      )}
    </div>
  );
}
