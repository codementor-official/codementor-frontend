import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin Dashboard — Kiểm duyệt tài liệu"
        subtitle="Tài liệu người dùng tải lên được AI Agent phân tích trước"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Placeholder key={i} label={`Chỉ số #${i + 1}`} />
        ))}
      </div>

      <div className="mb-6 flex gap-6 border-b border-zinc-200 text-sm font-medium text-zinc-500">
        {["Chờ kiểm duyệt", "Lịch sử kiểm duyệt"].map((t) => (
          <span key={t} className="border-b-2 border-transparent pb-3">
            {t}
          </span>
        ))}
      </div>

      <div className="flex gap-5">
        <Placeholder label="Hàng đợi kiểm duyệt" className="flex-1" />
        <Placeholder label="Chi tiết & phân tích AI" className="flex-1" />
      </div>
    </div>
  );
}
