"use client";

import type { ReactNode } from "react";
import type { PaneId } from "./types";
import { Tab } from "./tab";
import { useWorkspace } from "./workspace-context";

export function TabBar({ pane, trailing }: { pane: PaneId; trailing?: ReactNode }) {
  const { panes, dragging, moveTab } = useWorkspace();
  const tabs = panes[pane].tabs;
  const dropTarget = dragging && dragging.from !== pane;

  return (
    <div
      onDragOver={(e) => {
        if (dragging) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragging) moveTab(dragging.tab, dragging.from, pane);
      }}
      className={`flex min-h-[37px] shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface px-1 transition-colors ${
        dropTarget ? "bg-ai-tint/40" : ""
      }`}
    >
      {tabs.map((k) => (
        <Tab key={k} pane={pane} kind={k} />
      ))}
      {tabs.length === 0 && (
        <div className="px-3 py-2 text-xs text-text-faint">Kéo tab vào đây</div>
      )}
      <div className="flex-1" />
      {trailing}
    </div>
  );
}
