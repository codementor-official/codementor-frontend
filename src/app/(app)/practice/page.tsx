import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function PracticePage() {
  return (
    <div>
      <PageHeader
        title="Luyện tập"
        subtitle="Duyệt qua các thử thách, bộ sưu tập và bài luyện tập hàng tuần"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Placeholder label="Đã làm" />
        <Placeholder label="Tổng bài" />
        <Placeholder label="Đang thịnh hành" />
        <Placeholder label="Bộ sưu tập" />
      </div>

      <Placeholder label="Bài tập đề xuất cho bạn (AI)" className="mb-8" />

      <div className="mb-4 flex gap-6 border-b border-zinc-200 text-sm font-medium text-zinc-500">
        {["Đã làm", "Tất cả", "Thử thách", "Bộ sưu tập", "Hàng tuần"].map((t) => (
          <span key={t} className="border-b-2 border-transparent pb-3">
            {t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Placeholder key={i} label={`Bài luyện tập #${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
