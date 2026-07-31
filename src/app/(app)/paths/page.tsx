import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { samplePaths } from "@/data/sample-courses";

export default function PathsPage() {
  const inProgress = samplePaths.filter((p) => typeof p.progress === "number");
  const avgProgress = inProgress.length
    ? Math.round(inProgress.reduce((t, p) => t + (p.progress ?? 0), 0) / inProgress.length)
    : 0;

  const stats = [
    { label: "Tổng số lộ trình", value: String(samplePaths.length), sub: "Từ cơ bản đến nâng cao" },
    { label: "Đang học dở", value: String(inProgress.length), sub: "Lộ trình có tiến độ" },
    { label: "Trung bình hoàn thành", value: `${avgProgress}%`, sub: "Trên các lộ trình đang học" },
  ];

  return (
    <div>
      <PageHeader
        title="Lộ trình học"
        subtitle="Chuỗi mô-đun có cấu trúc cho chương trình lập trình cốt lõi"
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((w) => (
          <Card key={w.label} className="p-4">
            <div className="mb-2 text-xs font-medium text-text-muted">{w.label}</div>
            <div className="mb-1 text-xl font-bold text-navy">{w.value}</div>
            <div className="text-xs text-text-faint">{w.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {samplePaths.map((item) => (
          <CourseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
