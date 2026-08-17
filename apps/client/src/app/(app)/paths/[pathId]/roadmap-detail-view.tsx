"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Loader2, Map } from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { RoadmapDetail } from "@/types/catalogue";

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

  if (error) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-sm font-semibold text-navy">Không mở được lộ trình này</p>
        <p className="mt-1 text-xs text-text-muted">{error}</p>
        <Link href="/paths" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
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
      <PageHeader icon={Map} title={roadmap.title} subtitle={roadmap.description ?? undefined} />

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
              {courses.map((course) => (
                <li key={course.courseId}>
                  <Link href={`/courses/${course.courseId}`} className="block">
                    <Card interactive className="flex items-center gap-3.5 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy font-mono text-sm font-bold text-on-ink">
                        {course.position}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-navy">{course.title}</h3>
                        <p className="mt-0.5 flex items-center gap-2 text-2xs text-text-faint">
                          {course.durationHours !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {course.durationHours} giờ
                            </span>
                          )}
                          {course.isOptional && <span>· Tự chọn</span>}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-faint" />
                    </Card>
                  </Link>
                </li>
              ))}
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
    </div>
  );
}
