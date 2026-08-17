"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

/**
 * Cổng vào cho những trang chỉ dành cho người đã đăng nhập.
 *
 * Trước đây không có cổng nào: mọi trang trong nhóm `(app)` đều mở, nên khi phiên hết
 * hạn giữa chừng người dùng vẫn ở nguyên trang cũ và chỉ thấy từng ô dữ liệu báo lỗi
 * 401 — không có gì nói cho họ biết là đã bị đăng xuất, cũng không có đường quay lại.
 *
 * Ba trạng thái, ba cách xử lý khác nhau, và phân biệt được chúng mới là phần quan
 * trọng: `loading` KHÔNG được coi là chưa đăng nhập. Phiên bằng cookie chỉ xác định
 * được sau một vòng gọi `/api/auth/session`, nên nếu đá người dùng ra ngay lúc đó thì
 * mỗi lần tải lại trang đều văng về /login rồi mới quay lại — đúng thứ người dùng đọc
 * thành "app tự đăng xuất".
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "anonymous") return;
    // Mang theo chỗ định tới để đăng nhập xong quay lại đúng đó, thay vì luôn về
    // /practice và bắt người dùng tự tìm lại trang mình đang đọc dở.
    const here = pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [status, pathname, router]);

  if (status === "authenticated") return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {status === "loading" ? "Đang kiểm tra phiên đăng nhập..." : "Đang chuyển tới trang đăng nhập..."}
    </div>
  );
}
