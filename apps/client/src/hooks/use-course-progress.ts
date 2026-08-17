"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
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
  const requested = useRef(new Set<string>());

  const load = useCallback(async (ids: string[]) => {
    const fresh = ids.filter((id) => !requested.current.has(id));
    fresh.forEach((id) => requested.current.add(id));
    await Promise.all(
      fresh.map((id) =>
        api.courses
          .progress(id)
          .then((progress) => setByCourse((prev) => ({ ...prev, [id]: progress })))
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

  return { byCourse, refresh };
}
