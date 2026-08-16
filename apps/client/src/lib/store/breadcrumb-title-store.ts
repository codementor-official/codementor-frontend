import { create } from "zustand";

interface BreadcrumbTitleState {
  /** URL slug → the entity's real title, e.g. `frontend-developer` → `Frontend Developer`. */
  titles: Record<string, string>;
  setTitle: (slug: string, title: string) => void;
}

/**
 * The shell renders the breadcrumb but only the page knows what a dynamic segment is
 * actually called — the roadmap's title, the group's name. Pages register theirs through
 * `<BreadcrumbTitle>`; unregistered slugs fall back to a humanized form of the slug itself.
 *
 * Not persisted: a stale title outliving a rename is worse than reading the slug once.
 */
export const useBreadcrumbTitleStore = create<BreadcrumbTitleState>((set) => ({
  titles: {},
  setTitle: (slug, title) =>
    set((state) =>
      state.titles[slug] === title ? state : { titles: { ...state.titles, [slug]: title } },
    ),
}));
