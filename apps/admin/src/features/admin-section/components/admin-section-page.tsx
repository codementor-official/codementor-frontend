import { Database } from "lucide-react";
import { Card } from "@codementor/ui";
import type { AdminSectionDefinition } from "@/features/admin-section/data/admin-sections";

/**
 * Khung cho các mục chưa nối API.
 *
 * Không vẽ ô tìm kiếm và nút lọc giả nữa: chúng bấm vào không làm gì, mà một điều khiển
 * bấm không phản hồi khiến người dùng tưởng hệ thống hỏng chứ không tưởng là chưa làm.
 */
export function AdminSectionPage({ section }: { section: AdminSectionDefinition }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {section.eyebrow}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{section.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{section.description}</p>
      </div>

      <Card className="flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
          <Database aria-hidden="true" className="size-5 text-muted-foreground" />
        </span>
        <h2 className="mt-4 text-sm font-semibold">Mục này chưa nối dữ liệu</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Đường dẫn đã dùng chung khung quản trị, còn bảng và thao tác thì chờ API tương ứng.
          Mọi số liệu sẽ chỉ xuất hiện sau khi có nguồn thật.
        </p>
      </Card>
    </div>
  );
}
