"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Code2, Map as MapIcon, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { EntityCard } from "@/components/entity-card";
import { ProblemRow } from "@/components/problem-row";
import { CatalogueEmpty, CatalogueError } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { exerciseDifficulty, levelToDifficulty, FIELD_LABEL } from "@/lib/catalogue/level";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { RecommendationList, RecommendedItem } from "@/types/recommendation";

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
 * Ba khối đề xuất. Trước đây dashboard đọc `src/data/sample-dashboard.ts`, nên ai đăng
 * nhập cũng thấy đúng một danh sách.
 *
 * Tải phía trình duyệt như các trang duyệt nội dung: token nằm trong cookie mã hoá mà
 * server component không đọc được, còn `/api/backend/*` thì gắn hộ.
 */
export function RecommendedExercises() {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.exercises(5),
  );

  if (isLoading) return <Card className="h-52 animate-pulse" />;
  if (error) return <CatalogueError message={error} />;
  if (items.length === 0) {
    return (
      <CatalogueEmpty
        icon={Code2}
        title="Chưa có bài luyện tập nào để đề xuất"
        description="Ngân hàng bài tập chưa có bài nào công khai."
      />
    );
  }

  return (
    <>
      {!personalized && <PopularNotice />}
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
    </>
  );
}

export function RecommendedCourses() {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.courses(6),
  );

  if (isLoading) return <CardGridSkeleton />;
  if (error) return <CatalogueError message={error} />;
  if (items.length === 0) {
    return (
      <CatalogueEmpty
        icon={BookOpen}
        title="Chưa có khóa học nào để đề xuất"
        description="Chưa có khóa học nào được xuất bản."
      />
    );
  }

  return (
    <>
      {!personalized && <PopularNotice />}
      <div className={GRID}>
        {items.map((course, i) => (
          <CourseCard
            key={course.id}
            tile={tileFor(course.title)}
            tileVariant={i % 2 === 0 ? "navy" : "primary"}
            coverImage={placeholderCoverUrl(course.slug)}
            title={course.title}
            desc={FIELD_LABEL[course.field ?? ""] ?? "Khóa học"}
            difficulty={levelToDifficulty(course.level ?? "basic")}
            tags={course.technologies.slice(0, 3)}
            note={course.reasons[0]}
            href={`/courses/${course.id}`}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Đề xuất lộ trình. `excludeId` bỏ lộ trình học viên đang đứng trên trang của nó: service
 * chỉ loại những lộ trình đã ghi danh, nên trang chi tiết của một lộ trình chưa ghi danh
 * sẽ tự đề xuất chính nó.
 */
export function RecommendedRoadmaps({ excludeId }: { excludeId?: string }) {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.roadmaps(6),
  );

  if (isLoading) return <CardGridSkeleton />;
  if (error) return <CatalogueError message={error} />;

  const visible = items.filter((item) => item.id !== excludeId).slice(0, 3);
  if (visible.length === 0) {
    return (
      <CatalogueEmpty
        icon={MapIcon}
        title="Chưa có lộ trình nào khác để đề xuất"
        description="Bạn đã ghi danh mọi lộ trình đã xuất bản."
      />
    );
  }

  return (
    <>
      {!personalized && <PopularNotice />}
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
    </>
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

  // Cột phụ: hỏng thì im lặng bỏ qua, không đẩy một khối báo lỗi vào chỗ vốn chỉ là gợi ý.
  if (error) return null;
  if (isLoading) return <Card className="h-48 animate-pulse" />;
  if (items.length === 0) return null;

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

/**
 * Nhóm học tập đề xuất. Chỉ nhóm công khai chưa tham gia — service lọc sẵn, ở đây không
 * lọc lại.
 *
 * `popularity` là mức 0..100 so với chính các nhóm trong danh sách này, không phải số
 * thành viên: hiện "40 thành viên" mà không biết nhóm khác bao nhiêu thì con số đó không
 * nói lên điều gì.
 */
export function RecommendedGroups({ limit = 3 }: { limit?: number }) {
  const { items, personalized, isLoading, error } = useRecommendations(() =>
    api.recommendations.groups(limit),
  );

  if (error) return null;
  if (isLoading) return <CardGridSkeleton />;
  if (items.length === 0) {
    return (
      <CatalogueEmpty
        icon={Users}
        title="Chưa có nhóm nào để đề xuất"
        description="Bạn đã tham gia mọi nhóm công khai đang hoạt động."
      />
    );
  }

  return (
    <>
      {!personalized && <PopularNotice />}
      <div className={GRID}>
        {items.map((group, i) => (
          <EntityCard
            key={group.id}
            tile={tileFor(group.title)}
            tileVariant={i % 2 === 0 ? "primary" : "ink"}
            coverImage={placeholderCoverUrl(group.slug)}
            kind={{ icon: Users, label: group.tags[0] ?? "Nhóm học tập" }}
            title={group.title}
            description=""
            note={group.reasons[0]}
            progress={group.popularity}
            footer={
              <span className="text-2xs text-text-faint">Mức sôi động so với nhóm khác</span>
            }
            href={`/workspace/${group.slug}`}
          />
        ))}
      </div>
    </>
  );
}
