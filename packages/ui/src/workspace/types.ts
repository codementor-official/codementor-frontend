import type { LucideIcon } from "lucide-react";

/**
 * Pane and tab identifiers are plain strings.
 *
 * They started as closed unions belonging to one screen — the practice workspace — which
 * made the whole system unusable anywhere else: a second screen with a "curriculum" tab
 * could not name it. Each screen now declares its own union locally and passes its tab
 * descriptions in, so it keeps exhaustiveness checking on its own switch statements while
 * these components stay indifferent to what the tabs are.
 */
export type PaneId = string;
export type TabKind = string;

export interface TabMeta {
  label: string;
  icon: LucideIcon;
  /** Colour applied to the icon while its tab is active. */
  iconClassName?: string;
  closable?: boolean;
}

/** What each tab is called and how it is drawn, keyed by tab id. */
export type TabMetaMap = Record<TabKind, TabMeta>;

export interface PaneState {
  tabs: TabKind[];
  active: TabKind | null;
}

export type PanesState = Record<PaneId, PaneState>;
