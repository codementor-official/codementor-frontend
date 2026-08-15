"use client";

import { useRef, type DragEvent, type ReactNode } from "react";
import type { PaneId } from "./types";
import { Tab } from "./tab";
import { useWorkspace } from "./workspace-context";

export function TabBar({ pane, trailing }: { pane: PaneId; trailing?: ReactNode }) {
  const { panes, dragging, moveTab, dropTarget, setDropTarget } = useWorkspace();
  const tabs = panes[pane].tabs;
  const containerRef = useRef<HTMLDivElement>(null);
  const showIndicator = dropTarget?.pane === pane;

  const handleDragOver = (e: DragEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const children = Array.from(container.children) as HTMLElement[];

    let index = children.length;
    let x = container.getBoundingClientRect().width;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientX < rect.left + rect.width / 2) {
        index = i;
        x = rect.left - containerLeft;
        break;
      }
    }
    setDropTarget({ pane, index, x });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragging) {
      const insertIndex = dropTarget?.pane === pane ? dropTarget.index : undefined;
      moveTab(dragging.tab, dragging.from, pane, insertIndex);
    }
    setDropTarget(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex min-h-9.25 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface px-1"
    >
      <div ref={containerRef} className="relative flex items-center">
        {tabs.map((k) => (
          <Tab key={k} pane={pane} kind={k} />
        ))}
        {showIndicator && (
          <span
            style={{ left: dropTarget.x }}
            className="pointer-events-none absolute top-1 bottom-1 z-10 w-0.5 rounded-full bg-primary transition-[left] duration-100"
          />
        )}
      </div>
      {tabs.length === 0 && <div className="px-3 py-2 text-xs text-text-faint">Kéo tab vào đây</div>}
      <div className="flex-1" />
      {trailing}
    </div>
  );
}
