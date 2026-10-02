"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { FilterBar, Select, SegmentedTabs, StatStrip } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { CourseCard } from "@/components/course-card";
import { RecommendedCourses } from "@/components/recommendation/recommended";
import { Pagination } from "@/components/ui/pagination";
import {
  CatalogueEmpty,
  CatalogueError,
  CatalogueSkeleton,
} from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useMyCourses } from "@/hooks/use-my-courses";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { LEVEL_OPTIONS } from "@/lib/catalogue/level";
import { MAX_PAGE_SIZE, type CourseSummary } from "@/types/catalogue";
import type { CatalogueTopicSummary } from "@/types/catalogue";
import { TopicFilter } from "@/features/practice/components/topic-filter";

const TILE_TONE = ["navy", "primary"] as const;
/**
 * Hai hàng đầy ở màn hình rộng (lưới 4 cột). Đặt 20 thì với catalogue cỡ hiện tại mọi thứ
 * lọt hết vào một trang, và thanh phân trang — vốn tự ẩn khi chỉ có một trang — không bao
 * giờ xuất hiện.
 */
const PAGE_SIZE = 8;

export default function CoursesPage() {
  const { status: authStatus } = useAuth();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [promotion, setPromotion] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [topics, setTopics] = useState<CatalogueTopicSummary[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const mine = useMyCourses(authStatus === "authenticated");

  // The catalogue endpoint already returns only published, public content, so this fetches
  // once and filters in the browser. Move the filters into the query when the list is long
  // enough that shipping it all is the wrong trade.
  const { items, isLoading, error } = useCatalogue<CourseSummary>(() =>
    api.courses.catalogue({ limit: MAX_PAGE_SIZE }),
  );

  useEffect(() => {
    let active = true;
    void api.courses.topics()
      .then((result) => active && setTopics(result))
      .catch(() => active && setTopicsError("Không tải được chủ đề khóa học."))
      .finally(() => active && setTopicsLoading(false));
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items
      .filter((c) => level === "all" || c.level === level)
      .filter((c) => {
        const price = c.priceVnd ?? 0;
        if (priceRange === "free") return price === 0;
        if (priceRange === "under_100") return price > 0 && price < 100_000;
        if (priceRange === "100_200") return price >= 100_000 && price <= 200_000;
        if (priceRange === "over_200") return price > 200_000;
        return true;
      })
      .filter((c) => {
        if (promotion === "discounted") return (c.discountPercent ?? 0) > 0;
        if (promotion === "regular") return (c.priceVnd ?? 0) > 0 && !(c.discountPercent ?? 0);
        return true;
      })
      .filter((c) => selectedTopicIds.length === 0 || (c.topics ?? []).some((topic) => selectedTopicIds.includes(topic.id)))
      .filter((c) => !query || `${c.title} ${c.slug} ${c.authorName ?? ""} ${(c.topics ?? []).map((topic) => topic.name).join(" ")}`.toLowerCase().includes(query));
    return [...filtered].sort((a, b) => {
      if (sort === "price_low") return (a.priceVnd ?? 0) - (b.priceVnd ?? 0);
      if (sort === "price_high") return (b.priceVnd ?? 0) - (a.priceVnd ?? 0);
      if (sort === "discount") return (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
      if (sort === "newest") return b.id.localeCompare(a.id);
      return 0;
    });
  }, [items, search, level, priceRange, promotion, selectedTopicIds, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Only the cards on screen: enrolment is one request per course. Used for the "Hoàn thành"
  // badge and to hide the price of courses the viewer already owns — enrol/resume moved to
  // the course detail page.
  const { byCourse, owned } = useCourseProgress(
    paginated.map((c) => c.id),
    authStatus === "authenticated",
  );

  const published = items.filter((c) => c.status === "published").length;
  const totalLessons = items.reduce((sum, c) => sum + (c.totalLessons ?? 0), 0);
  const discounted = items.filter((c) => (c.discountPercent ?? 0) > 0).length;

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Khóa học"
        subtitle="Toàn bộ khóa học đã công khai trên hệ thống. Học lẻ từng khóa hoặc theo thứ tự của một lộ trình."
      />

      {authStatus === "authenticated" && (
        <SegmentedTabs
          className="mb-5"
          value={tab}
          onChange={(v) => setTab(v as "all" | "mine")}
          options={[
            { value: "all", label: "Tất cả khóa học" },
            { value: "mine", label: "Đã đăng ký của tôi", count: mine.items.length },
          ]}
        />
      )}

      {tab === "mine" ? (
        mine.isLoading ? (
          <CatalogueSkeleton />
        ) : mine.error ? (
          <CatalogueError message={mine.error} />
        ) : mine.items.length === 0 ? (
          <CatalogueEmpty
            icon={BookOpen}
            title="Bạn chưa đăng ký khóa học nào"
            description="Chuyển sang tab &quot;Tất cả khóa học&quot; và bấm Đăng ký học để bắt đầu."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mine.items.map((course, index) => (
              <li key={course.id}>
                <CourseCard
                  course={{ ...course, id: course.courseId }}
                  tileVariant={TILE_TONE[index % TILE_TONE.length]}
                  state={course.progressPercent >= 100 ? "completed" : undefined}
                  progressPercent={course.progressPercent}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <>

          <StatStrip
            className="mb-5"
            stats={[
              { label: "Khóa học", value: items.length },
              { label: "Đã công khai", value: published },
              { label: "Đang ưu đãi", value: discounted },
              { label: "Bài học", value: totalLessons },
            ]}
          />

          <FilterBar
            className="mb-5"
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Tìm khóa học theo tên, slug, tác giả..."
            activeFilterCount={Number(level !== "all") + Number(priceRange !== "all") + Number(promotion !== "all") + Number(sort !== "recommended") + selectedTopicIds.length}
            onClearFilters={() => {
              setLevel("all");
              setPriceRange("all");
              setPromotion("all");
              setSort("recommended");
              setSelectedTopicIds([]);
              setPage(1);
            }}
            sheetTitle="Lọc khóa học"
            controls={
              <>
              <Select
                label="Trình độ"
                value={level}
                options={LEVEL_OPTIONS}
                onChange={(v) => {
                  setLevel(v);
                  setPage(1);
                }}
              />
              <Select
                label="Khoảng giá"
                value={priceRange}
                options={[
                  { value: "all", label: "Mọi mức giá" },
                  { value: "free", label: "Miễn phí" },
                  { value: "under_100", label: "Dưới 100.000 ₫" },
                  { value: "100_200", label: "100.000 ₫ – 200.000 ₫" },
                  { value: "over_200", label: "Trên 200.000 ₫" },
                ]}
                onChange={(value) => { setPriceRange(value); setPage(1); }}
              />
              <Select
                label="Ưu đãi"
                value={promotion}
                options={[
                  { value: "all", label: "Tất cả khóa học" },
                  { value: "discounted", label: "Đang khuyến mãi" },
                  { value: "regular", label: "Giá thông thường" },
                ]}
                onChange={(value) => { setPromotion(value); setPage(1); }}
              />
              <Select
                label="Sắp xếp"
                value={sort}
                options={[
                  { value: "recommended", label: "Đề xuất" },
                  { value: "discount", label: "Giảm nhiều nhất" },
                  { value: "price_low", label: "Giá thấp đến cao" },
                  { value: "price_high", label: "Giá cao đến thấp" },
                  { value: "newest", label: "Mới nhất" },
                ]}
                onChange={(value) => { setSort(value); setPage(1); }}
              />
              </>
            }
          />

          <div className="mb-5">
            <TopicFilter
              standalone
              label="Lọc chủ đề khóa học"
              topics={topics}
              selectedIds={selectedTopicIds}
              loading={topicsLoading}
              error={topicsError}
              onChange={(ids) => { setSelectedTopicIds(ids); setPage(1); }}
              onClear={() => { setSelectedTopicIds([]); setPage(1); }}
            />
          </div>

          {!search.trim() && level === "all" && priceRange === "all" && promotion === "all" && sort === "recommended" && selectedTopicIds.length === 0 && currentPage === 1 && <section className="mb-6" aria-label="Khóa học đề xuất">
            <RecommendedCourses />
          </section>}

          {isLoading ? (
            <CatalogueSkeleton />
          ) : error ? (
            <CatalogueError message={error} />
          ) : visible.length === 0 ? (
            <CatalogueEmpty
              icon={BookOpen}
              title={items.length === 0 ? "Chưa có khóa học nào được công khai" : "Không có khóa học nào khớp"}
              description={
                items.length === 0
                  ? "Khóa học xuất hiện ở đây sau khi giảng viên soạn và được duyệt công khai."
                  : "Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
              }
            />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginated.map((course, index) => {
                  const enrollment = byCourse[course.id]?.enrollment ?? null;
                  const enrolled = enrollment !== null && enrollment.status !== "dropped";
                  return (
                    <li key={course.id}>
                      <CourseCard
                        course={course}
                        tags={(course.topics ?? []).slice(0, 3).map((topic) => topic.name)}
                        tileVariant={TILE_TONE[index % TILE_TONE.length]}
                        state={
                          enrolled && enrollment.progressPercent >= 100 ? "completed" : undefined
                        }
                        progressPercent={enrolled ? enrollment.progressPercent : undefined}
                        owned={enrolled && owned[course.id]}
                      />
                    </li>
                  );
                })}
              </ul>
              <Pagination
                label="Phân trang khóa học"
                page={currentPage}
                pageCount={pageCount}
                onChange={setPage}
                className="mt-6"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
