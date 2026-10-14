"use client";

import { StatusPage } from "@codementor/ui";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusPage
      code="Lỗi"
      title="Trang gặp sự cố"
      description="Đã có lỗi khi hiển thị trang này. Thử tải lại; nếu vẫn lỗi, quay về trang chính."
    >
      <Button onClick={reset}>Thử lại</Button>
      <Button href="/" variant="outline">
        Về trang chính
      </Button>
    </StatusPage>
  );
}
