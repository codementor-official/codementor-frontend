"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@codementor/api-client";

export function aiError(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    if (cause.status === 502 || cause.status === 504)
      return "Dịch vụ đang khởi động hoặc tạm thời chưa phản hồi. Vui lòng thử lại sau ít phút.";
    const body = cause.body as
      { message?: unknown; detail?: unknown } | undefined;
    if (typeof body?.message === "string") return body.message;
    if (typeof body?.detail === "string") return body.detail;
    if (cause.status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (cause.status === 403)
      return "Bạn không có quyền đọc tài liệu trong nhóm này.";
  }
  return cause instanceof Error
    ? cause.message
    : "Không tải được dữ liệu. Vui lòng thử lại.";
}

export function useAiResource<T>(
  key: string,
  load: () => Promise<T>,
  poll = 0,
) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>(
    { key: "" },
  );
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    let running = false;
    const fetchData = async () => {
      if (running) return;
      running = true;
      try {
        const data = await load();
        if (active) setState({ key, data });
      } catch (cause) {
        if (active) setState({ key, error: aiError(cause) });
      } finally {
        running = false;
      }
    };
    void fetchData();
    const timer = poll
      ? setInterval(() => {
          if (document.visibilityState === "visible") void fetchData();
        }, poll)
      : undefined;
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [key, load, poll, version]);
  return {
    data: state.key === key ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    loading: state.key !== key,
    refresh,
  };
}
