import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";
import { CourseCard } from "@/components/course-card";
import { samplePaths } from "@/data/sample-courses";

export default function PathsPage() {
  return (
    <div>
      <PageHeader
        title="Lộ trình học"
        subtitle="Chuỗi mô-đun có cấu trúc cho chương trình lập trình cốt lõi"
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Placeholder label="Tổng số lộ trình" />
        <Placeholder label="Đang học dở" />
        <Placeholder label="Trung bình hoàn thành" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {samplePaths.map((item) => (
          <CourseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
