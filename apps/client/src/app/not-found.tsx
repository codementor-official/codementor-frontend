import { StatusPage } from "@codementor/ui";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại, hoặc nội dung đã bị gỡ."
    >
      <Button href="/">Về trang chính</Button>
    </StatusPage>
  );
}
