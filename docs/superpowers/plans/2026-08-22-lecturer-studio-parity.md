# Lecturer Studio Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the lecturer app's four content studios (courses, roadmaps, exercises, articles) to parity — consistent delete-card placement, a shared localStorage draft-save mechanism, a dedicated article studio route, dynamic breadcrumb titles, a consistent button vocabulary, and cross-pane drag-and-drop in the roadmap studio.

**Architecture:** No new dependencies. Extract three small shared pieces (`buttonClassName` in `packages/ui`, a breadcrumb-title store in `packages/ui`, a `useDraftAutosave`/draft-storage module in `apps/lecturer/src/hooks`) and reuse the already-installed `@dnd-kit` for the new cross-pane drag. The article studio route is new; everything else is a refactor of existing pages.

**Tech Stack:** Next.js (App Router), React, Tailwind, `@dnd-kit/core` + `@dnd-kit/sortable` (already a dependency), `pnpm` workspaces.

**Spec:** `docs/superpowers/specs/2026-08-22-lecturer-studio-parity-design.md`

## Global Constraints

- No new npm dependencies (spec D4: no zustand in `packages/ui`).
- Preserve current behavior everywhere not explicitly listed as changing (CLAUDE.md rule 6).
- No test framework exists for these components; verification is `pnpm --filter <pkg> typecheck` / `build` plus a manual `pnpm dev` smoke check described per task (matches this repo's existing practice — see spec §5).
- Vietnamese UI copy throughout, matching existing files' tone and comment style.
- Branch `feat/lecturer-studio-parity` already created and checked out; spec doc already committed there.

---

### Task 1: Shared `buttonClassName` + button consistency pass

**Files:**
- Modify: `packages/ui/src/button.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx:151-157`
- Modify: `apps/lecturer/src/app/(lecturer)/exercises/page.tsx` (imports, lines ~487-501)
- Modify: `apps/lecturer/src/features/articles/articles-page.tsx:252-260`
- Modify: `apps/lecturer/src/features/exercises/code-problem-form.tsx:373-385, 821-828`
- Modify: `apps/lecturer/src/features/courses/curriculum-tree.tsx` (MenuItem ~340-350, collapse-toggle ~405-416, chapter-delete ~425-433, "+ Thêm bài" ~454-463, lesson-delete ~580-588)

**Interfaces:**
- Produces: `buttonClassName(variant?: "default"|"outline"|"ghost"|"danger", size?: "sm"|"md", className?: string): string`, exported from `@codementor/ui`.

- [ ] **Step 1: Extract `buttonClassName` in `packages/ui/src/button.tsx`**

Replace the whole file with:

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "border border-primary bg-primary text-primary-foreground hover:opacity-90",
  outline: "border bg-background text-foreground hover:bg-muted",
  ghost: "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  // Xoá là thao tác không lùi lại được. Nó từng mang biến thể `ghost` — trông y hệt một
  // liên kết phụ, nằm lẫn giữa các nút khác.
  danger:
    "border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-sm",
};

/**
 * Các class mà `Button` vẽ ra, dùng lại cho chỗ hiếm hoi cần TRÔNG GIỐNG một nút mà không
 * PHẢI là một `<button>` — ví dụ `<Link>` điều hướng sang trang khác. Luôn khớp với `Button`
 * vì `Button` gọi thẳng hàm này, không phải hai bảng class riêng dễ trôi dần.
 */
export function buttonClassName(
  variant: ButtonVariant = "default",
  size: ButtonSize = "md",
  className = "",
): string {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export function Button({
  className = "",
  type = "button",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={buttonClassName(variant, size, className)} type={type} {...props} />;
}
```

- [ ] **Step 2: Export it from `packages/ui/src/index.ts`**

Change:
```ts
export { Button } from "./button";
```
to:
```ts
export { Button, buttonClassName } from "./button";
```

- [ ] **Step 3: Typecheck `packages/ui`**

Run: `pnpm --filter @codementor/ui typecheck`
Expected: passes (pure refactor, `Button`'s rendered output is unchanged).

- [ ] **Step 4: Replace the "Giải thử" Link in exercise studio**

In `apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx`, add `buttonClassName` to the `@codementor/ui` import (already imports `Button, PageHeader, ResizeHandle, StatusBadge, useResolvedTheme, useToast, useUndoableDelete` — add `buttonClassName` to that list), then replace:
```tsx
<Link
  className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"
  href={`/exercises/${id}/solve`}
>
  <Play aria-hidden="true" className="size-4" />
  Giải thử
</Link>
```
with:
```tsx
<Link className={buttonClassName("outline")} href={`/exercises/${id}/solve`}>
  <Play aria-hidden="true" className="size-4" />
  Giải thử
</Link>
```

- [ ] **Step 5: Replace the two hand-styled Links in `exercises/page.tsx`**

Add `buttonClassName` to that file's `@codementor/ui` import. Replace ("Mở studio", inside `ExerciseDrawerActions`):
```tsx
<Link
  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
  href={`/exercises/${row.id}/studio`}
>
  <Pencil aria-hidden="true" className="size-4" /> Mở studio
</Link>
```
with:
```tsx
<Link className={buttonClassName()} href={`/exercises/${row.id}/studio`}>
  <Pencil aria-hidden="true" className="size-4" /> Mở studio
</Link>
```
And ("Xem & giải thử"):
```tsx
<Link
  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium"
  href={`/exercises/${row.id}/solve`}
>
  <FlaskConical aria-hidden="true" className="size-4" /> Xem & giải thử
</Link>
```
with:
```tsx
<Link className={buttonClassName("outline")} href={`/exercises/${row.id}/solve`}>
  <FlaskConical aria-hidden="true" className="size-4" /> Xem & giải thử
</Link>
```
(This also fixes a pre-existing `rounded-lg` vs. `Button`'s `rounded-md` mismatch on the first one.)

- [ ] **Step 6: Replace "Xem trên client" in `articles-page.tsx`**

Add `buttonClassName` to that file's `@codementor/ui` import. Replace:
```tsx
<a
  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
  href={`${CLIENT_URL}/articles/${row.slug}`}
  rel="noreferrer"
  target="_blank"
>
  <ExternalLink aria-hidden="true" className="size-4" />
  Xem trên client
</a>
```
with:
```tsx
<a className={buttonClassName("outline")} href={`${CLIENT_URL}/articles/${row.slug}`} rel="noreferrer" target="_blank">
  <ExternalLink aria-hidden="true" className="size-4" />
  Xem trên client
</a>
```

- [ ] **Step 7: Convert the two raw delete buttons in `code-problem-form.tsx`**

Replace (xoá tham số):
```tsx
<button
  aria-label={`Xoá tham số ${parameter.name}`}
  className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
  onClick={() =>
    onChange({
      ...signature,
      parameters: parameters.filter((_, position) => position !== index),
    })
  }
  type="button"
>
  <X className="size-4" />
</button>
```
with:
```tsx
<Button
  aria-label={`Xoá tham số ${parameter.name}`}
  className="shrink-0"
  onClick={() =>
    onChange({
      ...signature,
      parameters: parameters.filter((_, position) => position !== index),
    })
  }
  size="sm"
  type="button"
  variant="danger"
>
  <X className="size-3.5" />
</Button>
```
Replace (xoá case):
```tsx
<button
  aria-label={`Xoá case ${testCase.order}`}
  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
  onClick={() => removeTestCase(index)}
  type="button"
>
  <X className="size-4" />
</button>
```
with:
```tsx
<Button
  aria-label={`Xoá case ${testCase.order}`}
  onClick={() => removeTestCase(index)}
  size="sm"
  type="button"
  variant="danger"
>
  <X className="size-3.5" />
</Button>
```
(`Button` is already imported in this file.)

- [ ] **Step 8: Convert 5 spots in `curriculum-tree.tsx`**

`MenuItem`, replace the whole function:
```tsx
function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm hover:bg-muted"
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  );
}
```
with:
```tsx
function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button className="w-full justify-start" onClick={onClick} role="menuitem" size="sm" variant="ghost">
      {children}
    </Button>
  );
}
```

Collapse-toggle, replace:
```tsx
<button
  aria-label={collapsed ? "Mở chương" : "Thu gọn chương"}
  className="text-muted-foreground hover:text-foreground"
  onClick={() => onToggle(chapter.key)}
  type="button"
>
  {collapsed ? (
    <ChevronRight aria-hidden="true" className="size-4" />
  ) : (
    <ChevronDown aria-hidden="true" className="size-4" />
  )}
</button>
```
with:
```tsx
<Button
  aria-label={collapsed ? "Mở chương" : "Thu gọn chương"}
  onClick={() => onToggle(chapter.key)}
  size="sm"
  variant="ghost"
>
  {collapsed ? (
    <ChevronRight aria-hidden="true" className="size-4" />
  ) : (
    <ChevronDown aria-hidden="true" className="size-4" />
  )}
</Button>
```

Chapter delete, replace:
```tsx
<button
  aria-label="Xoá chương"
  className="shrink-0 text-muted-foreground hover:text-destructive"
  disabled={disabled}
  onClick={() => onRemoveChapter(chapter.key)}
  type="button"
>
  <Trash2 aria-hidden="true" className="size-3.5" />
</button>
```
with:
```tsx
<Button
  aria-label="Xoá chương"
  className="shrink-0"
  disabled={disabled}
  onClick={() => onRemoveChapter(chapter.key)}
  size="sm"
  variant="danger"
>
  <Trash2 aria-hidden="true" className="size-3.5" />
</Button>
```

"+ Thêm bài", replace:
```tsx
<button
  className="text-xs text-muted-foreground hover:text-foreground"
  disabled={disabled}
  onClick={() => onAddLesson(chapter.key, "article")}
  type="button"
>
  + Thêm bài
</button>
```
with:
```tsx
<Button disabled={disabled} onClick={() => onAddLesson(chapter.key, "article")} size="sm" variant="ghost">
  <Plus aria-hidden="true" className="size-3.5" />
  Thêm bài
</Button>
```
(`Plus` is already imported in this file.)

Lesson delete, replace:
```tsx
<button
  aria-label="Xoá bài"
  className="shrink-0 text-muted-foreground hover:text-destructive"
  disabled={disabled}
  onClick={() => onRemove(chapterKey, lesson.key)}
  type="button"
>
  <Trash2 aria-hidden="true" className="size-3.5" />
</button>
```
with:
```tsx
<Button
  aria-label="Xoá bài"
  className="shrink-0"
  disabled={disabled}
  onClick={() => onRemove(chapterKey, lesson.key)}
  size="sm"
  variant="danger"
>
  <Trash2 aria-hidden="true" className="size-3.5" />
</Button>
```

**Explicitly out of scope (leave as raw `<button>`), per spec §2 "Ngoài phạm vi":** the `GripVertical` drag-handle buttons in `curriculum-tree.tsx` and `course-picker.tsx`, the chapter/lesson title-select buttons (`onSelect(...)`), the context-menu backdrop-close button, and `inspector.tsx:941`'s row-selector button — none of these are directly comparable to `Button`'s action-button vocabulary.

- [ ] **Step 9: Typecheck and build lecturer**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass.

- [ ] **Step 10: Manual smoke check**

`pnpm --filter @codementor/lecturer dev`, open a course studio, confirm: chapter delete/lesson delete/collapse/"+ Thêm bài"/right-click menu all still work and now render with the shared `Button` look (icon + consistent sizing). Open an exercise studio and its list page, confirm "Giải thử"/"Mở studio"/"Xem & giải thử" links still navigate correctly. Open the articles list drawer, confirm "Xem trên client" still opens in a new tab.

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/button.tsx packages/ui/src/index.ts \
  "apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/exercises/page.tsx" \
  apps/lecturer/src/features/articles/articles-page.tsx \
  apps/lecturer/src/features/exercises/code-problem-form.tsx \
  apps/lecturer/src/features/courses/curriculum-tree.tsx
git commit -m "$(cat <<'EOF'
refactor(lecturer): unify button styling across studios

Extract buttonClassName from Button so Link-as-button spots share the
same class table instead of hand-copying it, and convert the raw
action buttons (delete/add/collapse/menu) to the shared Button with a
consistent size="sm" + icon convention.
EOF
)"
```

---

### Task 2: Standardize `DangerZone` presentation

**Files:**
- Modify: `apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx:686`
- Modify: `apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx:424`
- Modify: `apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx:213`

**Interfaces:** none (pure presentational wrapper change, `DangerZone` itself untouched).

- [ ] **Step 1: Courses studio**

In `courses/[id]/studio/page.tsx`, replace:
```tsx
<div className="lg:col-span-3">
  <DangerZone
```
with:
```tsx
<div className="mt-6 border-t border-border pt-6 lg:col-span-3">
  <DangerZone
```

- [ ] **Step 2: Roadmaps studio**

In `roadmaps/[id]/studio/page.tsx`, same replace:
```tsx
<div className="lg:col-span-3">
  <DangerZone
```
→
```tsx
<div className="mt-6 border-t border-border pt-6 lg:col-span-3">
  <DangerZone
```

- [ ] **Step 3: Exercises studio**

In `exercises/[id]/studio/page.tsx`, replace:
```tsx
<div className="mt-4">
  <DangerZone
```
with:
```tsx
<div className="mt-6 border-t border-border pt-6">
  <DangerZone
```

- [ ] **Step 4: Typecheck and build**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass.

- [ ] **Step 5: Manual smoke check**

Open all three studios, confirm the "Xoá …" card now sits with a visible top divider and consistent spacing wherever it appears (bottom of the "Thông tin" tab for courses/roadmaps, bottom of the brief-form pane for exercises).

- [ ] **Step 6: Commit**

```bash
git add "apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx"
git commit -m "$(cat <<'EOF'
style(lecturer): standardize DangerZone spacing across studios

Same top divider and spacing in all three, instead of a bare
lg:col-span-3 wrapper in two of them and mt-4 in the third.
EOF
)"
```

---

### Task 3: Breadcrumb dynamic titles

**Files:**
- Create: `packages/ui/src/breadcrumb-title-store.ts`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/lecturer/src/components/navigation/route-meta.ts`
- Modify: `apps/lecturer/src/components/layout/lecturer-topbar.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx`

**Interfaces:**
- Produces (from `@codementor/ui`): `setBreadcrumbTitle(slug: string, title: string): void`, `useBreadcrumbTitles(): Record<string, string>`, `<BreadcrumbTitle slug={string} title={string} />` (renders nothing, registers on mount/update).
- Produces: `breadcrumbFor(pathname: string, titles?: Record<string, string>): BreadcrumbItem[]` (route-meta.ts, second param added).

- [ ] **Step 1: Create the store**

Write `packages/ui/src/breadcrumb-title-store.ts`:

```ts
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
```

- [ ] **Step 2: Export from `packages/ui/src/index.ts`**

Add:
```ts
export { BreadcrumbTitle, setBreadcrumbTitle, useBreadcrumbTitles } from "./breadcrumb-title-store";
```
(place it near the existing `export { Breadcrumb } from "./breadcrumb";` line).

- [ ] **Step 3: Typecheck `packages/ui`**

Run: `pnpm --filter @codementor/ui typecheck`
Expected: passes.

- [ ] **Step 4: Thread `titles` through `route-meta.ts`**

In `apps/lecturer/src/components/navigation/route-meta.ts`, replace:
```ts
export function breadcrumbFor(pathname: string): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname, { titles: SEGMENT_LABELS });
}
```
with:
```ts
export function breadcrumbFor(
  pathname: string,
  titles: Record<string, string> = {},
): BreadcrumbItem[] {
  return breadcrumbTrail(ROUTES, pathname, { titles: { ...SEGMENT_LABELS, ...titles } });
}
```

- [ ] **Step 5: Wire the store into the topbar**

In `apps/lecturer/src/components/layout/lecturer-topbar.tsx`, change the import:
```tsx
import { AppTopbar, Breadcrumb, NotificationBell, ThemeMenu } from "@codementor/ui";
```
to:
```tsx
import { AppTopbar, Breadcrumb, NotificationBell, ThemeMenu, useBreadcrumbTitles } from "@codementor/ui";
```
Inside the component body, before the `return`, add:
```tsx
const breadcrumbTitles = useBreadcrumbTitles();
```
And change:
```tsx
breadcrumb={<Breadcrumb items={breadcrumbFor(pathname)} />}
```
to:
```tsx
breadcrumb={<Breadcrumb items={breadcrumbFor(pathname, breadcrumbTitles)} />}
```

- [ ] **Step 6: Register the title in course studio**

In `courses/[id]/studio/page.tsx`, add `BreadcrumbTitle` to the `@codementor/ui` import list. Immediately after the `StudioShell` opening tag's sibling — right after the top-level `<>` fragment starts (alongside `{unsavedDialog}`), add:
```tsx
<BreadcrumbTitle slug={id} title={meta.title || course.slug} />
```
(This line goes after the `if (!course || !meta) return ...` early-return guard, so `meta`/`course` are non-null there — i.e. right where `{unsavedDialog}` already sits, inside the final `return (<>...)`.)

- [ ] **Step 7: Register the title in roadmap studio**

Same pattern in `roadmaps/[id]/studio/page.tsx`:
```tsx
<BreadcrumbTitle slug={id} title={draft.title || roadmap.slug} />
```

- [ ] **Step 8: Register the title in exercise studio**

Same pattern in `exercises/[id]/studio/page.tsx`:
```tsx
<BreadcrumbTitle slug={id} title={draft.title || exercise.slug} />
```

- [ ] **Step 9: Typecheck and build**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass.

- [ ] **Step 10: Manual smoke check**

Open a course studio and check the topbar breadcrumb reads "Bảng điều khiển › Khóa học › \<tên khoá học thật\> › Studio" (four segments, with the real title) instead of stopping at "Studio". Edit the title field and confirm the breadcrumb updates live. Repeat for a roadmap and an exercise.

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/breadcrumb-title-store.ts packages/ui/src/index.ts \
  apps/lecturer/src/components/navigation/route-meta.ts \
  apps/lecturer/src/components/layout/lecturer-topbar.tsx \
  "apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx"
git commit -m "$(cat <<'EOF'
feat(lecturer): show the real record title in the breadcrumb

Add a dependency-free breadcrumb-title store to packages/ui (mirrors
apps/client's existing zustand-based one without adding the
dependency), thread it through route-meta.ts and the lecturer topbar,
and register each studio's title once its record loads.
EOF
)"
```

---

### Task 4: Shared draft-save hook, wired into all 3 existing studios

**Files:**
- Create: `apps/lecturer/src/hooks/use-studio-draft.ts`
- Modify: `apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx`

**Interfaces:**
- Produces: `draftStorageKey(kind: string, id: string): string`, `readDraft<T>(storageKey: string): StoredDraft<T> | null`, `writeDraft<T>(storageKey: string, value: T): void`, `clearDraft(storageKey: string): void`, `useDraftAutosave<T>(storageKey: string, current: T, opts: { ready: boolean; dirty: boolean }): void`, `interface StoredDraft<T> { value: T; savedAt: number }` — all from `@/hooks/use-studio-draft`.

- [ ] **Step 1: Write the hook**

Create `apps/lecturer/src/hooks/use-studio-draft.ts`:

```ts
"use client";

import { useEffect } from "react";

export interface StoredDraft<T> {
  value: T;
  savedAt: number;
}

export function draftStorageKey(kind: string, id: string): string {
  return `codementor:lecturer:${kind}-draft:${id}`;
}

/**
 * Khôi phục nháp là tiện ích thêm, không phải đường lưu chính — hỏng ở bất kỳ bước nào (hết
 * dung lượng, trình duyệt chặn localStorage, tab ẩn danh) chỉ có nghĩa là không khôi phục
 * được, đường "Lưu" ở đầu trang vẫn hoạt động bình thường.
 */
export function readDraft<T>(storageKey: string): StoredDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredDraft<T>) : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(storageKey: string, value: T): void {
  try {
    const draft: StoredDraft<T> = { value, savedAt: Date.now() };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // ignore — xem readDraft
  }
}

export function clearDraft(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore — xem readDraft
  }
}

/**
 * Ghi nháp mỗi khi có thay đổi chưa lưu, xoá khi khớp lại bản đã lưu. `ready` giữ hook im
 * lặng trước khi bản ghi gốc tải xong — nếu không, lần render đầu (current rỗng) sẽ xoá mất
 * một bản nháp hợp lệ trước khi effect đọc nó kịp. Đủ nhanh cho một bản nháp cỡ vài chục
 * trường — không cần debounce cho `localStorage.setItem` ở quy mô này.
 */
export function useDraftAutosave<T>(
  storageKey: string,
  current: T,
  opts: { ready: boolean; dirty: boolean },
): void {
  useEffect(() => {
    if (!opts.ready) return;
    if (opts.dirty) writeDraft(storageKey, current);
    else clearDraft(storageKey);
  }, [storageKey, current, opts.ready, opts.dirty]);
}
```

- [ ] **Step 2: Typecheck the new file in isolation**

Run: `pnpm --filter @codementor/lecturer typecheck`
Expected: passes (no other file imports it yet, so this only checks the new file compiles).

- [ ] **Step 3: Wire into course studio**

In `courses/[id]/studio/page.tsx`:

Remove the local `StoredDraft` interface and the `draftStorageKey`/`readDraft`/`writeDraft`/`clearDraft` functions (the block right after `remapSelection`, before `interface StoredDraft`... through the `clearDraft` function — i.e. delete lines defining `interface StoredDraft { meta, chapters, savedAt }` and the four functions built on it).

Add the import:
```ts
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
```

Change the `pendingDraft` state type from:
```tsx
const [pendingDraft, setPendingDraft] = useState<StoredDraft | null>(null);
```
to:
```tsx
const [pendingDraft, setPendingDraft] = useState<StoredDraft<{ meta: Meta; chapters: DraftChapter[] }> | null>(null);
```

In the load effect, replace:
```tsx
const draft = readDraft(id);
if (!draft) return;
if (signature(draft.meta, draft.chapters) === signature(toMeta(loaded), toDraft(loaded.chapters ?? []))) {
  clearDraft(id);
} else {
  setPendingDraft(draft);
}
```
with:
```tsx
const draft = readDraft<{ meta: Meta; chapters: DraftChapter[] }>(draftStorageKey("course", id));
if (!draft) return;
if (signature(draft.value.meta, draft.value.chapters) === signature(toMeta(loaded), toDraft(loaded.chapters ?? []))) {
  clearDraft(draftStorageKey("course", id));
} else {
  setPendingDraft(draft);
}
```

Replace the whole write-effect:
```tsx
useEffect(() => {
  if (!meta) return;
  if (signature(meta, chapters) === savedSignature) {
    clearDraft(id);
    return;
  }
  writeDraft(id, meta, chapters);
}, [id, meta, chapters, savedSignature]);
```
with:
```tsx
useDraftAutosave(
  draftStorageKey("course", id),
  { meta: meta as Meta, chapters },
  { ready: meta !== null, dirty: Boolean(meta) && signature(meta as Meta, chapters) !== savedSignature },
);
```
(Keep the comment above it about "no debounce" if it was on the deleted block — move it onto this call if desired; not required.)

In the restore-`Modal`'s "Khôi phục thay đổi" button, replace:
```tsx
onClick={() => {
  if (!pendingDraft) return;
  setMeta(pendingDraft.meta);
  setChapters(pendingDraft.chapters);
  setSelection(null);
  setPendingDraft(null);
}}
```
with:
```tsx
onClick={() => {
  if (!pendingDraft) return;
  setMeta(pendingDraft.value.meta);
  setChapters(pendingDraft.value.chapters);
  setSelection(null);
  setPendingDraft(null);
}}
```
And the "Bỏ qua" button / `onClose`, replace both occurrences of:
```tsx
clearDraft(id);
```
with:
```tsx
clearDraft(draftStorageKey("course", id));
```

- [ ] **Step 4: Typecheck course studio**

Run: `pnpm --filter @codementor/lecturer typecheck`
Expected: passes.

- [ ] **Step 5: Manual smoke check — course studio**

`pnpm --filter @codementor/lecturer dev`, open a course studio, edit the title, open devtools → Application → Local Storage, confirm a `codementor:lecturer:course-draft:<id>` key appears and updates as you type. Reload the page (simulating a crash before save) — confirm the "Phát hiện thay đổi chưa lưu" modal appears and "Khôi phục thay đổi" restores the edited title. Save — confirm the localStorage key is removed.

- [ ] **Step 6: Wire into roadmap studio**

In `roadmaps/[id]/studio/page.tsx`, add the import:
```ts
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
```
and `Modal`, `TriangleAlert` to the existing `@codementor/ui`/`lucide-react` imports (both already used by the course studio's modal — copy that same JSX shape below).

Add state:
```tsx
const [pendingDraft, setPendingDraft] = useState<StoredDraft<{ draft: Draft; picked: PickedCourse[] }> | null>(null);
```

Replace the load effect:
```tsx
useEffect(() => {
  let cancelled = false;
  api.roadmaps
    .get(id)
    .then((loaded) => {
      if (cancelled) return;
      apply(loaded);
    })
    .catch((cause: unknown) => {
      if (!cancelled) setError(describe(cause));
    });
  return () => {
    cancelled = true;
  };
}, [id, apply]);
```
with:
```tsx
useEffect(() => {
  let cancelled = false;
  api.roadmaps
    .get(id)
    .then((loaded) => {
      if (cancelled) return;
      apply(loaded);

      const freshDraft = toDraft(loaded);
      const freshPicked: PickedCourse[] = (loaded.courses ?? []).map((course) => ({
        courseId: course.courseId,
        title: course.title,
        status: course.status,
        durationHours: course.durationHours,
        isOptional: course.isOptional,
      }));
      const stored = readDraft<{ draft: Draft; picked: PickedCourse[] }>(draftStorageKey("roadmap", id));
      if (!stored) return;
      if (signature(stored.value.draft, stored.value.picked) === signature(freshDraft, freshPicked)) {
        clearDraft(draftStorageKey("roadmap", id));
      } else {
        setPendingDraft(stored);
      }
    })
    .catch((cause: unknown) => {
      if (!cancelled) setError(describe(cause));
    });
  return () => {
    cancelled = true;
  };
}, [id, apply]);
```

Replace the `unsavedDialog` block:
```tsx
// Trước early return: hook phải chạy ở mọi lần render.
const unsavedDialog = useUnsavedGuard(
  Boolean(roadmap && draft) &&
    signature(draft as Draft, picked) !==
      signature(
        toDraft(roadmap as Roadmap),
        ((roadmap as Roadmap).courses ?? []).map((course) => ({
          courseId: course.courseId,
          title: course.title,
          status: course.status,
          durationHours: course.durationHours,
          isOptional: course.isOptional,
        })),
      ),
);
```
with:
```tsx
// Trước early return: hook phải chạy ở mọi lần render.
const dirty =
  Boolean(roadmap && draft) &&
  signature(draft as Draft, picked) !==
    signature(
      toDraft(roadmap as Roadmap),
      ((roadmap as Roadmap).courses ?? []).map((course) => ({
        courseId: course.courseId,
        title: course.title,
        status: course.status,
        durationHours: course.durationHours,
        isOptional: course.isOptional,
      })),
    );
useDraftAutosave(draftStorageKey("roadmap", id), { draft: draft as Draft, picked }, {
  ready: Boolean(roadmap && draft),
  dirty,
});
const unsavedDialog = useUnsavedGuard(dirty);
```

Add the restore-modal JSX right after the opening `<>` in the final `return`, i.e. change:
```tsx
return (
  <>
  {unsavedDialog}
  <StudioShell
```
to:
```tsx
return (
  <>
  {unsavedDialog}
  <Modal
    description={
      pendingDraft
        ? `Bản nháp từ ${new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}, chưa kịp lưu vào hệ thống.`
        : undefined
    }
    footer={
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            clearDraft(draftStorageKey("roadmap", id));
            setPendingDraft(null);
          }}
          type="button"
          variant="outline"
        >
          Bỏ qua
        </Button>
        <Button
          onClick={() => {
            if (!pendingDraft) return;
            setDraft(pendingDraft.value.draft);
            setPicked(pendingDraft.value.picked);
            setPendingDraft(null);
          }}
          type="button"
        >
          Khôi phục thay đổi
        </Button>
      </div>
    }
    onClose={() => {
      clearDraft(draftStorageKey("roadmap", id));
      setPendingDraft(null);
    }}
    open={pendingDraft !== null}
    title="Phát hiện thay đổi chưa lưu"
    width="sm"
  >
    <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      Trang có vẻ đã bị tải lại hoặc mất mạng trước khi kịp lưu. Khôi phục để tiếp tục từ
      chỗ đang dở, hoặc bỏ qua để dùng đúng bản đã lưu trên hệ thống.
    </p>
  </Modal>
  <StudioShell
```

- [ ] **Step 7: Typecheck roadmap studio**

Run: `pnpm --filter @codementor/lecturer typecheck`
Expected: passes.

- [ ] **Step 8: Manual smoke check — roadmap studio**

Same steps as Step 5 but on a roadmap studio page, editing the title and reordering a course in "Khóa học trong lộ trình" before reloading.

- [ ] **Step 9: Wire into exercise studio**

In `exercises/[id]/studio/page.tsx`, add the import:
```ts
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
```
and add `Modal`, `TriangleAlert` to its existing `@codementor/ui`/`lucide-react` imports.

Add state:
```tsx
const [pendingDraft, setPendingDraft] = useState<StoredDraft<ExerciseDraft> | null>(null);
```

Replace the load effect:
```tsx
useEffect(() => {
  // Cờ hủy: rời trang trước khi request về thì response cũ không được ghi đè state
  // của màn hình kế tiếp.
  let cancelled = false;
  api.exercises
    .get(id)
    .then((loaded) => {
      if (cancelled) return;
      setExercise(loaded);
      setDraft(toDraft(loaded));
    })
    .catch((cause: unknown) => {
      if (!cancelled) setError(describe(cause));
    });
  return () => {
    cancelled = true;
  };
}, [id]);
```
with:
```tsx
useEffect(() => {
  // Cờ hủy: rời trang trước khi request về thì response cũ không được ghi đè state
  // của màn hình kế tiếp.
  let cancelled = false;
  api.exercises
    .get(id)
    .then((loaded) => {
      if (cancelled) return;
      const nextDraft = toDraft(loaded);
      setExercise(loaded);
      setDraft(nextDraft);

      const stored = readDraft<ExerciseDraft>(draftStorageKey("exercise", id));
      if (!stored) return;
      if (JSON.stringify(stored.value) === JSON.stringify(nextDraft)) {
        clearDraft(draftStorageKey("exercise", id));
      } else {
        setPendingDraft(stored);
      }
    })
    .catch((cause: unknown) => {
      if (!cancelled) setError(describe(cause));
    });
  return () => {
    cancelled = true;
  };
}, [id]);
```

Replace:
```tsx
// Trước early return: hook phải chạy ở mọi lần render.
const unsavedDialog = useUnsavedGuard(
  Boolean(exercise && draft) && JSON.stringify(draft) !== JSON.stringify(toDraft(exercise as Exercise)),
);
```
with:
```tsx
// Trước early return: hook phải chạy ở mọi lần render.
const dirty =
  Boolean(exercise && draft) && JSON.stringify(draft) !== JSON.stringify(toDraft(exercise as Exercise));
useDraftAutosave(draftStorageKey("exercise", id), draft as ExerciseDraft, {
  ready: Boolean(exercise && draft),
  dirty,
});
const unsavedDialog = useUnsavedGuard(dirty);
```

Add the restore-modal JSX after the opening `<>`:
```tsx
return (
  <>
  {unsavedDialog}
  <StudioShell
```
becomes:
```tsx
return (
  <>
  {unsavedDialog}
  <Modal
    description={
      pendingDraft
        ? `Bản nháp từ ${new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}, chưa kịp lưu vào hệ thống.`
        : undefined
    }
    footer={
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            clearDraft(draftStorageKey("exercise", id));
            setPendingDraft(null);
          }}
          type="button"
          variant="outline"
        >
          Bỏ qua
        </Button>
        <Button
          onClick={() => {
            if (!pendingDraft) return;
            setDraft(pendingDraft.value);
            setPendingDraft(null);
          }}
          type="button"
        >
          Khôi phục thay đổi
        </Button>
      </div>
    }
    onClose={() => {
      clearDraft(draftStorageKey("exercise", id));
      setPendingDraft(null);
    }}
    open={pendingDraft !== null}
    title="Phát hiện thay đổi chưa lưu"
    width="sm"
  >
    <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      Trang có vẻ đã bị tải lại hoặc mất mạng trước khi kịp lưu. Khôi phục để tiếp tục từ
      chỗ đang dở, hoặc bỏ qua để dùng đúng bản đã lưu trên hệ thống.
    </p>
  </Modal>
  <StudioShell
```

- [ ] **Step 10: Typecheck and build**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass.

- [ ] **Step 11: Manual smoke check — exercise studio**

Same steps as Step 5, on an exercise studio page.

- [ ] **Step 12: Commit**

```bash
git add apps/lecturer/src/hooks/use-studio-draft.ts \
  "apps/lecturer/src/app/(lecturer)/courses/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx" \
  "apps/lecturer/src/app/(lecturer)/exercises/[id]/studio/page.tsx"
git commit -m "$(cat <<'EOF'
feat(lecturer): share the draft-autosave mechanism across all studios

Extract course studio's inline localStorage draft logic into
apps/lecturer/src/hooks/use-studio-draft.ts and wire it into the
roadmap and exercise studios too, so a reload or crash mid-edit no
longer loses unsaved work on those two pages.
EOF
)"
```

---

### Task 5: Cross-pane drag-and-drop in the roadmap studio

**Files:**
- Modify: `apps/lecturer/src/features/roadmaps/course-picker.tsx`
- Modify: `apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx`

**Interfaces:**
- Produces: `addCourse(picked: PickedCourse[], course: CourseListItem): PickedCourse[]`, exported from `course-picker.tsx`.
- `PickedCourses` no longer owns a `DndContext` — it must be rendered inside one (the studio page now owns it).

- [ ] **Step 1: Extract `addCourse` and rewrite `CourseLibrary`'s items as draggable**

In `apps/lecturer/src/features/roadmaps/course-picker.tsx`, add to the `@dnd-kit/core` import:
```ts
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
```
(adds `useDraggable`, `useDroppable` to the existing list).

Add, right after the `PickedCourse` interface:
```ts
export function addCourse(picked: PickedCourse[], course: CourseListItem): PickedCourse[] {
  return [
    ...picked,
    {
      courseId: course.id,
      title: course.title,
      status: course.status,
      durationHours: course.durationHours,
      isOptional: false,
    },
  ];
}
```

In `CourseLibrary`, replace the local `add` function and its use:
```ts
const add = (course: CourseListItem) =>
  onChange([
    ...picked,
    {
      courseId: course.id,
      title: course.title,
      status: course.status,
      durationHours: course.durationHours,
      isOptional: false,
    },
  ]);
```
→ delete it (now `addCourse` above replaces it).

Replace the `<ul>` block that renders `list.visible`:
```tsx
<ul className="grid gap-2">
  {list.visible.map((course) => (
    <li
      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
      key={course.id}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{course.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {course.durationHours ? `${course.durationHours} giờ · ` : ""}
          {CONTENT_STATUS_LABELS[course.status]}
        </p>
      </div>
      <Button
        aria-label={`Thêm ${course.title}`}
        disabled={disabled}
        onClick={() => add(course)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
    </li>
  ))}
</ul>
```
with:
```tsx
<ul className="grid gap-2">
  {list.visible.map((course) => (
    <DraggableCourse
      course={course}
      disabled={disabled}
      key={course.id}
      onAdd={() => onChange(addCourse(picked, course))}
    />
  ))}
</ul>
```

Add the new sub-component, near `SortablePicked` at the bottom of the file:
```tsx
/**
 * Một dòng trong kho, kéo được sang pane lộ trình. Không `useSortable` — kho không tự sắp
 * xếp lại, nó chỉ là nguồn cho một cú thả.
 */
function DraggableCourse({
  course,
  disabled,
  onAdd,
}: {
  course: CourseListItem;
  disabled?: boolean;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${course.id}`,
    disabled,
  });

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
        isDragging ? "opacity-40" : ""
      }`}
      ref={setNodeRef}
    >
      <button
        aria-label={`Kéo ${course.title} vào lộ trình`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4 shrink-0 cursor-grab text-muted-foreground" />
        <span className="min-w-0">
          <p className="truncate text-sm font-medium">{course.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {course.durationHours ? `${course.durationHours} giờ · ` : ""}
            {CONTENT_STATUS_LABELS[course.status]}
          </p>
        </span>
      </button>
      <Button aria-label={`Thêm ${course.title}`} disabled={disabled} onClick={onAdd} size="sm" type="button" variant="outline">
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
    </li>
  );
}
```

- [ ] **Step 2: Make `PickedCourses` droppable instead of owning its own `DndContext`**

Replace the whole `PickedCourses` function:
```tsx
export function PickedCourses({ picked, onChange, disabled }: Omit<Props, "available">) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = picked.findIndex((course) => course.courseId === active.id);
    const to = picked.findIndex((course) => course.courseId === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(picked, from, to));
  };

  const total = picked.reduce((sum, course) => sum + (course.durationHours ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Khóa học trong lộ trình</h2>
          <span className="text-xs text-muted-foreground">
            {picked.length} khóa · {total > 0 ? `${total} giờ` : "chưa có thời lượng"}
          </span>
        </div>

        {picked.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có khóa học nào. Thêm từ cột bên phải.
          </p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext
              items={picked.map((course) => course.courseId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="grid gap-2">
                {picked.map((course, index) => (
                  <SortablePicked
                    course={course}
                    disabled={disabled}
                    index={index}
                    key={course.courseId}
                    onRemove={() =>
                      onChange(picked.filter((item) => item.courseId !== course.courseId))
                    }
                  />
                ))}
              </ol>
            </SortableContext>

            <SortableOverlay>
              {(activeId) => {
                const course = picked.find((item) => item.courseId === activeId);
                return course ? (
                  <p className="px-3 py-2 text-sm font-medium">{course.title}</p>
                ) : null;
              }}
            </SortableOverlay>
          </DndContext>
      )}
    </div>
  );
}
```
with:
```tsx
/**
 * Danh sách khóa học đã chọn. `DndContext` và `sensors` giờ nằm ở trang studio — pane này
 * chỉ khai báo nó là một vùng thả được (`useDroppable`) và một `SortableContext` để tự sắp
 * xếp lại, chứ không tự mở `DndContext` riêng như trước, vì kéo từ kho sang cần MỘT context
 * bao trùm cả hai pane.
 */
export function PickedCourses({ picked, onChange, disabled }: Omit<Props, "available">) {
  const { setNodeRef, isOver } = useDroppable({ id: "picked-pane" });
  const total = picked.reduce((sum, course) => sum + (course.durationHours ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Khóa học trong lộ trình</h2>
        <span className="text-xs text-muted-foreground">
          {picked.length} khóa · {total > 0 ? `${total} giờ` : "chưa có thời lượng"}
        </span>
      </div>

      <div className={`rounded-lg border p-1 ${dropZoneClasses(isOver)}`} ref={setNodeRef}>
        {picked.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có khóa học nào. Thêm từ cột bên phải, hoặc kéo khóa học vào đây.
          </p>
        ) : (
          <SortableContext items={picked.map((course) => course.courseId)} strategy={verticalListSortingStrategy}>
            <ol className="grid gap-2">
              {picked.map((course, index) => (
                <SortablePicked
                  course={course}
                  disabled={disabled}
                  index={index}
                  key={course.courseId}
                  onRemove={() => onChange(picked.filter((item) => item.courseId !== course.courseId))}
                />
              ))}
            </ol>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
```
Add `dropZoneClasses` to the `@/components/sortable` import at the top of the file (currently `import { DropIndicator, SortableOverlay, useSortableRow } from "@/components/sortable";` → add `dropZoneClasses`). `SortableOverlay` stays imported here only if still used elsewhere in the file — it moves to the page in the next step, so also **remove** `SortableOverlay` from this file's import once Step 3 relocates its only usage. `closestCenter`, `useSensor`, `useSensors`, `PointerSensor`, `KeyboardSensor`, `sortableKeyboardCoordinates`, `DndContext` are also no longer used in this file — remove them from the top imports too (keep `arrayMove` — still used by the page, not this file, so also removable here; the page will import it directly).

Final top-of-file imports for `course-picker.tsx` after this task:
```tsx
"use client";

import { useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button, Select, StatusBadge } from "@codementor/ui";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import { DropIndicator, dropZoneClasses, useSortableRow } from "@/components/sortable";
import type { CourseListItem } from "@/features/courses/types";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  type RoadmapCourseItem,
} from "@/features/roadmaps/types";
```
(`DragEndEvent` is kept only if still referenced in this file — it is not anymore after `onDragEnd` moved to the page, so drop it from this file's import too. `SortablePicked`'s own internals are unchanged.)

- [ ] **Step 3: Move `DndContext`/sensors/`onDragEnd`/overlay into the studio page**

In `apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx`, add imports:
```ts
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SortableOverlay } from "@/components/sortable";
```
and change the `course-picker` import to also pull `addCourse`:
```ts
import { addCourse, CourseLibrary, PickedCourses, type PickedCourse } from "@/features/roadmaps/course-picker";
```

Inside the component, before the `return`, add:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);

/**
 * Một `DndContext` cho cả hai pane: kéo từ "Kho khóa học" thả VÀO BẤT KỲ ĐÂU trong pane lộ
 * trình thì thêm vào cuối (giống hệt nút "+"); kéo trong pane lộ trình thì vẫn là sắp xếp
 * lại như trước. Chỉ "Kho khóa học" đăng ký `useDroppable`/`useDraggable`, nên `over` khác
 * null LUÔN LUÔN thuộc phía lộ trình — không cần kiểm thêm over.id.
 */
const onDragEnd = ({ active, over }: DragEndEvent) => {
  if (!over) return;
  const activeId = String(active.id);

  if (activeId.startsWith("pool:")) {
    const courseId = activeId.slice("pool:".length);
    const course = available.find((item) => item.id === courseId);
    if (!course || picked.some((item) => item.courseId === courseId)) return;
    setPicked(addCourse(picked, course));
    return;
  }

  if (active.id === over.id) return;
  const from = picked.findIndex((course) => course.courseId === active.id);
  const to = picked.findIndex((course) => course.courseId === over.id);
  if (from < 0 || to < 0) return;
  setPicked(arrayMove(picked, from, to));
};
```

Replace the `courses` tab body:
```tsx
{tab === "courses" ? (
  <Group orientation="horizontal" className="h-full">
    <Panel id="picked" defaultSize="55%" minSize="25%" className="min-h-0">
      <div className="h-full overflow-y-auto p-3">
        <PickedCourses disabled={locked} onChange={setPicked} picked={picked} />
      </div>
    </Panel>

    <ResizeHandle orientation="horizontal" />

    <Panel id="library" defaultSize="45%" minSize="20%" className="min-h-0">
      <div className="h-full overflow-y-auto p-3">
        <CourseLibrary
          available={available}
          disabled={locked}
          onChange={setPicked}
          picked={picked}
        />
      </div>
    </Panel>
  </Group>
) : (
```
with:
```tsx
{tab === "courses" ? (
  <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
    <Group orientation="horizontal" className="h-full">
      <Panel id="picked" defaultSize="55%" minSize="25%" className="min-h-0">
        <div className="h-full overflow-y-auto p-3">
          <PickedCourses disabled={locked} onChange={setPicked} picked={picked} />
        </div>
      </Panel>

      <ResizeHandle orientation="horizontal" />

      <Panel id="library" defaultSize="45%" minSize="20%" className="min-h-0">
        <div className="h-full overflow-y-auto p-3">
          <CourseLibrary
            available={available}
            disabled={locked}
            onChange={setPicked}
            picked={picked}
          />
        </div>
      </Panel>
    </Group>
    <RoadmapDragOverlay available={available} picked={picked} />
  </DndContext>
) : (
```

Add the overlay helper at the bottom of the page file, alongside `describe`:
```tsx
function RoadmapDragOverlay({ picked, available }: { picked: PickedCourse[]; available: CourseListItem[] }) {
  return (
    <SortableOverlay>
      {(activeId) => {
        if (activeId.startsWith("pool:")) {
          const course = available.find((item) => item.id === activeId.slice("pool:".length));
          return course ? <p className="px-3 py-2 text-sm font-medium">{course.title}</p> : null;
        }
        const course = picked.find((item) => item.courseId === activeId);
        return course ? <p className="px-3 py-2 text-sm font-medium">{course.title}</p> : null;
      }}
    </SortableOverlay>
  );
}
```

- [ ] **Step 4: Typecheck and build**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass. Pay attention to unused-import errors in `course-picker.tsx` — the typecheck will catch any import left over from Step 2 that's no longer referenced.

- [ ] **Step 5: Manual smoke check**

Open a roadmap studio, "Khóa học" tab. Confirm: (a) the "+" button on a pool course still adds it to the end of "Khóa học trong lộ trình"; (b) dragging a pool course's row (by its grip handle) and dropping it anywhere over the "Khóa học trong lộ trình" pane also appends it to the end, with a visible highlight on that pane while hovering and a drag preview under the cursor; (c) reordering within "Khóa học trong lộ trình" by drag still works exactly as before.

- [ ] **Step 6: Commit**

```bash
git add apps/lecturer/src/features/roadmaps/course-picker.tsx \
  "apps/lecturer/src/app/(lecturer)/roadmaps/[id]/studio/page.tsx"
git commit -m "$(cat <<'EOF'
feat(lecturer): drag courses from the pool into the roadmap

Lift the DndContext from PickedCourses up to the studio page so it
spans both panes, make pool rows draggable, and treat a drop anywhere
on the roadmap pane as equivalent to clicking its "+" button.
EOF
)"
```

---

### Task 6: Article studio route + read-only list drawer

**Files:**
- Modify: `apps/lecturer/src/features/articles/types.ts`
- Create: `apps/lecturer/src/features/articles/article-editor.tsx`
- Create: `apps/lecturer/src/app/(lecturer)/articles/[id]/studio/page.tsx`
- Modify: `apps/lecturer/src/features/articles/articles-page.tsx`

**Interfaces:**
- Consumes: `buttonClassName` (Task 1), `BreadcrumbTitle` (Task 3), `draftStorageKey`/`readDraft`/`clearDraft`/`useDraftAutosave`/`StoredDraft` (Task 4).
- Produces: `Draft` type (`features/articles/types.ts`), `ArticleEditor` component (`features/articles/article-editor.tsx`).

- [ ] **Step 1: Add the `Draft` type**

In `apps/lecturer/src/features/articles/types.ts`, add at the end:
```ts
/** Bản nháp đang sửa ở studio bài viết. */
export interface Draft {
  title: string;
  excerpt: string;
  takeaway: string;
  readMinutes: string;
  /** "" = chưa chọn chủ đề. */
  tagId: string;
  contentHtml: string;
}
```

- [ ] **Step 2: Extract the pure form into `article-editor.tsx`**

Create `apps/lecturer/src/features/articles/article-editor.tsx`:
```tsx
"use client";

import { RichTextEditor } from "@codementor/editor";
import { integer, maxLength } from "@codementor/utils";
import type { Tag } from "@/lib/api";
import type { Draft } from "./types";

/**
 * Form thuần, không tự tải gì cả — trang studio nạp bài viết và truyền `draft` xuống, y hệt
 * cách `ExerciseBriefForm`/`ExerciseCodeForm` làm việc với `exercises/[id]/studio`.
 */
export function ArticleEditor({
  draft,
  onChange,
  tags,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  tags: Tag[];
}) {
  return (
    <div className="grid gap-4">
      <Field label="Tiêu đề">
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          placeholder="Nhập tiêu đề bài viết…"
          value={draft.title}
        />
      </Field>

      <Field
        error={maxLength(draft.excerpt, 500, "Tóm tắt")}
        hint="Bắt buộc mới đăng được. Câu này cũng chính là nội dung thông báo gửi tới người học."
        label="Tóm tắt"
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, excerpt: event.target.value })}
          value={draft.excerpt}
        />
      </Field>

      <Field error={maxLength(draft.takeaway, 500, "Điểm rút ra")} label="Điểm rút ra">
        <textarea
          className="min-h-16 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, takeaway: event.target.value })}
          value={draft.takeaway}
        />
      </Field>

      <Field
        hint="Chip lọc ở trang bài viết lấy từ đây. Bài không có chủ đề vẫn hiện trong danh sách nhưng không lọc ra được."
        label="Chủ đề"
      >
        <select
          aria-label="Chủ đề"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          onChange={(event) => onChange({ ...draft, tagId: event.target.value })}
          value={draft.tagId}
        >
          <option value="">— Chưa chọn —</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        error={integer(draft.readMinutes, "Thời gian đọc", { min: 1, max: 1000 })}
        label="Thời gian đọc (phút)"
      >
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...draft, readMinutes: event.target.value.replace(/\D/g, "") })
          }
          value={draft.readMinutes}
        />
      </Field>

      <Field label="Nội dung">
        <RichTextEditor
          onChange={(html) => onChange({ ...draft, contentHtml: html })}
          placeholder="Viết nội dung bài viết…"
          value={draft.contentHtml}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck the new file in isolation**

Run: `pnpm --filter @codementor/lecturer typecheck`
Expected: passes.

- [ ] **Step 4: Create the studio route**

Create `apps/lecturer/src/app/(lecturer)/articles/[id]/studio/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Archive, Check, Eye, RotateCcw, Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import {
  BreadcrumbTitle,
  Button,
  Modal,
  ReasonButton,
  StatusBadge,
  buttonClassName,
  useToast,
} from "@codementor/ui";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
import { ArticleEditor } from "@/features/articles/article-editor";
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_TONES, type Article, type Draft } from "@/features/articles/types";
import { api, type Tag } from "@/lib/api";

/** Ứng dụng người học, để mở xem trước bài. */
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";

function toDraft(article: Article): Draft {
  return {
    title: article.title,
    excerpt: article.excerpt ?? "",
    takeaway: article.takeaway ?? "",
    readMinutes: article.readMinutes ? String(article.readMinutes) : "",
    tagId: article.tagId ?? "",
    contentHtml: article.contentHtml ?? "",
  };
}

function signature(draft: Draft): string {
  return JSON.stringify(draft);
}

export default function ArticleStudioPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savedSignature, setSavedSignature] = useState("");
  const [pendingDraft, setPendingDraft] = useState<StoredDraft<Draft> | null>(null);

  useEffect(() => {
    void api.tags.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.articles
      .detail(id)
      .then((loaded) => {
        if (cancelled) return;
        const nextDraft = toDraft(loaded);
        setArticle(loaded);
        setDraft(nextDraft);
        setSavedSignature(signature(nextDraft));

        const stored = readDraft<Draft>(draftStorageKey("article", id));
        if (!stored) return;
        if (signature(stored.value) === signature(nextDraft)) {
          clearDraft(draftStorageKey("article", id));
        } else {
          setPendingDraft(stored);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const dirty = Boolean(draft) && signature(draft as Draft) !== savedSignature;
  useDraftAutosave(draftStorageKey("article", id), draft as Draft, { ready: draft !== null, dirty });
  const unsavedDialog = useUnsavedGuard(dirty);

  if (error && !article) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!article || !draft) {
    return <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">Đang tải…</p>;
  }

  const act = async (action: () => Promise<unknown>, done: string) => {
    setSaving(true);
    try {
      await action();
      const loaded = await api.articles.detail(id);
      const nextDraft = toDraft(loaded);
      setArticle(loaded);
      setDraft(nextDraft);
      setSavedSignature(signature(nextDraft));
      toast.success(done);
    } catch (cause) {
      toast.error(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  const save = () =>
    act(async () => {
      await api.articles.update(id, {
        title: draft.title.trim() || undefined,
        excerpt: draft.excerpt.trim() || undefined,
        takeaway: draft.takeaway.trim() || undefined,
        readMinutes: draft.readMinutes ? Number(draft.readMinutes) : undefined,
        tagId: draft.tagId || undefined,
      });
      // Tiptap trả "<p></p>" cho tài liệu rỗng; ghi nó sẽ gắn content_ref cho một bài
      // trống — publish() cho qua, còn người đọc mở ra thấy trắng.
      if (draft.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0) {
        await api.articles.saveContent(id, draft.contentHtml);
      }
      setSavedAt(new Date());
    }, "Đã lưu");

  return (
    <>
      {unsavedDialog}
      <BreadcrumbTitle slug={id} title={draft.title || "Bài viết chưa đặt tên"} />

      <Modal
        description={
          pendingDraft
            ? `Bản nháp từ ${new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}, chưa kịp lưu vào hệ thống.`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                clearDraft(draftStorageKey("article", id));
                setPendingDraft(null);
              }}
              type="button"
              variant="outline"
            >
              Bỏ qua
            </Button>
            <Button
              onClick={() => {
                if (!pendingDraft) return;
                setDraft(pendingDraft.value);
                setPendingDraft(null);
              }}
              type="button"
            >
              Khôi phục thay đổi
            </Button>
          </div>
        }
        onClose={() => {
          clearDraft(draftStorageKey("article", id));
          setPendingDraft(null);
        }}
        open={pendingDraft !== null}
        title="Phát hiện thay đổi chưa lưu"
        width="sm"
      >
        <p className="text-sm text-muted-foreground">
          Trang có vẻ đã bị tải lại hoặc mất mạng trước khi kịp lưu. Khôi phục để tiếp tục từ
          chỗ đang dở, hoặc bỏ qua để dùng đúng bản đã lưu trên hệ thống.
        </p>
      </Modal>

      {/* Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản xem trước và bản người
          học đọc được dựng từ đúng một bộ luật trình bày. */}
      <Modal onClose={() => setPreviewing(false)} open={previewing} title="Xem trước bài viết" width="lg">
        <article>
          <h1 className="text-2xl leading-snug font-bold">{draft.title}</h1>
          {draft.excerpt ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{draft.excerpt}</p>
          ) : null}
          <div className="rich-text mt-6" dangerouslySetInnerHTML={{ __html: draft.contentHtml }} />
        </article>
      </Modal>

      <StudioShell
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedAt !== null && (
              <span aria-live="polite" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check aria-hidden="true" className="size-3.5 text-success" />
                Đã lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            )}
            <Button onClick={() => setPreviewing(true)} type="button" variant="outline">
              <Eye aria-hidden="true" className="size-4" />
              Xem trước
            </Button>
            {article.status === "published" && (
              <a className={buttonClassName("outline")} href={`${CLIENT_URL}/articles/${article.slug}`} rel="noreferrer" target="_blank">
                Xem trên client
              </a>
            )}
            <Button disabled={saving} onClick={() => void save()} type="button" variant="outline">
              <Save aria-hidden="true" className="size-4" />
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
            {article.status === "pending_review" ? (
              <Button
                disabled={saving}
                onClick={() => void act(() => api.articles.withdraw(id), "Đã hủy gửi duyệt")}
                type="button"
                variant="outline"
              >
                <Undo2 aria-hidden="true" className="size-4" />
                Hủy gửi duyệt
              </Button>
            ) : article.status === "archived" ? (
              <Button
                disabled={saving}
                onClick={() => void act(() => api.articles.restore(id), "Đã khôi phục")}
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Khôi phục
              </Button>
            ) : (
              <>
                <Button disabled={saving} onClick={() => void act(() => api.articles.submit(id), "Đã gửi duyệt")} type="button">
                  <Send aria-hidden="true" className="size-4" />
                  {article.status === "published" ? "Gửi duyệt lại" : "Gửi duyệt"}
                </Button>
                {article.status === "published" && (
                  <ReasonButton
                    confirmLabel="Gửi yêu cầu"
                    description="Bài viết vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
                    disabled={saving}
                    onConfirm={(reason) => act(() => api.articles.requestRemoval(id, reason), "Đã gửi yêu cầu")}
                    placeholder="Vì sao bạn muốn gỡ bài viết này xuống?"
                    title="Xin gỡ bài viết đang công khai?"
                  >
                    <Archive aria-hidden="true" className="size-4" />
                    Xin gỡ xuống
                  </ReasonButton>
                )}
              </>
            )}
          </div>
        }
        backHref="/articles"
        backLabel="Bài viết"
        rejectionReason={article.rejectionReason}
        slug={article.slug}
        status={
          <StatusBadge tone={ARTICLE_STATUS_TONES[article.status] ?? "neutral"}>
            {ARTICLE_STATUS_LABELS[article.status] ?? article.status}
          </StatusBadge>
        }
        title={draft.title || "Bài viết chưa đặt tên"}
      >
        <StudioScroll>
          <ArticleEditor draft={draft} onChange={setDraft} tags={tags} />
        </StudioScroll>
      </StudioShell>
    </>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
```

- [ ] **Step 5: Typecheck the new route**

Run: `pnpm --filter @codementor/lecturer typecheck`
Expected: passes.

- [ ] **Step 6: Rewrite `articles-page.tsx` — create flow navigates to the studio**

Add `useRouter` to the `next/navigation` import (currently none — add `import { useRouter } from "next/navigation";`), and call it inside the component: `const router = useRouter();`.

Remove now-dead state: `draft`, `previewing`, `savedAt`, and the `loadDraft`/`saveDraft` callbacks, and the `Editor`/`Field` functions at the bottom of the file (moved to `article-editor.tsx` in Step 2 — `articles-page.tsx` no longer renders a form at all).

Remove the `RichTextEditor` import (`@codementor/editor`) and the `ReviewNotice`, `RemovalPendingNotice` names from the `@/components/page/review-notice` import (keep `ReviewFlag` — still used in the table's `title` column cell). Remove `integer`, `maxLength` from the `@codementor/utils` import (no longer used here).

Add a dedicated create handler, replacing the inline `onClick` in the "Tạo bản nháp" button:
```tsx
const createArticle = async () => {
  setBusy(true);
  setError(null);
  try {
    const created = await api.articles.create({ title: newTitle.trim() });
    setNewTitle("");
    setCreating(false);
    router.push(`/articles/${created.id}/studio`);
  } catch (cause) {
    setError(describe(cause));
  } finally {
    setBusy(false);
  }
};
```
Change the button's `onClick` from:
```tsx
onClick={() =>
  void act(async () => {
    await api.articles.create({ title: newTitle.trim() });
    setNewTitle("");
    setCreating(false);
  })
}
```
to:
```tsx
onClick={() => void createArticle()}
```

Delete the whole "Xem trước bài viết" `<Modal>` block (it depended on `draft`/`previewing`, both removed — the studio route now owns its own preview modal).

- [ ] **Step 7: Convert the `drawer` prop to a read-only `DrawerDetail`**

Add to the `@codementor/ui` import: `DetailMeta, DetailRow, DetailSection, DrawerDetail, buttonClassName` (alongside the existing `Button, ManagePage, Modal, ReasonButton, Select, StatusBadge`).

Add to the `lucide-react` import: `FileText, Pencil, Sparkles` (keep everything already imported that's still used: `Archive, ExternalLink, Newspaper, Plus, RotateCcw, Send, Undo2` — drop `Check`, `FilePlus2`, `X` only if no longer referenced after this step; `Check`/`X` are still used by the create-modal's Huỷ/Tạo buttons and are NOT removed — verify against the final file. `FilePlus2` also stays, used by "Tạo bản nháp"). Add `Link` from `next/link`.

Replace the whole `drawer` prop:
```tsx
drawer={{
  title: (row) => row.title,
  description: (row) => ARTICLE_STATUS_LABELS[row.status] ?? row.status,
  width: "wide",
  body: (row) => (
    <Editor
      draft={draft}
      key={row.id}
      onChange={setDraft}
      onLoad={loadDraft}
      row={row}
      tags={tags}
    />
  ),
  footer: (row) => (
    ...
  ),
}}
```
with:
```tsx
drawer={{
  title: (row) => row.title,
  description: (row) => ARTICLE_STATUS_LABELS[row.status] ?? row.status,
  body: (row) => <ArticleDrawerBody row={row} />,
  footer: (row) => (
    <ArticleDrawerActions
      busy={busy}
      onRequestRemoval={(reason) => act(() => api.articles.requestRemoval(row.id, reason))}
      onRestore={() => act(() => api.articles.restore(row.id))}
      onSubmit={() => act(() => api.articles.submit(row.id))}
      onWithdraw={() => act(() => api.articles.withdraw(row.id))}
      row={row}
    />
  ),
}}
```
(`tags`/`useEffect` that loads them can also be removed now — `ArticleEditor`'s `tags` prop is only needed on the studio route, which loads its own.)

Add these two functions after the `ArticlesPage` component (same place `Editor`/`Field` used to be):
```tsx
function ArticleDrawerBody({ row }: { row: ArticleListItem }) {
  return (
    <DrawerDetail key={row.id} load={() => api.articles.detail(row.id)}>
      {(article) => (
        <>
          <DetailMeta>
            <DetailRow label="Slug" value={article.slug} />
            <DetailRow label="Trạng thái" value={ARTICLE_STATUS_LABELS[article.status] ?? article.status} />
            <DetailRow label="Chủ đề" value={row.tagName ?? "— chưa chọn —"} />
            <DetailRow label="Thời gian đọc" value={article.readMinutes ? `${article.readMinutes} phút` : "—"} />
            <DetailRow label="Tác giả" value={article.authorName ?? "—"} />
            <DetailRow label="Cập nhật" value={dateFormat.format(new Date(article.updatedAt))} />
          </DetailMeta>

          <DetailSection icon={FileText} title="Tóm tắt">
            {article.excerpt ? (
              <p className="text-sm">{article.excerpt}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có tóm tắt.</p>
            )}
          </DetailSection>

          {article.takeaway && (
            <DetailSection icon={Sparkles} title="Điểm rút ra">
              <p className="text-sm">{article.takeaway}</p>
            </DetailSection>
          )}

          <DetailSection icon={Newspaper} title="Nội dung">
            {article.contentHtml.replace(/<[^>]*>/g, "").trim().length > 0 ? (
              <div className="rich-text text-sm" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có nội dung.</p>
            )}
          </DetailSection>
        </>
      )}
    </DrawerDetail>
  );
}

function ArticleDrawerActions({
  row,
  busy,
  onSubmit,
  onWithdraw,
  onRestore,
  onRequestRemoval,
}: {
  row: ArticleListItem;
  busy: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  onRestore: () => void;
  onRequestRemoval: (reason: string) => void;
}) {
  return (
    <>
      {row.status === "pending_review" ? (
        <Button disabled={busy} onClick={onWithdraw} type="button" variant="outline">
          <Undo2 aria-hidden="true" className="size-4" /> Hủy gửi duyệt
        </Button>
      ) : row.status === "archived" ? (
        <Button disabled={busy} onClick={onRestore} type="button" variant="outline">
          <RotateCcw aria-hidden="true" className="size-4" /> Khôi phục
        </Button>
      ) : (
        <>
          <Button disabled={busy} onClick={onSubmit} type="button" variant="outline">
            <Send aria-hidden="true" className="size-4" />
            {row.status === "published" ? "Gửi duyệt lại" : "Gửi duyệt"}
          </Button>
          {row.status === "published" && (
            <ReasonButton
              confirmLabel="Gửi yêu cầu"
              description="Bài viết vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
              disabled={busy}
              onConfirm={onRequestRemoval}
              placeholder="Vì sao bạn muốn gỡ bài viết này xuống?"
              title="Xin gỡ bài viết đang công khai?"
            >
              <Archive aria-hidden="true" className="size-4" /> Xin gỡ xuống
            </ReasonButton>
          )}
        </>
      )}
      {row.status === "published" && (
        <a className={buttonClassName("outline")} href={`${CLIENT_URL}/articles/${row.slug}`} rel="noreferrer" target="_blank">
          <ExternalLink aria-hidden="true" className="size-4" /> Xem trên client
        </a>
      )}
      <Link className={buttonClassName()} href={`/articles/${row.id}/studio`}>
        <Pencil aria-hidden="true" className="size-4" /> Mở studio
      </Link>
    </>
  );
}
```

- [ ] **Step 8: Typecheck and build**

Run: `pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: both pass. This step will surface any leftover unused import from Steps 6–7 (e.g. `Check`/`X`/`FilePlus2` — confirm each is still used by the create-modal before removing it; only remove what the compiler flags as unused).

- [ ] **Step 9: Manual smoke check**

`pnpm --filter @codementor/lecturer dev`. On `/articles`: click "Bài viết mới", confirm it navigates straight to `/articles/<id>/studio` instead of opening a drawer. In the studio: edit fields, confirm "Lưu" works, "Xem trước" opens the preview modal with current draft content, submit/withdraw buttons behave as before, breadcrumb shows the real title, and reloading mid-edit offers to restore the draft (same as Task 4's other three). Back on `/articles`, click a row to open its drawer, confirm it now shows a read-only summary (slug/status/topic/excerpt/content) instead of an editable form, and "Mở studio" navigates to the same route.

- [ ] **Step 10: Commit**

```bash
git add apps/lecturer/src/features/articles/types.ts \
  apps/lecturer/src/features/articles/article-editor.tsx \
  "apps/lecturer/src/app/(lecturer)/articles/[id]/studio/page.tsx" \
  apps/lecturer/src/features/articles/articles-page.tsx
git commit -m "$(cat <<'EOF'
feat(lecturer): give articles a dedicated studio route

Articles were the only content type edited entirely inside a list-page
drawer. Add /articles/[id]/studio mirroring the other three studios
(StudioShell, breadcrumb title, draft-autosave), and turn the list
drawer into the same read-only DrawerDetail quick-view the other three
already use instead of duplicating the edit form there too.
EOF
)"
```

---

## Final check

- [ ] **Full workspace build**

Run: `pnpm --filter @codementor/ui typecheck && pnpm --filter @codementor/lecturer typecheck && pnpm --filter @codementor/lecturer build`
Expected: all pass. (Other apps — client, admin — are untouched by this plan; skip unless a shared `packages/ui` change is suspected to affect them, in which case also run `pnpm --filter @codementor/client typecheck` and `pnpm --filter @codementor/admin typecheck`.)

- [ ] **Push the branch** (only if the user asks for it — this plan stops at local commits per the original request to "commit thay đổi vào nhánh mới").
