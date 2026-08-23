"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { BreadcrumbTitleEntry } from "./breadcrumb-trail";

/**
 * Tên thật của bản ghi đang mở (khoá học "Cấu trúc dữ liệu cơ bản", không phải "studio"),
 * để breadcrumb hiện đúng nó thay vì chỉ có nhãn đoạn đường tĩnh. Có thể kèm `href` khi
 * đoạn đường đang tải không phải là một trang thật — xem `BreadcrumbTitleEntry`.
 *
 * Không dùng zustand: chỉ `apps/client` có sẵn dependency đó, và một map vài dòng không
 * đáng để bắt `packages/ui` — nơi mọi app đều import — kéo theo một thư viện state riêng.
 * `useSyncExternalStore` là API của chính React cho đúng việc này.
 */
type Listener = () => void;

let titles: Record<string, BreadcrumbTitleEntry> = {};
const listeners = new Set<Listener>();

export function setBreadcrumbTitle(slug: string, title: string, href?: string): void {
  const current = titles[slug];
  if (current && current.label === title && current.href === href) return;
  titles = { ...titles, [slug]: { label: title, href } };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Record<string, BreadcrumbTitleEntry> {
  return titles;
}

export function useBreadcrumbTitles(): Record<string, BreadcrumbTitleEntry> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Renderless — thả vào một trang chi tiết ngay khi bản ghi đã tải để đăng ký tên thật của
 * nó. `slug` là ĐÚNG đoạn đường (route param), vì `breadcrumbTrail` tra cứu theo đoạn đường.
 *
 * `href`: chỉ cần khi đoạn đường này không có trang riêng — ví dụ id của một studio, nơi
 * chỉ "/courses" (danh sách) và "/courses/<id>/studio" tồn tại, không có "/courses/<id>".
 * Bỏ trống thì breadcrumb dùng đường dẫn gộp dần theo mặc định.
 */
export function BreadcrumbTitle({
  slug,
  title,
  href,
}: {
  slug: string;
  title: string;
  href?: string;
}) {
  useEffect(() => {
    setBreadcrumbTitle(slug, title, href);
  }, [slug, title, href]);
  return null;
}
