"use client";

import { X } from "lucide-react";
import { TAB_META, type PaneId, type TabKind } from "./types";
import { useWorkspace } from "./workspace-context";

export function Tab({ pane, kind }: { pane: PaneId; kind: TabKind }) {
  const { panes, setActive, closeTab, dragging, setDragging } = useWorkspace();
  const meta = TAB_META[kind];
  const active = panes[pane].active === kind;
  const isDragged = dragging?.tab === kind;

  return (
    <button
      draggable
      onDragStart={(e) => {
        setDragging({ tab: kind, from: pane });
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => setDragging(null)}
      onClick={() => setActive(pane, kind)}
      className={`group/tab relative flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
        active
          ? "border-navy text-navy"
          : "border-transparent text-text-faint hover:border-border-soft hover:text-navy"
      } ${isDragged ? "opacity-40" : ""}`}
    >
      <meta.icon className={`h-3.5 w-3.5 transition-colors duration-150 ${active ? meta.iconClassName : "text-text-faint group-hover/tab:text-navy"}`} />
      {meta.label}
      {meta.closable && (
        <span
          role="button"
          title="Đóng tab"
          onClick={(e) => {
            e.stopPropagation();
            closeTab(pane, kind);
          }}
          className="ml-0.5 rounded-sm p-0.5 text-text-faint hover:bg-border-soft hover:text-navy"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
