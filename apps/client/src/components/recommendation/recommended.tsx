"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Code2, Map as MapIcon } from "lucide-react";
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
