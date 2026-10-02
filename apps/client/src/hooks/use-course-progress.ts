"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { commerceApi } from "@/features/commerce/api";
import type { CourseProgress } from "@/types/catalogue";

/**
 * My enrolment + lesson state for a set of courses, keyed by course id.
 *
 * ponytail: one request per course, fired only for the ids handed in — pass the current
 * page, not the whole catalogue. Swap it for a bulk `GET /courses/mine/enrollments` once
 * the backend has one and a page shows more courses than a screenful.
 */
export function useCourseProgress(courseIds: string[], enabled: boolean) {
  const [byCourse, setByCourse] = useState<Record<string, CourseProgress>>({});
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const requested = useRef(new Set<string>());

  const load = useCallback(async (ids: string[]) => {
    const fresh = ids.filter((id) => !requested.current.has(id));
    fresh.forEach((id) => requested.current.add(id));
    await Promise.all(
      fresh.map((id) =>
        api.courses
          .progress(id)
          .then(async (progress) => {
            setByCourse((prev) => ({ ...prev, [id]: progress }));
            // Ghi danh chưa chắc là đã mua: khoá miễn phí được đặt giá về sau vẫn giữ ghi danh
            // cũ. Chỉ hỏi giá cho khoá đã ghi danh — khoá chưa ghi danh thì chắc chắn chưa có.
            if (progress.enrollment && progress.enrollment.status !== "dropped") {
              const offer = await commerceApi.offer(id);
              setOwned((prev) => ({ ...prev, [id]: offer.owned || offer.priceVnd === 0 }));
            }
          })
          // Signed-out visitors get a 401 here. The card simply stays in its "chưa đăng ký"
          // state; forget the id so a later attempt can retry.
          .catch(() => requested.current.delete(id)),
      ),
    );
  }, []);

  // Joined, not the array itself: a fresh array each render would refetch forever.
  const key = courseIds.join(",");
  useEffect(() => {
    if (enabled && key) void load(key.split(","));
  }, [enabled, key, load]);

  /** Re-reads one course after enrolling — the enrolment is what just changed. */
  const refresh = useCallback(
    async (courseId: string) => {
      requested.current.delete(courseId);
      await load([courseId]);
    },
    [load],
  );

  return { byCourse, owned, refresh };
}
