"use client";

import Link from "next/link";
import { Button, StatusPage, buttonClassName } from "@codementor/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusPage
      code="Lỗi"
      title="Trang gặp sự cố"
      description="Đã có lỗi khi hiển thị trang này. Thử tải lại; nếu vẫn lỗi, quay về trang chính."
    >
      <Button onClick={reset}>Thử lại</Button>
      <Link className={buttonClassName("outline")} href="/dashboard">
        Về trang chính
      </Link>
    </StatusPage>
  );
}
