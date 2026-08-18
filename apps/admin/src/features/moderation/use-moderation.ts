"use client";

import { useCallback, useState } from "react";
import { ApiClientError } from "@codementor/api-client";
import { useToast } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi, type ContentKind, type ModerationDecision } from "@/lib/api";

/**
 * Một quyết định kiểm duyệt, dùng chung cho drawer và ba trang xem nội dung.
 *
 * Trả về `boolean` chứ không ném: mọi nơi gọi đều muốn biết "xong chưa" để đóng form hay
 * quay lại danh sách, và không nơi nào xử lý được lỗi khác đi so với việc hiện nó ra.
 */
export function useModeration(kind: ContentKind, onDone?: () => void) {
  const request = useAdminApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const decide = useCallback(
    async (id: string, decision: ModerationDecision, reason?: string): Promise<boolean> => {
      setBusy(true);
      try {
        await moderationApi.decide(request, kind, id, decision, reason?.trim() || undefined);
        onDone?.();
        return true;
      } catch (cause) {
        // Thất bại ở đây gần như luôn là 422 "không ở trạng thái ..." vì người khác vừa
        // quyết định trước — một câu trôi qua được, không phải trạng thái phải giữ lại.
        toast.error(describeError(cause));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [kind, onDone, request, toast],
  );

  return { busy, decide };
}

/**
 * Thông điệp lỗi mà backend đã viết sẵn.
 *
 * Quan trọng với màn kiểm duyệt hơn chỗ khác: 422 ở đây luôn kèm một câu nói rõ trạng thái
 * hiện tại ("Bài không ở trạng thái chờ duyệt (đang published)"), và đó chính là điều admin
 * cần biết khi hai người cùng mở một hàng chờ.
 */
export function describeError(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
