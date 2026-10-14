import type { RoadmapPricing } from "@/types/catalogue";

/**
 * Cộng giá các khóa của một lộ trình — cùng luật với `summarizePricing` ở learning-service,
 * dùng khi API chưa trả `pricing`. Khóa không có giá là khóa miễn phí.
 */
export function summarizeRoadmapPricing(
  courses: ReadonlyArray<{ priceVnd?: number; listPriceVnd?: number }>,
): RoadmapPricing {
  return courses.reduce<RoadmapPricing>(
    (sum, course) => {
      const price = course.priceVnd ?? 0;
      return {
        totalVnd: sum.totalVnd + price,
        listTotalVnd: sum.listTotalVnd + (course.listPriceVnd ?? price),
        paidCourses: sum.paidCourses + (price > 0 ? 1 : 0),
        freeCourses: sum.freeCourses + (price > 0 ? 0 : 1),
      };
    },
    { totalVnd: 0, listTotalVnd: 0, paidCourses: 0, freeCourses: 0 },
  );
}
