import { CourseCard } from "@/components/course-card";
import type { CourseSummary } from "@/types/catalogue";
import { LandingSection } from "./section";

const FEATURED = 8;

export function LandingFeaturedCourses({ courses }: { courses: CourseSummary[] }) {
  if (courses.length === 0) return null;
  return (
    <LandingSection
      id="courses"
      eyebrow="Khóa học"
      title="Khóa học đang mở"
      description="Giá, số bài và thời lượng lấy trực tiếp từ danh mục — đúng như bạn sẽ thấy khi mở khóa học."
      action={{ label: `Xem tất cả ${courses.length} khóa học`, href: "/courses" }}
      tone="muted"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.slice(0, FEATURED).map((course, index) => (
          // Trên điện thoại chỉ 4 thẻ: 8 thẻ một cột dài quá vài màn hình, còn link "Xem tất cả" ngay trên.
          <div key={course.id} className={index >= 4 ? "max-sm:hidden" : undefined}>
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
