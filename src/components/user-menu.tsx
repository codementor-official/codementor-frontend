"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

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
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-md border border-border bg-surface py-1 shadow-dropdown">
          <div className="border-b border-border-soft px-3 py-2">
            <div className="text-sm font-semibold text-navy">Gia Sĩ</div>
            <div className="truncate text-xs text-text-faint">giasi.nguyen@student.iuh.edu.vn</div>
          </div>
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white"
      >
        GS
      </button>
      {!collapsed && (
        <span className="pointer-events-none absolute top-1/2 left-11 w-32 -translate-y-1/2 truncate text-sm font-medium text-navy">
          Gia Sĩ
        </span>
      )}
    </div>
  );
}
