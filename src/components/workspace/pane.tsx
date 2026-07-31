"use client";

import type { ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { PaneId, TabKind } from "./types";
import { TabBar } from "./tab-bar";
import { useWorkspace } from "./workspace-context";

export function Pane({
  id,
  trailing,
  className = "",
  children,
}: {
  id: PaneId;
  trailing?: ReactNode;
  className?: string;
  children: (activeTab: TabKind) => ReactNode;
}) {
  const { panes, maximized, toggleMaximize } = useWorkspace();
  const pane = panes[id];

  const maximizeButton = (
    <button
      onClick={() => toggleMaximize(id)}
      title={maximized === id ? "Thu nhỏ pane" : "Phóng to pane"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-faint opacity-0 transition-opacity duration-150 group-hover/pane:opacity-100 hover:bg-bg hover:text-navy"
    >
      {maximized === id ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className={`group/pane flex h-full min-h-0 flex-col ${className}`}>
      <TabBar
        pane={id}
        trailing={
          <div className="flex shrink-0 items-center gap-1">
            {trailing}
            {maximizeButton}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {pane.active ? children(pane.active) : <EmptyDropHint />}
      </div>
    </div>
  );
}

function EmptyDropHint() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-text-faint">Kéo tab vào đây</div>
  );
}
