"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    // Expanded: take the leftover row width so the collapse toggle sits flush right.
    <div ref={ref} className={`relative ${collapsed ? "" : "min-w-0 flex-1"}`}>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md border border-border bg-surface py-1 shadow-dropdown">
          <div className="border-b border-border-soft px-3 py-2">
            <div className="text-sm font-semibold text-navy">Gia Sĩ</div>
            <div className="truncate text-xs text-text-faint">giasi.nguyen@student.iuh.edu.vn</div>
          </div>
          <ThemePicker />
          <div className="my-1 border-t border-border-soft" />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg"
          >
            <UserRound className="h-4 w-4" /> Chỉnh sửa hồ sơ
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-bg"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </Link>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Tài khoản"
        aria-label="Tài khoản: Gia Sĩ"
        className={`flex h-9 w-full items-center gap-2 rounded-md hover:bg-bg ${
          collapsed ? "justify-center" : "px-1"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-on-ink">
          GS
        </span>
        {!collapsed && <span className="min-w-0 truncate text-sm font-medium text-navy">Gia Sĩ</span>}
      </button>
    </div>
  );
}
