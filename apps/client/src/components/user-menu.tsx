"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";
import { useAuth } from "@/providers/auth-provider";

export function UserMenu({
  collapsed = false,
  /** The sidebar sits at the bottom of the screen so its menu opens upward; the solve
   * topbar needs the opposite. */
  placement = "up",
}: {
  collapsed?: boolean;
  placement?: "up" | "down";
}) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const displayName = user?.displayName ?? "Tài khoản";
  const avatarUrl = user?.avatarUrl;

  return (
    // Expanded: take the leftover row width so the collapse toggle sits flush right.
    <div ref={ref} className={`relative ${collapsed ? "" : "min-w-0 flex-1"}`}>
      {open && (
        <div
          className={`animate-menu-in absolute z-100 w-64 rounded-md border border-border bg-surface py-1 shadow-dropdown ${
            placement === "up" ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2"
          }`}
        >
          <div className="border-b border-border-soft px-3 py-2">
            <div className="truncate text-sm font-semibold text-navy">{displayName}</div>
            {user?.email && <div className="truncate text-xs text-text-faint">{user.email}</div>}
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
          {/*
            Trước đây đây là `<Link href="/">` — bấm "Đăng xuất" chỉ đưa người dùng về
            trang chủ mà không kết thúc phiên nào cả, nên lần đăng nhập kế tiếp lặng lẽ
            khôi phục đúng tài khoản cũ. Nút thật gọi `signOut`, thứ kết thúc cả phiên
            CodeMentor lẫn phiên SSO của Keycloak.
          */}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-bg disabled:opacity-50"
            disabled={leaving}
            onClick={() => {
              setLeaving(true);
              // Không tắt menu: trang sắp bị thay bằng chuyến đi tới Keycloak, và tắt
              // menu chỉ làm nút nhấp nháy rồi biến mất.
              void signOut().finally(() => setLeaving(false));
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" /> {leaving ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Tài khoản"
        aria-label={`Tài khoản: ${displayName}`}
        className={`flex h-9 w-full items-center gap-2 rounded-md hover:bg-bg ${
          collapsed ? "justify-center" : "px-1"
        }`}
      >
        <span
          role={avatarUrl ? "img" : undefined}
          aria-label={avatarUrl ? `Ảnh đại diện của ${displayName}` : undefined}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy bg-cover bg-center text-xs font-semibold text-on-ink"
          style={avatarUrl ? { backgroundImage: `url(${JSON.stringify(avatarUrl)})` } : undefined}
        >
          {!avatarUrl && initialsOf(displayName)}
        </span>
        {!collapsed && (
          <span className="min-w-0 truncate text-sm font-medium text-navy">{displayName}</span>
        )}
      </button>
    </div>
  );
}

/** "Nguyễn Gia Sĩ" → "GS". Lấy hai từ cuối vì tên người Việt đặt họ trước. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).slice(-2);
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("") || "?";
}
