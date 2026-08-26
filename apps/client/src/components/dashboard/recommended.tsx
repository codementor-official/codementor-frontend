"use client";

import { BookOpen, Code2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { ProblemRow } from "@/components/problem-row";
import { CatalogueEmpty, CatalogueError } from "@/components/ui/catalogue-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { api } from "@/lib/api";
import { exerciseDifficulty, levelToDifficulty, FIELD_LABEL } from "@/lib/catalogue/level";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import type { RecommendedItem } from "@/types/recommendation";

/** Hai chữ cái đầu — recommendation-service trả metadata xếp hạng, không trả ảnh bìa. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

/**
 * Hai khối đề xuất trên dashboard. Trước đây cả hai đọc `src/data/sample-dashboard.ts`,
 * nên ai đăng nhập cũng thấy đúng một danh sách.
 *
 * Tải phía trình duyệt như các trang duyệt nội dung: token nằm trong cookie mã hoá mà
 * server component không đọc được, còn `/api/backend/*` thì gắn hộ.
 */
export function RecommendedExercises() {
  const { items, isLoading, error } = useCatalogue<RecommendedItem>(() =>
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
  );
}

export function RecommendedCourses() {
  const { items, isLoading, error } = useCatalogue<RecommendedItem>(() =>
    api.recommendations.courses(6),
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-64 animate-pulse" />
        ))}
      </div>
    );
  }
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  );
}
