import { History } from "lucide-react";
import { Card, CardContent, CardHeader, StatusBadge } from "@codementor/ui";
import type { AuditLogEntry } from "@/lib/api";

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

const ACTION_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  "user.created": "success",
  "user.activated": "success",
  "user.role_changed": "warning",
  "user.suspended": "danger",
};

/**
 * Hoạt động quản trị gần đây, đọc từ bảng `audit_logs`.
 *
 * Bản cũ liệt kê năm dòng viết cứng ("Sarah Chen đăng ký giảng viên", "David Park đăng
 * khoá học") — tên người không có thật, việc không có thật. Giờ mỗi dòng là một hành động
 * đã thực sự xảy ra, do đúng người đó thực hiện.
 *
 * Thẻ "Tình trạng hệ thống — mọi dịch vụ đang hoạt động" cũng đã bỏ: nó không kiểm gì cả,
 * chỉ in ra dòng chữ đó bất kể thực tế. Một đèn báo luôn xanh còn nguy hiểm hơn không có
 * đèn, vì người vận hành sẽ tin nó.
 */
export function OperationsOverview({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <History aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Hoạt động gần đây</h2>
          <p className="text-xs text-muted-foreground">Thao tác quản trị đã ghi vào nhật ký</p>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            Chưa có thao tác quản trị nào được ghi lại. Nhật ký bắt đầu từ lúc ai đó tạo, đổi
            vai trò hoặc khoá một tài khoản.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Hoạt động</th>
                  <th className="px-3 py-2 font-medium">Người thực hiện</th>
                  <th className="px-3 py-2 font-medium">Thời điểm</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr className="border-b border-border last:border-0" key={entry.id}>
                    <td className="px-3 py-2.5">
                      <StatusBadge tone={ACTION_TONES[entry.action] ?? "neutral"}>
                        {entry.summary}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{entry.actorEmail}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {dateTimeFormat.format(new Date(entry.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
