# Đồng bộ 3 (4) studio Lecturer — Thiết kế

Ngày: 2026-08-22
Phạm vi: `apps/lecturer`, `packages/ui`.
Không đụng backend.

---

## 1. Vấn đề

1. **Card "Xoá" trình bày khác nhau ở 3 studio.** Khoá học/lộ trình đặt `DangerZone` cuối tab
   "Thông tin" (`fieldset` 3 cột); bài code không có tab nên đặt ngay dưới pane đề bài, không có
   spacing/divider nhất quán với hai trang kia.
2. **Lưu tạm localStorage chỉ có ở studio khoá học.** `courses/[id]/studio/page.tsx` tự viết
   `draftStorageKey`/`readDraft`/`writeDraft`/`clearDraft` + modal khôi phục ngay trong file, không
   tách hook. Lộ trình và bài code không có gì — mất mạng/crash giữa chừng là mất hết thay đổi chưa lưu.
3. **Bài viết không có route studio.** Tạo/sửa toàn bộ qua `Modal` + `SideDrawer` chứa form ngay
   trên trang danh sách (`features/articles/articles-page.tsx`). Ba trang kia đều có
   `/[id]/studio`, drawer trên danh sách của chúng chỉ xem nhanh read-only rồi bấm mở studio.
4. **Breadcrumb không có tên thật.** `route-meta.ts` chỉ có `SEGMENT_LABELS` tĩnh
   (`{studio, solve}`) — không có cách nào một trang đăng ký tên bản ghi vừa tải (`"Cấu trúc dữ liệu
   cơ bản"`) vào breadcrumb. `apps/client` đã có sẵn cơ chế này (`breadcrumb-title-store.ts` +
   `<BreadcrumbTitle>`, dựng trên zustand) nhưng lecturer chưa có gì tương đương.
5. **Nút không nhất quán.** Hai chỗ `<Link>`/`<a>` tự tay chép lại y hệt class của
   `Button variant="outline" size="md"` (bài code "Giải thử", bài viết "Xem trên client") thay vì
   dùng chung. Nhiều nút hành động (xoá tham số/case, xoá chương/bài, "+ Thêm bài") là `<button>`
   tay thay vì `Button`, cỡ và variant không theo quy ước nào.
6. **Kho khoá học ở studio lộ trình không kéo được.** Pane "Khóa học trong lộ trình" đã kéo-thả sắp
   xếp lại được (dnd-kit). Pane "Kho khóa học" chỉ có nút "+" — không kéo từ kho thả sang được.

---

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Xoá: **không** thêm tab cho bài code. Chỉ chuẩn hoá trình bày `DangerZone` (full-width, spacing/divider nhất quán) tại vị trí sẵn có của mỗi trang. | Ít rủi ro, không đụng layout 2-pane cố định của bài code. |
| D2 | Draft-save: tách `useStudioDraft<T>` dùng chung, đặt tại `apps/lecturer/src/hooks/use-studio-draft.ts` (thư mục có sẵn, đang rỗng). Giữ nguyên chiến lược không debounce. | `apps/lecturer/src/hooks` đã tồn tại đúng cho việc này; không debounce đã được biện minh là đủ ở quy mô hiện tại. |
| D3 | Bài viết: tạo `articles/[id]/studio/page.tsx` dựng trên `StudioShell` dùng chung. Drawer trên danh sách đổi từ form-sửa sang `DrawerDetail` đọc nhanh, giống 3 trang kia. | Thống nhất kiến trúc 4 loại nội dung; giải quyết luôn yêu cầu "đồng bộ style drawer" vì lúc đó dùng chung nguyên component đọc nhanh, không còn là drawer chứa form riêng. |
| D4 | Breadcrumb: viết store dùng chung **không phụ thuộc zustand** (React `useSyncExternalStore` trên một map cấp module), đặt trong `packages/ui`, export `useBreadcrumbTitle`/`<BreadcrumbTitle>`. | Chỉ `apps/client` có zustand; không ép thêm dependency vào `packages/ui` cho một tính năng vài dòng. |
| D5 | Nút: export `buttonClassName(variant, size)` từ `packages/ui/src/button.tsx`, `Button` dùng lại chính helper đó. Hai chỗ Link-giả-button chuyển sang dùng helper. Các nút hành động rõ ràng (xoá, thêm, đóng/mở) chuyển sang `Button size="sm"` với variant phù hợp (`danger` cho xoá). | Không viết lại `Button` thành polymorphic — chỉ tách phần class ra để `<Link>` dùng chung, tối thiểu diff. |
| D6 | Kéo thả kho khoá học: bọc `CourseLibrary` + `PickedCourses` trong một `DndContext` chung, `useDraggable` cho item trong kho, `useDroppable` cho pane lộ trình, thả vào bất kỳ đâu trong pane → thêm vào **cuối** danh sách (giống hệt hành vi nút "+"). Giữ nguyên nút "+". | Phạm vi tối thiểu người dùng đã chọn — không cần drop-position-aware. |

**Ngoài phạm vi:** nút drag-handle của dnd-kit (course-picker, curriculum-tree) — không phải nút
hành động, đổi sang `Button` có rủi ro vỡ `{...handleProps}` mà không lợi gì về nhất quán.

---

## 3. Thiết kế

### 3.1 `DangerZone` — chuẩn hoá trình bày (D1)

Không đổi component `apps/lecturer/src/components/page/danger-zone.tsx`. Ở 3 nơi gọi nó
(`courses/[id]/studio`, `roadmaps/[id]/studio`, `exercises/[id]/studio`), bọc trong cùng một lớp
vỏ: `<div className="mt-6 border-t border-border pt-6">` thay cho `<div className="lg:col-span-3">`
(khoá học/lộ trình) hoặc `<div className="mt-4">` (bài code) hiện tại.

### 3.2 `useStudioDraft` (D2)

```ts
// apps/lecturer/src/hooks/use-studio-draft.ts
export function useStudioDraft<T>({
  storageKey,      // ví dụ `codementor:lecturer:course-draft:${id}`
  current,         // state hiện tại cần lưu tạm
  signature,        // chuỗi so khớp bản ghi đã tải với draft lưu trước đó
  savedSignature,   // chữ ký của lần lưu thành công gần nhất — khớp thì tự xoá draft
}: {
  storageKey: string;
  current: T;
  signature: string;
  savedSignature: string;
}): {
  pendingDraft: T | null;   // có khi vừa tải trang và tìm thấy draft cũ khác bản ghi hiện tại
  restore: () => void;
  discard: () => void;
}
```

Rút từ `courses/[id]/studio/page.tsx` (dòng ~92–238 hiện tại): `StoredDraft` shape, `readDraft`/
`writeDraft`/`clearDraft`, effect ghi trên `[current, signature, savedSignature]`, effect đọc lúc
tải. Modal hỏi "Bỏ qua / Khôi phục thay đổi" **ở lại từng trang** (nội dung câu hỏi khác nhau theo
loại bản ghi) nhưng dùng chung `pendingDraft`/`restore`/`discard` từ hook.

Áp dụng: khoá học (thay code inline hiện tại bằng hook, hành vi giữ nguyên), lộ trình, bài code,
và bài viết (studio mới, §3.3).

### 3.3 Article studio (D3)

Route mới `apps/lecturer/src/app/(lecturer)/articles/[id]/studio/page.tsx`. Bố cục:
`StudioShell` (back → `/articles`, title = article title, status badge, rejection reason) bọc
`Editor` (hàm hiện có trong `articles-page.tsx:409-513`, chuyển sang file riêng
`features/articles/article-editor.tsx` để route và (nếu còn cần) drawer cũ có thể dùng chung nếu
cần trong giai đoạn chuyển tiếp) + `DangerZone`/action tương ứng theo §3.1 + `useStudioDraft`
(§3.2) + `<BreadcrumbTitle>` (§3.4).

`articles-page.tsx`:
- Modal "Tạo bài viết": sau `api.articles.create` thành công, `router.push(\`/articles/${id}/studio\`)` thay vì mở drawer.
- `ManagePage`'s `drawer` prop: đổi từ `body: (row) => <Editor .../>` sang `DrawerDetail` với
  `DetailMeta`/`DetailRow`/`DetailSection` (giống `courses/page.tsx`, `exercises/page.tsx`,
  `roadmaps/page.tsx`), có một hàng/nút mở `/articles/${row.id}/studio`.

### 3.4 Breadcrumb dynamic title (D4)

`packages/ui/src/breadcrumb-title-store.ts` (mới):

```ts
type Listener = () => void;
let titles: Record<string, string> = {};
const listeners = new Set<Listener>();

export function setBreadcrumbTitle(slug: string, title: string) {
  if (titles[slug] === title) return;
  titles = { ...titles, [slug]: title };
  listeners.forEach((l) => l());
}

export function useBreadcrumbTitles(): Record<string, string> {
  return useSyncExternalStore(
    (onChange) => (listeners.add(onChange), () => listeners.delete(onChange)),
    () => titles,
  );
}

export function BreadcrumbTitle({ slug, title }: { slug: string; title: string }) {
  useEffect(() => setBreadcrumbTitle(slug, title), [slug, title]);
  return null;
}
```

Export cả ba từ `packages/ui/src/index.ts`. `apps/lecturer/src/components/navigation/route-meta.ts`:
`breadcrumbFor(pathname: string, titles: Record<string,string> = {})` → merge
`{ ...SEGMENT_LABELS, ...titles }`. `lecturer-topbar.tsx`: đọc `useBreadcrumbTitles()`, truyền vào
`breadcrumbFor(pathname, titles)`. Mỗi trong 4 trang studio render
`<BreadcrumbTitle slug={id} title={record.title ?? record.slug} />` một lần khi bản ghi đã tải.

Không đụng `apps/client`'s zustand store hiện có — hai cơ chế song song, không ảnh hưởng lẫn nhau.

### 3.5 Nút nhất quán (D5)

`packages/ui/src/button.tsx`: tách `variantClasses`/`sizeClasses` + hàm
`buttonClassName(variant: ButtonVariant = "default", size: ButtonSize = "md", className = "")`
dùng chung bởi cả `Button` component. Export `buttonClassName` từ `index.ts`.

- `exercises/[id]/studio/page.tsx` "Giải thử": `<Link className={buttonClassName("outline")}>`.
- `features/articles/articles-page.tsx` "Xem trên client": tương tự.
- Chuyển sang `Button size="sm"` (variant `danger` cho xoá, `ghost` cho toggle/menu):
  `features/exercises/code-problem-form.tsx` (xoá tham số, xoá test case),
  `features/courses/curriculum-tree.tsx` (xoá chương, xoá bài, "+ Thêm bài", menu-item, collapse-toggle),
  `features/courses/inspector.tsx` (nút raw còn lại).
- Không đụng drag-handle (`course-picker.tsx`, `curriculum-tree.tsx`) — xem "Ngoài phạm vi" ở §2.

### 3.6 Kéo thả kho khoá học (D6)

`roadmaps/[id]/studio/page.tsx`: một `<DndContext>` bọc cả `<CourseLibrary>` và `<PickedCourses>`
(hiện đang là hai cây riêng, `PickedCourses` tự có `DndContext` nội bộ — chuyển context lên trên,
`PickedCourses`/`CourseLibrary` nhận `sensors` qua prop hoặc dùng context cha).

`features/roadmaps/course-picker.tsx`:
- `CourseLibrary`: mỗi item bọc `useDraggable({ id: `pool:${course.id}` })`, giữ nguyên nút "+".
- `PickedCourses`: thêm `useDroppable({ id: "picked-pane" })` trên container `<ul>`/wrapper.
- `onDragEnd` hợp nhất: nếu `active.id` bắt đầu bằng `pool:` và `over` nằm trong pane picked (hoặc
  `over.id === "picked-pane"`) → gọi `add(course)` (hàm đã có, dòng ~140-150) thay vì `arrayMove`.
  Nếu cả `active`/`over` đều là item đã có trong picked → giữ nguyên `arrayMove` hiện tại.

---

## 4. Thứ tự thực hiện & commit

Nhánh: `feat/lecturer-studio-parity` (đã tạo). Một commit mỗi bước:

1. D5 — nút nhất quán (độc lập, không phụ thuộc gì khác).
2. D1 — vị trí card Xoá (độc lập).
3. D4 — breadcrumb store dùng chung (packages/ui) + wiring lecturer.
4. D2 — `useStudioDraft` hook + áp dụng cho khoá học (refactor, hành vi giữ nguyên), lộ trình, bài code.
5. D6 — kéo thả kho khoá học.
6. D3 — article studio route (dùng D1, D2, D4 vừa xong).

## 5. Kiểm thử

Không có test suite tự động cho các trang này (kiểm tra thủ công qua `pnpm dev` là cách hiện có
trong repo). Sau mỗi bước: `pnpm --filter @codementor/lecturer typecheck` +
`pnpm --filter @codementor/lecturer build`; bước 3 còn chạy `--filter @codementor/ui typecheck`.
