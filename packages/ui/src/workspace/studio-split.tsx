"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Group, Panel } from "react-resizable-panels";
import { ResizeHandle } from "./resize-handle";

const COMPACT_QUERY = "(max-width: 767px)";

function subscribeCompact(onChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Below `md`. Server and first paint report `false`; the store corrects it before input. */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}

type Pane = { id: string; content: ReactNode; defaultSize?: string; minSize?: string };

/**
 * The two resizable panes every studio uses. Side by side from `md` up; stacked below it —
 * two columns of ~190px each left a 390px screen with two unusable strips (the course tree
 * overflowed to 585px). Keyed on the orientation so panel sizes reset when it flips.
 */
export function StudioSplit({ start, end }: { start: Pane; end: Pane }) {
  const orientation = useCompactLayout() ? "vertical" : "horizontal";
  return (
    <Group className="h-full" key={orientation} orientation={orientation}>
      <Panel className="min-h-0" defaultSize={start.defaultSize ?? "50%"} id={start.id} minSize={start.minSize ?? "25%"}>
        {start.content}
      </Panel>
      <ResizeHandle orientation={orientation} />
      <Panel className="min-h-0" defaultSize={end.defaultSize ?? "50%"} id={end.id} minSize={end.minSize ?? "25%"}>
        {end.content}
      </Panel>
    </Group>
  );
}
