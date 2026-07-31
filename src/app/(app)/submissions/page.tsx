import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function SubmissionsPage() {
  return (
    <div>
      <PageHeader
        title="Bài đã nộp"
        subtitle="Mọi lượt chạy bạn đã nộp, kèm trạng thái và thời gian"
      />

      <div className="mb-4 flex gap-6 border-b border-zinc-200 text-sm font-medium text-zinc-500">
        {["Tất cả", "Đạt", "Không đạt"].map((t) => (
          <span key={t} className="border-b-2 border-transparent pb-3">
            {t}
          </span>
        ))}
      </div>

      <Placeholder label="Bảng danh sách bài đã nộp" className="min-h-60" />
    </div>
  );
}
