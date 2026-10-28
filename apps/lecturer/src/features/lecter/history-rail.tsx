"use client";

import { useCallback, useEffect, useState } from "react";
import { History, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";
import { Button, ConfirmButton, useToast } from "@codementor/ui";
import { api } from "@/lib/api";

/**
 * Nút chỉ có icon. Cố ý KHÔNG dùng `Button`: nó nối class chứ không merge, nên `h-9 px-3` của nó
 * thắng `size-7 px-0` truyền vào — nút "tùy chọn" rộng 28px mà ăn 24px padding, icon ba chấm bị
 * ép còn 4px và chỉ còn thấy chấm giữa.
 */
const ICON_BUTTON =
  "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * Danh sách hội thoại cũ.
 *
 * Tự dựng chứ không dùng `useThreads` của CopilotKit: hook đó chỉ chạy với Intelligence Platform
 * của họ, còn lịch sử ở đây nằm trong Mongo của chính dự án (`ai_agent_sessions`).
 */
export function HistoryRail({
  activeId,
  collapsed,
  onPick,
  onNew,
  onToggle,
  reloadKey,
}: {
  activeId: string;
  collapsed: boolean;
  onPick: (id: string) => void;
  onNew: () => void;
  onToggle: () => void;
  /** Đổi giá trị này để nạp lại danh sách sau khi một lượt chat kết thúc. */
  reloadKey: number;
}) {
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    api.lecter
      .sessions()
      .then((page) => !cancelled && (setSessions(page.items), setError(null)))
      .catch(() => !cancelled && setError("Không tải được lịch sử hội thoại."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load, reloadKey]);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-150 max-lg:hidden ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex items-center gap-2 p-2.5 ${collapsed ? "flex-col" : ""}`}>
        <Button
          aria-label="Hội thoại mới"
          className={collapsed ? "size-9 px-0" : "min-w-0 flex-1"}
          onClick={onNew}
          title={collapsed ? "Hội thoại mới" : undefined}
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {!collapsed && "Hội thoại mới"}
        </Button>
        <button
          aria-label={collapsed ? "Mở rộng danh sách hội thoại" : "Thu gọn danh sách hội thoại"}
          className={`${ICON_BUTTON} size-9`}
          onClick={onToggle}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          type="button"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="size-5" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <p className={`flex items-center gap-1.5 px-3 pb-1.5 text-xs font-medium text-muted-foreground ${collapsed ? "justify-center px-0" : ""}`}>
        <History aria-hidden="true" className="size-3.5" />
        {!collapsed && "Gần đây"}
      </p>

      {/* Lỗi tải danh sách ở lại tại chỗ, không thành toast: nó vẫn đúng sau năm giây. */}
      {error && !collapsed && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}

      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {sessions.map((session) => (
          <li className="group/row relative flex items-center gap-1" key={session.id}>
            <button
              aria-label={session.title}
              className={`min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm hover:bg-sidebar-accent ${
                collapsed ? "flex justify-center" : "pr-10"
              } ${
                session.id === activeId ? "bg-sidebar-accent font-medium" : ""
              }`}
              onClick={() => onPick(session.id)}
              title={collapsed ? session.title : undefined}
              type="button"
            >
              {collapsed ? <History aria-hidden="true" className="size-4" /> : <span className="block truncate">{session.title}</span>}
            </button>
            {!collapsed && (
              <>
                <button
                  aria-expanded={openMenuId === session.id}
                  aria-haspopup="menu"
                  aria-label={`Tùy chọn cho ${session.title}`}
                  className={`${ICON_BUTTON} absolute right-1 size-7 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 aria-expanded:opacity-100`}
                  onClick={() => setOpenMenuId((current) => (current === session.id ? null : session.id))}
                  type="button"
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </button>
                {openMenuId === session.id && (
                  <div className="absolute right-1 top-full z-10 mt-1 min-w-36 rounded-lg border border-border bg-popover p-1 shadow-lg" role="menu">
                    <ConfirmButton
                      className="w-full justify-start gap-2 px-2 text-destructive hover:bg-destructive/10"
                      confirmLabel="Xoá hội thoại"
                      description={`Hội thoại “${session.title}” sẽ bị xoá. Bài code đã tạo từ hội thoại này thì vẫn còn.`}
                      onConfirm={async () => {
                        await api.lecter.removeSession(session.id);
                        setSessions((current) => current.filter((item) => item.id !== session.id));
                        setOpenMenuId(null);
                        if (session.id === activeId) onNew();
                        toast.success("Đã xoá hội thoại");
                      }}
                      role="menuitem"
                      size="sm"
                      title="Xoá hội thoại này?"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                      Xoá hội thoại
                    </ConfirmButton>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
        {sessions.length === 0 && !error && (
          <li className="px-2 py-2 text-xs text-muted-foreground">Chưa có hội thoại nào.</li>
        )}
      </ul>
    </aside>
  );
}
