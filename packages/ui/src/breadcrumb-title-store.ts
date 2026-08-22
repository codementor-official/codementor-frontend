"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Tên thật của bản ghi đang mở (khoá học "Cấu trúc dữ liệu cơ bản", không phải "studio"),
 * để breadcrumb hiện đúng nó thay vì chỉ có nhãn đoạn đường tĩnh.
 *
 * Không dùng zustand: chỉ `apps/client` có sẵn dependency đó, và một map vài dòng không
 * đáng để bắt `packages/ui` — nơi mọi app đều import — kéo theo một thư viện state riêng.
 * `useSyncExternalStore` là API của chính React cho đúng việc này.
 */
type Listener = () => void;

let titles: Record<string, string> = {};
const listeners = new Set<Listener>();

export function setBreadcrumbTitle(slug: string, title: string): void {
  if (titles[slug] === title) return;
  titles = { ...titles, [slug]: title };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Record<string, string> {
  return titles;
}

export function useBreadcrumbTitles(): Record<string, string> {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Renderless — thả vào một trang chi tiết ngay khi bản ghi đã tải để đăng ký tên thật của
 * nó. `slug` là ĐÚNG đoạn đường (route param), vì `breadcrumbTrail` tra cứu theo đoạn đường.
 */
export function BreadcrumbTitle({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    setBreadcrumbTitle(slug, title);
  }, [slug, title]);
  return null;
}
