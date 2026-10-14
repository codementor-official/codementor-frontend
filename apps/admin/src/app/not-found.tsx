import Link from "next/link";
import { StatusPage, buttonClassName } from "@codementor/ui";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại, hoặc nội dung đã bị gỡ."
    >
      <Link className={buttonClassName()} href="/dashboard">
        Về trang chính
      </Link>
    </StatusPage>
  );
}
