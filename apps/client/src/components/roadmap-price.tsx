import { CoursePrice } from "@codementor/ui";
import type { RoadmapPricing } from "@/types/catalogue";

/**
 * Giá của cả lộ trình: tổng các khóa, giá gạch là tổng niêm yết khi đang có khuyến mãi, và
 * số khóa trả phí/miễn phí để người xem hiểu con số ấy gồm những gì.
 */
export function RoadmapPrice({ pricing, className = "" }: { pricing: RoadmapPricing; className?: string }) {
  const courses = pricing.paidCourses + pricing.freeCourses;
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      {pricing.totalVnd > 0 && <span className="text-text-faint">Trọn lộ trình</span>}
      <CoursePrice priceVnd={pricing.totalVnd} listPriceVnd={pricing.listTotalVnd} />
      {pricing.paidCourses > 0 && pricing.freeCourses > 0 && (
        <span className="text-2xs text-text-faint">
          {pricing.paidCourses}/{courses} khóa trả phí
        </span>
      )}
    </span>
  );
}
