import { FileText, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Card } from "@codementor/ui";

/**
 * Bốn con số, tất cả đều đọc được từ API đang chạy.
 *
 * Không còn dòng "+12,4% so với tháng trước": muốn so sánh thì phải có số của tháng trước,
 * mà chỉ `users` mới lưu đủ mốc thời gian để tính. Một mũi tên tăng trưởng viết cứng là
 * thứ trông đáng tin nhất trên màn hình này và cũng sai nhất.
 */
export function MetricStrip({
  users,
  articles,
}: {
  users: { total: number; byRole: Record<string, number> };
  articles: Record<string, number>;
}) {
  const metrics = [
    {
      icon: Users,
      label: "Tổng người dùng",
      value: users.total,
      caption: "Hồ sơ đã đồng bộ từ Keycloak",
    },
    {
      icon: GraduationCap,
      label: "Giảng viên",
      value: users.byRole["lecturer"] ?? 0,
      caption: "Tài khoản có quyền soạn nội dung",
    },
    {
      icon: FileText,
      label: "Bài viết đã đăng",
      value: articles["published"] ?? 0,
      caption: "Đang hiển thị với người học",
    },
    {
      icon: ShieldCheck,
      label: "Chờ duyệt",
      value: articles["pending_review"] ?? 0,
      caption: "Bài viết đang nằm trong hàng chờ",
    },
  ];

  return (
    <Card className="grid grid-cols-2 overflow-hidden xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            className={`min-w-0 p-3 sm:p-4 xl:p-6 ${index % 2 === 0 ? "border-r" : "xl:border-r"} ${index < 2 ? "border-b xl:border-b-0" : ""} ${index === metrics.length - 1 ? "xl:border-r-0" : ""}`}
            key={metric.label}
          >
            <div className="mb-0.5 flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm xl:mb-1.5">
              <Icon aria-hidden="true" className="size-3.5 shrink-0 sm:size-4" strokeWidth={1.8} />
              <span className="truncate">{metric.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl xl:mt-2 xl:text-[28px]">
              {metric.value.toLocaleString("vi-VN")}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
              {metric.caption}
            </p>
          </div>
        );
      })}
    </Card>
  );
}
