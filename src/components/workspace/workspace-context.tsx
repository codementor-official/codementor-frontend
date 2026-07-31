"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PaneId, PanesState, TabKind } from "./types";

interface DragInfo {
  tab: TabKind;
  from: PaneId;
}

interface WorkspaceCtx {
  panes: PanesState;
  setActive: (pane: PaneId, tab: TabKind) => void;
  moveTab: (tab: TabKind, from: PaneId, to: PaneId) => void;
  openTab: (pane: PaneId, tab: TabKind) => void;
  closeTab: (pane: PaneId, tab: TabKind) => void;
  dragging: DragInfo | null;
  setDragging: (d: DragInfo | null) => void;
  maximized: PaneId | null;
  toggleMaximize: (pane: PaneId) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({
  initialPanes,
  children,
}: {
  initialPanes: PanesState;
  children: ReactNode;
}) {
  const [panes, setPanes] = useState<PanesState>(initialPanes);
  const [dragging, setDragging] = useState<DragInfo | null>(null);
  const [maximized, setMaximized] = useState<PaneId | null>(null);

  const setActive = (pane: PaneId, tab: TabKind) =>
    setPanes((p) => ({ ...p, [pane]: { ...p[pane], active: tab } }));

  const moveTab = (tab: TabKind, from: PaneId, to: PaneId) => {
    if (from === to) return;
    setPanes((p) => {
      const fromTabs = p[from].tabs.filter((t) => t !== tab);
      const toTabs = p[to].tabs.includes(tab) ? p[to].tabs : [...p[to].tabs, tab];
      return {
        ...p,
        [from]: { tabs: fromTabs, active: fromTabs[0] ?? null },
        [to]: { tabs: toTabs, active: tab },
      };
    });
  };

  const openTab = (pane: PaneId, tab: TabKind) => {
    setPanes((p) => {
      const cleaned = Object.fromEntries(
        Object.entries(p).map(([id, st]) => [
          id,
          id === pane ? st : { ...st, tabs: st.tabs.filter((t) => t !== tab) },
        ]),
      ) as PanesState;
      const targetTabs = cleaned[pane].tabs.includes(tab) ? cleaned[pane].tabs : [...cleaned[pane].tabs, tab];
      return { ...cleaned, [pane]: { tabs: targetTabs, active: tab } };
    });
  };

  const closeTab = (pane: PaneId, tab: TabKind) => {
    setPanes((p) => {
      const tabs = p[pane].tabs.filter((t) => t !== tab);
      return { ...p, [pane]: { tabs, active: tabs[0] ?? null } };
    });
  };

  const toggleMaximize = (pane: PaneId) => setMaximized((m) => (m === pane ? null : pane));

  return (
    <Ctx.Provider
      value={{ panes, setActive, moveTab, openTab, closeTab, dragging, setDragging, maximized, toggleMaximize }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
