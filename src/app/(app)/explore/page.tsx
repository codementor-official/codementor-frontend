import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";
import { CourseCard } from "@/components/course-card";
import { samplePaths } from "@/data/sample-courses";

export default function ExplorePage() {
  return (
    <div>
      <PageHeader
        title="Khám phá"
        subtitle="Nội dung mới đang nổi trên toàn hệ thống"
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {samplePaths.map((item) => (
          <CourseCard key={item.title} {...item} />
        ))}
      </div>
      <Placeholder label="Bộ sưu tập học tập" className="mb-5" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <Placeholder label="Bài luyện tập phổ biến" />
          <Placeholder label="Chủ đề AI đề xuất cho bạn" />
        </div>
        <Placeholder label="Cộng đồng" />
      </div>
    </div>
  );
}
