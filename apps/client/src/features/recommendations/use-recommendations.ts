"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";

/** The caller supplies a stable loader. Revalidate after preference saves and
 * discard in-flight responses from a previous user, revision or request. */
export function useRecommendations<T>(load: () => Promise<T>) {
  const { user, status } = useAuth();
  const revision = useLearningPreferenceStore((state) => state.preferenceRevision);
  const [attempt, setAttempt] = useState(0);
  const scope = `${status}:${user?.id ?? ""}:${revision}:${attempt}`;
  const [state, setState] = useState<{
    scope: string;
    loader: typeof load;
    data: T | null;
    error: string | null;
    isLoading: boolean;
  }>({ scope: "", loader: load, data: null, error: null, isLoading: true });
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const replaceData = useCallback((data: T) => {
    setState({ scope, loader: load, data, error: null, isLoading: false });
  }, [load, scope]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    load().then(
      (data) => { if (!cancelled) setState({ scope, loader: load, data, error: null, isLoading: false }); },
      (cause: unknown) => { if (!cancelled) setState({ scope, loader: load, data: null,
        error: cause instanceof Error ? cause.message : "Không tải được đề xuất từ máy chủ.", isLoading: false }); },
    );
    return () => { cancelled = true; };
  }, [load, scope, status]);

  const current = state.scope === scope && state.loader === load;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    isLoading: status === "loading" || (status === "authenticated" && (!current || state.isLoading)),
    reload,
    replaceData,
  };
}
