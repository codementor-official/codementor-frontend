"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon as ArrowLeft, ArrowRightIcon as ArrowRight, MapTrifoldIcon as MapIcon } from "@phosphor-icons/react/ssr";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, LEVEL_LABELS, type ContentStatus, type Level } from "@codementor/types";
import {
  BreadcrumbTitle,
  Card,
  CompletionsPanel,
  CourseCover,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
  buttonClassName,
  useUrlState,
  type CompletionsQuery,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import type { RoadmapPreview } from "@/features/moderation/types";
import { certificatesApi, moderationApi } from "@/lib/api";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");

type RoadmapDetail = RoadmapPreview & { status: ContentStatus; prerequisiteNote?: string | null };

/** Read-only roadmap: its courses in order (each opens the course viewer), details and completions. */
export function RoadmapViewer({ id }: { id: string }) {
  const request = useAdminApi();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useUrlState("tab", "courses");
  useEffect(() => {
    moderationApi
      .detail<RoadmapDetail>(request, "roadmaps", id)
      .then(setRoadmap)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được lộ trình."));
  }, [request, id]);
  const loadCompletions = useCallback(
    (query: CompletionsQuery) => certificatesApi.completions(request, "roadmap", id, query),
    [request, id],
  );

  if (error) return <Card className="p-6 text-sm text-destructive" role="alert">{error}</Card>;
  if (!roadmap) return <Card className="h-64 animate-pulse" aria-busy="true" />;
  const courses = roadmap.courses ?? [];

  return (
    <div className="space-y-4">
      <BreadcrumbTitle href={`/learning-paths/${id}`} slug={id} title={roadmap.title} />
      <PageHeader
        action={
          <Link className={buttonClassName("outline", "sm")} href="/learning-paths">
            <ArrowLeft aria-hidden="true" className="size-4" /> Danh sách lộ trình
          </Link>
        }
        description={`${courses.length} khóa học · chỉ xem`}
        icon={MapIcon}
        title={roadmap.title}
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={CONTENT_STATUS_TONES[roadmap.status] ?? "neutral"}>{CONTENT_STATUS_LABELS[roadmap.status] ?? roadmap.status}</StatusBadge>
        <SegmentedTabs
          onChange={setTab}
          options={[
            { value: "courses", label: "Khóa học" },
            { value: "info", label: "Thông tin" },
            { value: "completions", label: "Đã hoàn thành" },
          ]}
          value={tab}
        />
      </div>

      {tab === "info" ? (
        <Card className="grid gap-5 p-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <CourseCover className="aspect-video w-full rounded-lg" src={roadmap.coverImageUrl} title={roadmap.title} />
          <div className="min-w-0 space-y-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Lĩnh vực</dt><dd className="font-medium">{roadmap.field}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Trình độ</dt><dd className="font-medium">{LEVEL_LABELS[roadmap.level as Level] ?? roadmap.level}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Thời lượng ước tính</dt><dd className="font-medium">{roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "—"}</dd></div>
            </dl>
            {roadmap.shortDescription && <p className="whitespace-pre-line">{roadmap.shortDescription}</p>}
            {roadmap.description && <p className="whitespace-pre-line text-muted-foreground">{roadmap.description}</p>}
            {roadmap.prerequisiteNote && <p><span className="text-xs text-muted-foreground">Yêu cầu trước: </span>{roadmap.prerequisiteNote}</p>}
            {roadmap.rejectionReason && <p><span className="text-xs text-muted-foreground">Lý do / ghi chú: </span>{roadmap.rejectionReason}</p>}
          </div>
        </Card>
      ) : tab === "completions" ? (
        <CompletionsPanel load={loadCompletions} verifyBaseUrl={CLIENT_URL} />
      ) : courses.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Lộ trình chưa có khóa học nào.</Card>
      ) : (
        <ol className="space-y-2">
          {courses.map((c, i) => (
            <li key={c.courseId}>
              <Link className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/60" href={`/courses/${c.courseId}`}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.title}</span>
                  {c.isOptional && <span className="text-xs text-muted-foreground">Tuỳ chọn</span>}
                </span>
                <StatusBadge tone={CONTENT_STATUS_TONES[c.status as ContentStatus] ?? "neutral"}>{CONTENT_STATUS_LABELS[c.status as ContentStatus] ?? c.status}</StatusBadge>
                <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
