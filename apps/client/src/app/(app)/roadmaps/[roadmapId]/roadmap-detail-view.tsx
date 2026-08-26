"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Map as MapIcon, User } from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EntityCard } from "@/components/entity-card";
import { RecommendedRoadmaps } from "@/components/recommendation/recommended";
import { api } from "@/lib/api";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
import { levelToDifficulty } from "@/lib/catalogue/level";
import type { CourseDetail, RoadmapDetail } from "@/types/catalogue";

/** Two initials from the title — the backend sends no thumbnail for a course. */
function tileFor(title: string): string {
  const words = title.trim().split(/\s+/);
  return (words[0]?.[0] ?? "?").concat(words[1]?.[0] ?? "").toUpperCase();
}

const LEVEL_LABEL: Record<string, string> = {
  none: "Chưa có nền",
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  experienced: "Nâng cao",
};

const FIELD_LABEL: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",
  data_ai: "Data & AI",
  foundation: "Nền tảng",
};

export function RoadmapDetailView({ roadmapId }: { roadmapId: string }) {
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Chi tiết từng khóa — thumbnail, tác giả, mô tả — không nằm trong payload lộ trình
  // (`RoadmapDetail.courses` chỉ có id/vị trí/tiêu đề/thời lượng), nên tải thêm cho mỗi
  // khóa. `allSettled`: một khóa bị gỡ hay lỗi tải không được kéo sập cả danh sách.
  const [courseDetails, setCourseDetails] = useState<Map<string, CourseDetail>>(new Map());

  useEffect(() => {
    let cancelled = false;
    api.roadmaps
      .detail(roadmapId)
      .then((data) => !cancelled && setRoadmap(data))
      .catch((cause: unknown) =>
        !cancelled && setError(cause instanceof Error ? cause.message : "Không tải được lộ trình"),
      );
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  useEffect(() => {
    if (!roadmap) return;
    let cancelled = false;
    Promise.allSettled(roadmap.courses.map((course) => api.courses.detail(course.courseId))).then(
      (results) => {
        if (cancelled) return;
        const byId = new Map<string, CourseDetail>();
        results.forEach((result) => {
          if (result.status === "fulfilled") byId.set(result.value.id, result.value);
        });
        setCourseDetails(byId);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [roadmap]);

  if (error) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-sm font-semibold text-navy">Không mở được lộ trình này</p>
        <p className="mt-1 text-xs text-text-muted">{error}</p>
        <Link href="/roadmaps" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          Quay lại danh sách lộ trình
        </Link>
      </Card>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex items-center gap-2 p-10 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lộ trình...
      </div>
    );
  }

  // The service sends them ordered, but the order is the whole point of a roadmap —
  // rendering it wrong would teach the wrong sequence, so sort rather than assume.
  const courses = [...roadmap.courses].sort((a, b) => a.position - b.position);

  return (
    <div>
      <BreadcrumbTitle slug={roadmapId} title={roadmap.title} />
      <PageHeader icon={MapIcon} title={roadmap.title} subtitle={roadmap.shortDescription ?? undefined} />

      {roadmap.description && (
        <p className="mb-4 max-w-prose text-sm leading-relaxed text-text-muted">{roadmap.description}</p>
      )}

      <StatStrip
        className="mb-5"
        stats={[
          { label: "Lĩnh vực", value: FIELD_LABEL[roadmap.field] ?? roadmap.field },
          { label: "Trình độ", value: LEVEL_LABEL[roadmap.level] ?? roadmap.level },
          { label: "Khóa học", value: courses.length },
          { label: "Giờ học", value: roadmap.estimatedHours ?? "—" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <h2 className="mb-1 text-base font-bold text-navy">Khóa học trong lộ trình</h2>
          <p className="mb-3 text-xs text-text-faint">
            Học theo thứ tự bên dưới — mỗi khóa dựa trên khóa trước nó.
          </p>
          {courses.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-navy">Lộ trình chưa có khóa học nào</p>
              <p className="mt-1 text-xs text-text-faint">Giảng viên đang biên soạn nội dung.</p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.map((course) => {
                const detail = courseDetails.get(course.courseId);
                return (
                  // Số thứ tự đứng NGOÀI thẻ, không đè lên thumbnail — layout ngang đặt
                  // thumbnail bên trái, thông tin bên phải, nên không còn chỗ nào để lồng số
                  // thứ tự vào ảnh bìa nữa.
                  <li key={course.courseId} className="flex items-start gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-xs font-bold text-on-ink">
                      {course.position}
                    </span>
                    <div className="min-w-0 flex-1">
                      <EntityCard
                        layout="horizontal"
                        tile={tileFor(course.title)}
                        coverImage={detail?.coverImageUrl || placeholderCoverUrl(course.slug)}
                        kind={{ icon: User, label: detail?.authorName ?? "CodeMentor" }}
                        title={course.title}
                        description={detail?.description ?? "Chưa có mô tả cho khóa học này."}
                        difficulty={detail ? levelToDifficulty(detail.level) : undefined}
                        tags={course.isOptional ? ["Tự chọn"] : []}
                        // Số chương/bài đến từ `courseDetails`, không từ payload lộ trình —
                        // `RoadmapDetail.courses` chỉ mang id/vị trí/tiêu đề/thời lượng.
                        stats={[
                          ...(detail ? [{ label: "chương", value: detail.totalChapters }] : []),
                          ...(detail ? [{ label: "bài học", value: detail.totalLessons }] : []),
                          ...(course.durationHours !== null
                            ? [{ label: "giờ", value: course.durationHours }]
                            : []),
                        ]}
                        href={`/courses/${course.courseId}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          {roadmap.prerequisiteNote && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-bold text-navy">Điều kiện tiên quyết</h2>
              <p className="text-xs leading-relaxed text-text-muted">{roadmap.prerequisiteNote}</p>
            </Card>
          )}
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-bold text-navy">Bắt đầu từ đâu</h2>
            <p className="mb-3 text-xs leading-relaxed text-text-muted">
              {courses.length > 0
                ? `Khóa đầu tiên là “${courses[0].title}”.`
                : "Chưa có khóa học nào để bắt đầu."}
            </p>
            {courses.length > 0 && (
              <Link
                href={`/courses/${courses[0].courseId}`}
                className="block rounded-md bg-primary px-3.5 py-2.5 text-center text-sm font-semibold text-on-ink transition-colors hover:bg-primary-hover"
              >
                Vào khóa đầu tiên
              </Link>
            )}
          </Card>
        </aside>
      </div>

      <section className="mt-6">
        <h2 className="mb-1 text-base font-bold text-navy">Lộ trình khác dành cho bạn</h2>
        <p className="mb-3 text-xs text-text-faint">
          Xếp theo hồ sơ học tập của bạn — lộ trình đang xem không nằm trong danh sách.
        </p>
        <RecommendedRoadmaps excludeId={roadmapId} />
      </section>
    </div>
  );
}
