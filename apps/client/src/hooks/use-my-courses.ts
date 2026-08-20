"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { EnrolledCourse } from "@/types/catalogue";

/**
 * "Khoá học của tôi" — the bulk endpoint `useCourseProgress`'s own comment asked for.
 *
 * A dedicated effect rather than `useCatalogue`: `enabled` flips from `false` to `true`
 * once auth resolves after mount, and `useCatalogue`'s effect only ever runs once, so it
 * would miss that transition and show nothing for a user who was signed in the whole time.
 */
export function useMyCourses(enabled: boolean) {
  const [items, setItems] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api.courses
      .mine()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Không tải được danh sách khóa học đã đăng ký.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { items, isLoading, error };
}
