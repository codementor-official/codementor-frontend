"use client";

import { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useToast } from "@codementor/ui";
import { api } from "@/lib/api";
import type { BookmarkTarget } from "@/features/account/types";

export function SaveButton({
  targetType,
  targetId,
  targetRef,
  compact = false,
}: {
  targetType: BookmarkTarget;
  targetId: string;
  targetRef?: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.account.bookmarkStatus(targetType, targetId)
      .then((result) => active && setSaved(result.saved))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [targetId, targetType]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{
        targetType: BookmarkTarget;
        targetId: string;
        saved: boolean;
      }>).detail;
      if (detail?.targetType === targetType && detail.targetId === targetId)
        setSaved(detail.saved);
    };
    window.addEventListener("bookmark-changed", sync);
    return () => window.removeEventListener("bookmark-changed", sync);
  }, [targetId, targetType]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (saved) await api.account.removeBookmark(targetType, targetId);
      else await api.account.saveBookmark({ targetType, targetId, targetRef });
      const nextSaved = !saved;
      setSaved(nextSaved);
      window.dispatchEvent(new CustomEvent("bookmark-changed", {
        detail: { targetType, targetId, saved: nextSaved },
      }));
      toast.success(saved ? "Đã bỏ khỏi danh sách đã lưu." : "Đã lưu để xem lại.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không cập nhật được nội dung đã lưu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      aria-label={saved ? "Bỏ lưu" : "Lưu để xem sau"}
      aria-pressed={saved}
      onClick={() => void toggle()}
      className={compact
        ? `rounded-md p-2 transition-colors ${saved ? "bg-primary-tint text-primary" : "text-text-faint hover:bg-bg hover:text-navy"}`
        : `inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold transition-colors ${saved ? "border-primary/30 bg-primary-tint text-primary" : "text-navy hover:bg-bg"}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />}
      {!compact && (saved ? "Đã lưu" : "Lưu")}
    </button>
  );
}
