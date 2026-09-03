"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Code2, Map as MapIcon, Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { EntityCard } from "@/components/entity-card";
import { ProblemRow } from "@/components/problem-row";
import { CatalogueEmpty, CatalogueError } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { exerciseDifficulty, levelToDifficulty, FIELD_LABEL } from "@/lib/catalogue/level";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { MAX_PAGE_SIZE, type CourseSummary } from "@/types/catalogue";
import type { RecommendationList, RecommendedItem } from "@/types/recommendation";
import { usePersonalized } from "./use-personalized";

/** Hai chữ cái đầu — recommendation-service trả metadata xếp hạng, không trả ảnh bìa. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

interface RecommendationState {
  items: RecommendedItem[];
  /** `false`: danh sách xếp theo mức phổ biến, không dùng gì trong hồ sơ học tập. */
  personalized: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Như `useCatalogue`, nhưng giữ lại cờ `personalized` — thứ phân biệt "đề xuất cho bạn"
 * với "đang phổ biến", và là thứ duy nhất trên màn hình nói cho học viên biết họ đang xem
 * cái nào.
 */
function useRecommendations(load: () => Promise<RecommendationList>): RecommendationState {
  const [state, setState] = useState<RecommendationState>({
    items: [],
    personalized: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((result) => {
        if (cancelled) return;
        setState({
          items: result.items ?? [],
          personalized: result.personalized,
          isLoading: false,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const message =
          cause instanceof Error ? cause.message : "Không tải được đề xuất từ máy chủ.";
        setState({ items: [], personalized: false, isLoading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
    // `load` là closure mới mỗi lần render ở nơi gọi, phụ thuộc vào nó là tải lại vô hạn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/**
 * Nói thẳng khi danh sách KHÔNG được cá nhân hóa, thay vì để tiêu đề "đề xuất cho bạn" hứa
 * một điều không đúng. Xảy ra khi học viên chưa làm khảo sát, hoặc đã tự tắt gợi ý thích ứng.
 */
function PopularNotice() {
  return (
    <p className="mb-3 text-2xs text-text-faint">
      Đang xếp theo mức phổ biến chung.{" "}
      <Link href="/profile?tab=personalization" className="font-semibold text-primary hover:underline">
        Hoàn tất hồ sơ học tập
      </Link>{" "}
      để nhận đề xuất theo mục tiêu của bạn.
    </p>
  );
}

/**
 * Khung chung của một dải đề xuất: tiêu đề, lời nhắc khi chưa cá nhân hóa, phần thân.
 *
 * Tiêu đề phải nằm TRONG component chứ không ở nơi gọi, vì chữ đúng phụ thuộc vào cờ
 * `personalized` mà chỉ ở đây mới biết — "dành cho bạn" khi có hồ sơ, "phổ biến" khi không.
 * Để nơi gọi tự viết tiêu đề là để nó hứa một điều nó không kiểm chứng được.
 */
function RecommendationFrame({
  icon: Icon,
  title,
  personalized,
  children,
}: {
  icon: typeof Code2;
  title: string;
  personalized: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-navy">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      {!personalized && <PopularNotice />}
      {children}
    </section>
  );
}

/**
 * Ba khối đề xuất. Trước đây dashboard đọc `src/data/sample-dashboard.ts`, nên ai đăng
 * nhập cũng thấy đúng một danh sách.
 *
 * Tải phía trình duyệt như các trang duyệt nội dung: token nằm trong cookie mã hoá mà
 * server component không đọc được, còn `/api/backend/*` thì gắn hộ.
 *
 * Rỗng thì biến mất hoàn toàn thay vì hiện khung "chưa có gì": cả ba đứng ĐẦU một trang
 * danh mục vốn đã có trạng thái rỗng riêng, nên hai khung rỗng chồng lên nhau chỉ nói một
 * chuyện hai lần. Lỗi thì vẫn hiện — một route trả 404 vì service chạy bản dist cũ trông y
 * hệt "chưa có gì để đề xuất" nếu nuốt mất.
 */
export function RecommendedExercises({
  limit = 5,
  title,
}: {
  limit?: number;
  title?: string;
} = {}) {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.exercises(limit),
  );

  if (isLoading) return <Card className="h-52 animate-pulse" />;
  if (error) return <CatalogueError message={error} />;
  if (items.length === 0) return null;

  return (
    <RecommendationFrame
      icon={Code2}
      title={title ?? (personalized ? "Bài luyện tập dành cho bạn" : "Bài luyện tập phổ biến")}
      personalized={personalized}
    >
      <Card className="overflow-hidden">
        {items.map((item, i) => (
          <ProblemRow
            key={item.id}
            tile={tileFor(item.title)}
            tileVariant={i % 2 === 0 ? "primary" : "navy"}
            title={item.title}
            meta={item.reasons[0] ?? "Gợi ý cho bạn"}
            difficulty={exerciseDifficulty(item.difficulty ?? "easy")}
            href={`/solve/${item.id}`}
          />
        ))}
      </Card>
    </RecommendationFrame>
  );
}

/**
 * Khóa học đề xuất. `recommendation-service` chỉ xếp hạng — nó không mang mô tả, tác giả
 * hay số chương/bài. Nên lấy thứ tự từ nó rồi hỏi danh mục đúng những id đó, và vẽ bằng
 * `CourseCard` như mọi lưới khóa học khác: một loại thẻ, một bộ thông tin.
 */
export function RecommendedCourses({
  excludeId,
  limit = 6,
  title,
}: {
  /** Khóa học đang mở trang chi tiết của nó — service không tự loại khóa chưa ghi danh. */
  excludeId?: string;
  limit?: number;
  title?: string;
} = {}) {
  const { items, personalized, isLoading, error } = usePersonalized<CourseSummary>(
    () => api.recommendations.courses(limit),
    () => api.courses.catalogue({ limit: MAX_PAGE_SIZE }),
  );

  if (isLoading) return <CardGridSkeleton />;
  if (error) return <CatalogueError message={error} />;

  const visible = items.filter(({ item }) => item.id !== excludeId).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <RecommendationFrame
      icon={BookOpen}
      title={title ?? (personalized ? "Khóa học dành cho bạn" : "Khóa học phổ biến")}
      personalized={personalized}
    >
      <div className={GRID}>
        {visible.map(({ item: course, reason }, i) => (
          <CourseCard
            key={course.id}
            course={course}
            tileVariant={i % 2 === 0 ? "navy" : "primary"}
            note={reason}
          />
        ))}
      </div>
    </RecommendationFrame>
  );
}

/**
 * Đề xuất lộ trình. `excludeId` bỏ lộ trình học viên đang đứng trên trang của nó: service
 * chỉ loại những lộ trình đã ghi danh, nên trang chi tiết của một lộ trình chưa ghi danh
 * sẽ tự đề xuất chính nó.
 */
export function RecommendedRoadmaps({
  excludeId,
  limit = 6,
  title,
}: {
  excludeId?: string;
  limit?: number;
  title?: string;
} = {}) {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.roadmaps(limit),
  );

  if (isLoading) return <CardGridSkeleton />;
  if (error) return <CatalogueError message={error} />;

  const visible = items.filter((item) => item.id !== excludeId).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <RecommendationFrame
      icon={MapIcon}
      title={title ?? (personalized ? "Lộ trình dành cho bạn" : "Lộ trình phổ biến")}
      personalized={personalized}
    >
      <div className={GRID}>
        {visible.map((roadmap) => (
          <EntityCard
            key={roadmap.id}
            tile={tileFor(roadmap.title)}
            tileHeight="lg"
            coverImage={placeholderCoverUrl(roadmap.slug)}
            kind={{ icon: MapIcon, label: FIELD_LABEL[roadmap.field ?? ""] ?? "Lộ trình" }}
            title={roadmap.title}
            description=""
            difficulty={levelToDifficulty(roadmap.level ?? "basic")}
            tags={roadmap.technologies.slice(0, 3)}
            note={roadmap.reasons[0]}
            href={`/roadmaps/${roadmap.id}`}
          />
        ))}
      </div>
    </RecommendationFrame>
  );
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

function CardGridSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="h-64 animate-pulse" />
      ))}
    </div>
  );
}

/**
 * Bài viết đề xuất, dạng danh sách hẹp cho cột phải trang `/articles`.
 *
 * Không dùng `EntityCard`: cột đó rộng chưa tới 300px và bài viết không có ảnh bìa, lĩnh
 * vực hay trình độ để lấp một thẻ lớn. Tiêu đề + chủ đề + lý do là tất cả những gì service
 * trả về, và cũng là tất cả những gì cần để người đọc quyết định có bấm hay không.
 *
 * `relatedTo` đổi sang đường "bài liên quan": cùng cách hiển thị, khác ở chỗ service bỏ
 * bài đang đọc và đẩy bài cùng chủ đề lên trước. Cùng một danh sách nên dùng chung một
 * component — tách đôi chỉ để đổi một lời gọi API là thêm một file phải sửa hai lần.
 */
export function RecommendedArticles({
  limit = 5,
  relatedTo,
}: {
  limit?: number;
  /** Id bài đang đọc. Có thì lấy bài liên quan, không thì lấy đề xuất chung. */
  relatedTo?: string;
}) {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    relatedTo
      ? api.recommendations.relatedArticles(relatedTo, limit)
      : api.recommendations.articles(limit),
  );

  // Báo lỗi như ba khối đề xuất kia. Từng nuốt lỗi ở đây cho "gọn", và một route backend
  // trả 404 vì service chạy bản dist cũ trông y hệt "chưa có gì để đề xuất" — không nhìn
  // ra được từ màn hình, chỉ tìm ra bằng cách curl thẳng vào cổng service.
  if (error) return <CatalogueError message={error} />;
  if (isLoading) return <Card className="h-48 animate-pulse" />;
  if (items.length === 0) {
    return (
      <CatalogueEmpty
        icon={Newspaper}
        title={relatedTo ? "Chưa có bài viết liên quan" : "Chưa có bài viết nào để đề xuất"}
        description="Chưa có bài viết nào khác được công khai."
      />
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-navy">
        {relatedTo
          ? "Bài viết liên quan"
          : personalized
            ? "Bài viết dành cho bạn"
            : "Bài viết được lưu nhiều"}
      </h2>
      <Card className="divide-y divide-border-soft">
        {items.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-bg"
          >
            <span className="line-clamp-2 text-sm font-semibold text-navy">{article.title}</span>
            <span className="text-2xs text-text-faint">
              {article.tags[0] ? `${article.tags[0]} · ` : ""}
              {article.reasons[0] ?? "Gợi ý cho bạn"}
            </span>
          </Link>
        ))}
      </Card>
    </section>
  );
}
