import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function ProgressPage() {
  return (
    <div>
      <PageHeader title="Tiến độ" subtitle="Lịch sử luyện tập của riêng bạn trên toàn bộ chủ đề" />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Placeholder key={i} label={`Chỉ số #${i + 1}`} />
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Placeholder label="Tiến độ theo chủ đề" className="flex-[1.4]" />
        <div className="flex flex-1 flex-col gap-4">
          <Placeholder label="AI gợi ý ôn tập" />
          <Placeholder label="Mức độ hoạt động (12 tuần)" />
        </div>
      </div>
    </div>
  );
}
