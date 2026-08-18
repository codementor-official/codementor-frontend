"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@codementor/ui";
import { STATUS_LABELS, STATUS_TONES, type ExerciseStatus } from "@codementor/solve";
import { FIELD_LABELS, LEVEL_LABELS, type Field, type Level } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { PreviewShell, ReviewChecklist } from "@/features/moderation/preview-shell";
import { describeError } from "@/features/moderation/use-moderation";
import { moderationApi, type RoadmapDetail } from "@/lib/api";

/**
 * Lộ trình như admin cần đọc nó.
 *
 * Phần đáng giá nhất là cột trạng thái của từng khóa học: một lộ trình gồm năm khóa mà bốn
 * khóa chưa công khai vẫn được gửi duyệt bình thường, và nhìn từ danh sách thì nó không
 * khác gì một lộ trình đầy đủ. Người học mới là người phát hiện ra.
 */
export function RoadmapPreview({ id }: { id: string }) {
  const request = useAdminApi();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    moderationApi
      .roadmap(request, id)
      .then((loaded) => {
        if (!cancelled) setRoadmap(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, request]);

  if (error) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!roadmap) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  const courses = roadmap.courses ?? [];
  const unpublished = courses.filter((course) => course.status !== "published");
  const required = courses.filter((course) => !course.isOptional);

  return (
    <PreviewShell
      id={roadmap.id}
      kind="roadmaps"
      rejectionReason={roadmap.rejectionReason}
      status={roadmap.status}
      subtitle={`${roadmap.slug} · ${FIELD_LABELS[roadmap.field as Field] ?? roadmap.field} · ${LEVEL_LABELS[roadmap.level as Level] ?? roadmap.level}${
        roadmap.estimatedHours ? ` · ${roadmap.estimatedHours} giờ` : ""
      }`}
      title={roadmap.title}
    >
      <ReviewChecklist
        items={[
          { ok: Boolean(roadmap.description?.trim()), text: "Có mô tả lộ trình" },
          { ok: Boolean(roadmap.shortDescription?.trim()), text: "Có mô tả ngắn" },
          { ok: courses.length > 0, text: `Có khóa học (${courses.length})` },
          { ok: required.length > 0, text: `Có khóa bắt buộc (${required.length})` },
          {
            ok: unpublished.length === 0,
            text:
              unpublished.length === 0
                ? "Mọi khóa học trong lộ trình đã công khai"
                : `${unpublished.length} khóa chưa công khai — người học sẽ thấy lộ trình hụt`,
          },
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Thông tin chung</h2>
        <dl className="grid gap-2 text-sm">
          <Row label="Mô tả ngắn">{roadmap.shortDescription || "—"}</Row>
          <Row label="Mô tả">{roadmap.description || "— chưa có —"}</Row>
          <Row label="Điều kiện">{roadmap.prerequisiteNote || "—"}</Row>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Khóa học trong lộ trình</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lộ trình chưa có khóa học nào.</p>
        ) : (
          <ol className="grid gap-2">
            {courses.map((course, index) => (
              <li
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm"
                key={course.courseId}
              >
                <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {course.title}
                  {course.isOptional && (
                    <span className="ml-2 text-xs text-muted-foreground">(tuỳ chọn)</span>
                  )}
                </span>
                {course.durationHours !== null && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {course.durationHours} giờ
                  </span>
                )}
                <StatusBadge tone={STATUS_TONES[course.status as ExerciseStatus] ?? "neutral"}>
                  {STATUS_LABELS[course.status as ExerciseStatus] ?? course.status}
                </StatusBadge>
                <Link
                  aria-label={`Mở khóa học ${course.title}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  href={`/moderation/courses/${course.courseId}`}
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PreviewShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words whitespace-pre-wrap">{children}</dd>
    </div>
  );
}
