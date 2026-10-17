import { LandingHeader } from "@/features/landing/landing-header";
import { LandingHero } from "@/features/landing/hero";
import { LandingTopicRail } from "@/features/landing/topic-rail";
import { LandingCategories } from "@/features/landing/categories";
import { LandingFeaturedCourses } from "@/features/landing/featured-courses";
import { LandingLearningPaths } from "@/features/landing/learning-paths";
import { LandingPractice } from "@/features/landing/practice";
import { LandingBenefits } from "@/features/landing/benefits";
import { LandingArticles } from "@/features/landing/latest-articles";
import { LandingFooter } from "@/features/landing/landing-footer";
import { loadLanding } from "@/features/landing/data";

// Chỉ dữ liệu thật từ danh mục công khai; thiếu thì section tự ẩn. Phải là literal để Next đọc được.
export const revalidate = 300;

export default async function LandingPage() {
  const data = await loadLanding();
  return (
    <div className="min-h-full bg-surface text-navy">
      <LandingHeader />
      <main>
        <LandingHero {...data} />
        <LandingTopicRail courses={data.courses} />
        <LandingCategories courses={data.courses} />
        <LandingFeaturedCourses courses={data.courses} />
        <LandingLearningPaths roadmaps={data.roadmaps} />
        <LandingPractice />
        <LandingBenefits />
        <LandingArticles articles={data.articles} />
      </main>
      <LandingFooter {...data} />
    </div>
  );
}
