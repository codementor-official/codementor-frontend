"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi, type AuditLogEntry } from "@/lib/api";
import type { ContentKind } from "./types";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/**
 * Lịch sử kiểm duyệt của một nội dung: ai đã quyết gì, lúc nào, vì sao.
 *
 * Đây là nửa còn lại của tính năng hoàn tác. Một nút "Hoàn tác" mà không có gì kể lại
 * chuyện đã xảy ra thì người bấm không biết mình đang lùi khỏi cái gì — nhất là khi
 * người ra quyết định ban đầu là một quản trị viên khác.
 *
 * Đọc từ `audit_logs`, bảng chỉ-ghi-thêm: một lần hoàn tác KHÔNG xoá dòng nhật ký của
 * quyết định bị lùi, nó thêm một dòng mới bên trên. Cả hai đều là việc đã xảy ra thật.
 */
export function ModerationHistory({ kind, id }: { kind: ContentKind; id: string }) {
  const request = useAdminApi();
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setFailed(false);
    moderationApi
      .history(request, kind, id)
      .then((rows) => !cancelled && setEntries(rows))
      // Nhật ký hỏng không được che mất bản xem trước: quản trị viên vẫn phải duyệt được
      // nội dung này kể cả khi core-service đang chết.
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [request, kind, id]);

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <History aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <h3 className="text-xs font-bold tracking-wide uppercase">Lịch sử kiểm duyệt</h3>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      {failed ? (
        <p className="text-sm text-muted-foreground">Không đọc được nhật ký kiểm duyệt.</p>
      ) : entries === null ? (
        <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>
      ) : entries.length === 0 ? (
        // Nội dung gửi lần đầu chưa có quyết định nào — và nội dung quyết định TRƯỚC khi
        // có nhật ký này cũng vậy. Câu chữ phải đúng cho cả hai.
        <p className="text-sm text-muted-foreground">Chưa có thao tác kiểm duyệt nào được ghi lại.</p>
      ) : (
        <ol className="grid gap-2">
          {entries.map((entry) => {
            const reason = typeof entry.metadata.reason === "string" ? entry.metadata.reason : null;
            return (
              <li className="rounded-lg border px-3 py-2" key={entry.id}>
                <p className="text-sm">{entry.summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dateFormat.format(new Date(entry.createdAt))} · {entry.actorEmail}
                </p>
                {reason && <p className="mt-1.5 text-xs">Lý do: {reason}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
