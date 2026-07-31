import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function ExplorePage() {
  return (
    <div>
      <PageHeader
        title="Khám phá"
        subtitle="Nội dung mới đang nổi trên toàn hệ thống"
      />

      <Placeholder label="Khóa học đang nổi" className="mb-8" />
      <Placeholder label="Bộ sưu tập học tập" className="mb-8" />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Placeholder label="Bài luyện tập phổ biến" />
          <Placeholder label="Chủ đề AI đề xuất cho bạn" />
        </div>
        <Placeholder label="Cộng đồng" />
      </div>
    </div>
  );
}
