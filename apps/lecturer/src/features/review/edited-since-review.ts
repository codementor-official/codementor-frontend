"use client";

import { useSyncExternalStore } from "react";

/**
 * Which published courses / roadmaps / articles the lecturer has saved changes to without
 * sending them for review again. "Gửi duyệt lại" only shows for those.
 *
 * shortcut: kept in this browser's localStorage (another device does not show the button until
 * something is saved there); move to a server flag such as `edited_after_review` if that matters.
 */
const KEY = "cm:edited-since-review";
export type ReviewedKind = "courses" | "roadmaps" | "articles";

function read(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, true>;
  } catch {
    return {};
  }
}

function write(all: Record<string, true>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode or full storage: the button just stays hidden until the next save.
  }
  window.dispatchEvent(new Event(KEY));
}

/** Called by `unwrap` after every successful write; ignores reads and other resources. */
export function trackContentWrite(method: string | undefined, path: string) {
  const match = /^\/(courses|roadmaps|articles)\/([0-9a-f-]{36})(\/[^?]*)?/.exec(path);
  if (!match || !method || method === "GET" || typeof window === "undefined") return;
  const [, kind, id, rest = ""] = match;
  const key = `${kind}:${id}`;
  const all = read();
  if (rest === "/submit" || method === "DELETE") {
    if (!all[key]) return;
    delete all[key];
    write(all);
    return;
  }
  // Moving the item between states or asking for an upload URL changes no content.
  if (/^\/(withdraw|request-removal|restore|cover-upload-url|lessons\/[^/]+\/video-upload-url)$/.test(rest)) return;
  if (all[key]) return;
  all[key] = true;
  write(all);
}

function subscribe(onChange: () => void) {
  window.addEventListener(KEY, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(KEY, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Ids of this kind with saved changes not yet sent for review ("Gửi duyệt lại" shows for those). */
export function useEditedIds(kind: ReviewedKind): (id: string) => boolean {
  const snapshot = useSyncExternalStore(subscribe, () => localStorageRaw(), () => "{}");
  const all = (() => {
    try {
      return JSON.parse(snapshot) as Record<string, true>;
    } catch {
      return {};
    }
  })();
  return (id: string) => Boolean(all[`${kind}:${id}`]);
}

function localStorageRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}";
  }
}
