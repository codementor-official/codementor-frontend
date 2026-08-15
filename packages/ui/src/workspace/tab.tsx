"use client";

import { X } from "lucide-react";
import type { PaneId, TabKind } from "./types";
import { useWorkspace } from "./workspace-context";

export function Tab({ pane, kind }: { pane: PaneId; kind: TabKind }) {
  const { tabMeta, panes, setActive, closeTab, dragging, setDragging, setDropTarget, setContentDropTarget } =
    useWorkspace();
  const meta = tabMeta[kind];
  const active = panes[pane].active === kind;
  const isDragged = dragging?.tab === kind;

  return (
    <button
      draggable
      onDragStart={(e) => {
        setDragging({ tab: kind, from: pane });
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setDragging(null);
        setDropTarget(null);
        setContentDropTarget(null);
      }}
      onClick={() => setActive(pane, kind)}
      className={`group/tab relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-none border-r border-b-2 border-border/60 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 active:cursor-grabbing ${
        active
          ? "border-b-foreground text-foreground"
          : "border-b-transparent text-muted-foreground hover:border-b-border hover:text-foreground"
      } ${isDragged ? "border-dashed border-primary/50 text-muted-foreground opacity-50" : ""}`}
    >
      <meta.icon className={`h-3.5 w-3.5 transition-colors duration-150 ${active ? (meta.iconClassName ?? "text-foreground") : "text-muted-foreground group-hover/tab:text-foreground"}`} />
      {meta.label}
      {meta.closable && (
        <span
          role="button"
          title="Đóng tab"
          onClick={(e) => {
            e.stopPropagation();
            closeTab(pane, kind);
          }}
          className="ml-0.5 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
