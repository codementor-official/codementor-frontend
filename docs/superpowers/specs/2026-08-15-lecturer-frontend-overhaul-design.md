# Đại tu frontend Lecturer — Thiết kế

Ngày: 2026-08-15
Phạm vi: `apps/lecturer`, `packages/ui`, và phần `apps/web` bị kéo theo khi component được đưa lên dùng chung.
Không đụng backend.

---

## 1. Vấn đề

Sáu vấn đề, đo được trên code hiện tại:

1. **Bo góc loạn.** `packages/ui` đang dùng bốn thang cùng lúc: `rounded-xl` (`Card`, `Modal`),
   `rounded-lg` (`Button`, `DataTable`, popover theme), `rounded-md` (`Input`, `Select` box,
   `SegmentedTabs`, `StatusBadge`, `TablePagination`), `rounded-full` (`FilterBar`, `Select` pill).
2. **Padding thừa.** `LecturerShell` `p-4 sm:p-6` + `PageHeader` `mb-6` + `FilterBar` `mb-5` bọc
   trong `div.mb-4` của `ManagePage` → khoảng 96px chiều dọc bị tiêu trước khi thấy hàng dữ liệu đầu tiên.
3. **Ba trang quản lý dựng header ba khối rời.** `SegmentedTabs` nằm ngoài `ManagePage`, `PageHeader`
   nằm trong, `FilterBar` nằm dưới. Mỗi khối có margin riêng và chồng lên nhau.
4. **Drawer chỉ có metadata.** `<dl>` sáu dòng slug/độ khó/tác giả/cập nhật — không có nội dung
   thật của bài, khóa học, lộ trình. `api.X.get(id)` trả sẵn detail nhưng drawer không gọi.
5. **Kéo thả không có chỉ báo.** `curriculum-tree` và `course-picker` dùng `@dnd-kit` với đúng
   `opacity-50` trên item nguồn. Không `DragOverlay`, không đường chèn, không highlight vùng thả.
6. **Ba studio và trang giải thử dùng grid cứng.** `lg:grid-cols-[minmax(0,1fr)_380px]` —
   không kéo đổi tỉ lệ được, khác hẳn trang solve của web client.

Một vấn đề nền, phát hiện khi khảo sát và là điều kiện tiên quyết cho việc dùng chung component:

7. **Hai app dùng hai bộ token, và `apps/web` thiếu mapping.** `apps/lecturer` map đầy đủ token
   shadcn trong `@theme inline`. `apps/web` định nghĩa bộ riêng (`navy`, `surface`, `text-muted`,
   `border-soft`, `primary-tint`) và **không** map `--color-card`, `--color-foreground`,
   `--color-muted-foreground`, `--color-popover*`, `--color-destructive*`, `--color-ring`,
   `--color-input`. 31 file trong `apps/web` import `Modal`/`SideDrawer`/`DataTable`/`Input` từ
   `@codementor/ui`; các class `bg-card`, `text-muted-foreground`, `bg-popover` trong những
   component đó **không sinh ra CSS** ở web. Đây là bug có sẵn, không phải hệ quả của đợt đại tu.

---

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Một vocabulary token: **shadcn**. Component dùng chung viết bằng `bg-card`/`text-foreground`/`text-muted-foreground`. | `packages/ui` và lecturer đã dùng bộ này. Giá trị màu hai bên gần như trùng (`#18181b` ink ≡ foreground, `#ffffff` surface ≡ card) nên web không đổi hình thức. |
| D2 | Thang bo góc **2 bậc**: control 6px, surface 10px. | Phân tầng thị giác giữa nút và thẻ, đủ gần web client (10–12px) để hai app trông cùng nhà. |
| D3 | Solve lecturer: **3 pane + tab kéo thả**, bỏ mascot/AI/thảo luận. | Codey, trợ lý AI, thảo luận, `ProblemPicker` bên web chạy bằng dữ liệu giả. Bê sang lecturer là bê nội dung bịa. |
| D4 | Studio: **pane resize, tab cố định theo pane**. | Đủ để chỉnh tỉ lệ cây/inspector. Tab kéo qua lại giữa pane không có giá trị cho màn soạn thảo. |
| D5 | **Giữ `packages/ui` viết tay**, không cài shadcn/ui thật. | Repo không có `components.json`, `@radix-ui`, `cva`, `clsx`, `tailwind-merge`. Cài vào là viết lại 14 component + sửa 45 file import — một dự án riêng. |

---

## 3. Thiết kế

### 3.1 Token và bo góc

`packages/ui/src/theme.css` — thay khối radius:

```css
:root {
  --radius: 10px;
}
```

`@theme inline` của **cả hai** app (`apps/lecturer/src/app/globals.css`, `apps/web/src/app/globals.css`):

```css
--radius-sm:  4px;   /* chip, badge nhỏ */
--radius-md:  6px;   /* button, input, select, tab, checkbox */
--radius-lg: 10px;   /* card, table, panel, popover */
--radius-xl: 10px;   /* modal, drawer — bằng lg, không phồng */
```

Lecturer hiện tính radius bằng `calc(var(--radius) ± n)`; thay bằng giá trị tuyệt đối ở trên để
hai app không lệch nhau khi `--radius` đổi.

Sửa classname trong `packages/ui`:

| File | Trước | Sau |
|---|---|---|
| `card.tsx` | `rounded-xl` | `rounded-lg` |
| `modal.tsx` | `rounded-xl` | `rounded-lg` |
| `button.tsx` | `rounded-lg` | `rounded-md` |
| `filter-bar.tsx` | `rounded-full` (khung + nút lọc + nút xóa) | `rounded-md` |
| `select.tsx` | prop `shape: "pill" \| "box"` | bỏ prop, một hình dáng `rounded-md` |
| `data-table.tsx`, `segmented-tabs.tsx`, `input.tsx`, `status-badge.tsx` | — | giữ nguyên, đã đúng thang |

`Select` bỏ `shape`: **không call site nào truyền `shape="pill"`** (pill chỉ là giá trị mặc định),
còn `shape="box"` xuất hiện 18 lần ở 12 file — `code-problem-form` (lecturer);
`ai-tutor-workspace`, `authored-problems-tab`, `create-problem/code-problem-form`,
`submissions-tab`, `assignment-member-list`, `invite-member-modal`, `documents-tab`,
`settings-tab`, `exercises-tab`, `members-tab` (web); `rich-text-editor` (`packages/editor`).
Xoá prop rồi xoá 18 chỗ truyền — diff cơ học, typecheck bắt hết chỗ sót.

Giữ lại prop với đúng một giá trị hợp lệ thì đó là config cho thứ không bao giờ đổi, nên xoá hẳn.

`FilterBar` bỏ pill: 11 call site (`explore`, `practice`, `roadmap-filter-bar`, `study-group-board`,
`ManagePage`, …) **không đổi một dòng** — chỉ classname bên trong component đổi.

### 3.2 Mật độ

| Chỗ | Trước | Sau |
|---|---|---|
| `LecturerShell` `main` | `p-4 sm:p-6` | `px-4 py-4 sm:px-5` |
| `PageHeader` | `mb-6` | `mb-3` |
| `FilterBar` wrapper | `mb-5` (trong component) + `mb-4` (trong `ManagePage`) | `mb-3`, bỏ trùng lặp |
| `Card` / `CardContent` | `p-5` | `p-4` |
| `CardHeader` | `px-5 py-3.5` | `px-4 py-3` |
| `SideDrawer` body | `px-5 py-5 sm:px-6` | `px-4 py-4 sm:px-5` |
| `SideDrawer` header/footer | `px-5 py-4 sm:px-6` | `px-4 py-3 sm:px-5` |
| `DataTable` cell | `px-3 py-2.5` | `px-3 py-2` |
| `Modal` body | `px-5 py-4` | `px-4 py-4` |

`FilterBar` `mb-5` nằm trong chính component nên `ManagePage` bọc thêm `mb-4` là cộng dồn. Bỏ
`mb-5` khỏi component, để nơi gọi quyết định — đó là chỗ duy nhất biết cái gì đứng dưới nó.

### 3.3 Layout ba trang quản lý

Hai hàng thay vì ba khối:

```
┌──────────────────────────────────────────────────────────┐
│ Bài code   [Bài của tôi│Kho chung]        [+ Tạo bài code]│
├──────────────────────────────────────────────────────────┤
│ 🔍 Tìm theo tiêu đề hoặc slug…      [Bộ lọc 2] [Xóa lọc] │
└──────────────────────────────────────────────────────────┘
```

`ManagePage` nhận thêm:

```ts
tabs?: {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
};
```

`PageHeader` nhận thêm slot `center?: ReactNode` để `ManagePage` đặt tabs giữa title và action, giữ
một hàng flex-wrap.

**Bỏ prop `description` ở cả ba trang** — cả nhánh "của tôi" lẫn nhánh "công khai". Ba câu người
dùng chỉ đích danh:

- `"Bài code bạn là tác giả, mọi trạng thái."`
- `"Khóa học bạn soạn. Thời lượng là tổng thời lượng các bài."`
- `"Lộ trình bạn tạo. Thời lượng là tổng của các khóa học thành phần."`

và ba câu còn lại của nhánh công khai (`"Bài đã công khai của mọi giảng viên. Dùng nguyên bản hoặc
fork để sửa."` …). Giữ ba mà bỏ ba thì tab này có mô tả, tab kia không — lại là chính cái không
đồng nhất đang muốn dẹp. Thông tin trong các câu đó đã nằm ở tên tab và ở cột bảng.

`PageHeader.description` **giữ lại** trong API vì các trang studio đang dùng để hiện slug.

Ba file `app/(lecturer)/{exercises,courses,roadmaps}/page.tsx`: xoá khối `<div className="mb-4"><SegmentedTabs …/></div>`,
chuyển sang prop `tabs` của `ManagePage`, xoá prop `description`.

### 3.4 Drawer có nội dung thật

`api.exercises.get` / `api.courses.get` / `api.roadmaps.get` đã trả detail đầy đủ
(`content`, `chapters`, `courses`). Drawer chỉ cần nạp lười khi mở.

Component mới `packages/ui/src/drawer-detail.tsx`:

```ts
export function DrawerDetail<T>({
  load,          // () => Promise<T>
  children,      // (data: T) => ReactNode
  fallback,      // skeleton, mặc định ba dòng xám
}: DrawerDetailProps<T>)
```

Lo ba trạng thái: đang tải, lỗi (hiện message của backend, không thay bằng câu chung), có dữ liệu.
Huỷ request khi drawer đóng giữa chừng — cùng cờ `cancelled` như các trang studio đang làm.

Nội dung mỗi drawer:

- **Bài code** — metadata hiện có, cộng: đề bài render markdown, danh sách ngôn ngữ hỗ trợ,
  test case công khai (input/expected), giới hạn thời gian và bộ nhớ.
- **Khóa học** — cây chương → bài ở dạng chỉ đọc, thu gọn được, mỗi bài kèm loại và thời lượng;
  tổng chương/bài/giờ ở đầu.
- **Lộ trình** — khóa học theo đúng thứ tự trong lộ trình, kèm `StatusBadge` và số giờ; đánh dấu
  khóa chưa công khai vì đó là thứ chặn nút gửi duyệt.

Drawer khóa học và lộ trình đổi sang `width="wide"`; bài code giữ `default`.

### 3.5 Kéo thả có chỉ báo

```
kéo "Bài 2" xuống dưới "Bài 4":

  · Bài 1
  ┌ Bài 2 ┐  ← bản gốc: opacity-40 + viền đứt
  └───────┘
  · Bài 3
  · Bài 4
  ━━━━━━━━━  ← đường chèn 2px màu primary: thả ở ĐÂY
  · Bài 5
        ╔═══════════╗
        ║ ⠿ Bài 2   ║ ← DragOverlay bám con trỏ
        ╚═══════════╝

chương rỗng khi kéo qua: nền primary/5 + viền đứt primary
```

Ba mảnh, đặt ở `packages/ui/src/sortable.tsx`:

1. `useSortableRow({ id, data, disabled })` — bọc `useSortable`, trả về `ref`, `style`,
   `handleProps`, và `className` đã tính sẵn cho trạng thái đang kéo.
2. `<DropIndicator edge="top" | "bottom" />` — thanh 2px `bg-primary` tuyệt đối, hiện khi hàng
   đang là đích thả. Cạnh trên hay dưới suy ra từ `activeIndex` so với `overIndex`.
3. `<SortableDragOverlay>` — bọc `DragOverlay` của `@dnd-kit`, render bản sao hàng đang kéo với
   bóng đổ. Cần lưu `activeId` bằng `onDragStart` (hiện cả hai cây chỉ có `onDragEnd`).

Áp cho `curriculum-tree` (chương và bài, kể cả thả sang chương khác) và `course-picker`.
Vùng thả rỗng (`"Chương rỗng — kéo bài vào đây"`) đổi nền và viền khi `isOver`.

Không gom hai cây thành một component chung: cấu trúc dữ liệu khác nhau (cây hai tầng vs danh
sách phẳng hai cột). Chia sẻ ba mảnh trên là đủ.

### 3.6 Form soạn bài dùng chung

Đưa lên `packages/ui/src/form/`, đổi classname sang token shadcn (D1):

| Component | Nguồn | Dùng ở |
|---|---|---|
| `Section` | `apps/web/create-problem/code-problem-form.tsx:59` | cả hai app |
| `RemoveButton` | cùng file, dòng 85 | cả hai app |
| `RepeatableList` | rút từ khối tags / objectives / constraints | cả hai app |
| `TestCaseRow` | rút từ khối test case | cả hai app |
| `LanguageTabs` | rút từ khối chọn ngôn ngữ + editor theo tab | cả hai app |
| `MarkdownPreview` | khối `showPreview` | cả hai app |
| `fieldClasses` | `code-problem-form.tsx:104` | thay `components/form/field.tsx` của lecturer |

`apps/web/src/components/create-problem/{code-problem-form,theory-lesson-form}.tsx` import ngược
lại từ `@codementor/ui`; hành vi giữ nguyên.

**`CodeProblemForm` của lecturer** viết lại trên các component đó. Phần bổ sung so với hiện tại —
tất cả đều đã có chỗ chứa trong `ExerciseContent` nên lưu được ngay, không cần backend:

- `constraints: string[]` — ràng buộc
- `examples: { input, output, explanation? }[]` — ví dụ minh hoạ, tách khỏi test case
- `hints: { order, text, xpPenalty? }[]` — gợi ý
- Tab ngôn ngữ thay cho danh sách xếp chồng: hiện mỗi ngôn ngữ đẻ ra hai `CodeEditor` cao 150px
  và 180px xếp dọc, chọn 4 ngôn ngữ là 1320px cuộn.

Giữ nguyên kiến trúc controlled (`value` + `onChange`) — trang giữ state, form không tự lưu.

**`TheoryLessonForm` mới cho lecturer.** `LessonContent` đã có `summary`, `objectives`,
`contentHtml` nên form web port sang lưu được đủ. Dùng ở `Inspector` của course studio khi bài
đang chọn là `article`, thay cho `RichTextEditor` trần hiện tại. `ExerciseContent.theory` cũng có
sẵn ba trường đó, nên nếu backend nhận `kind: "theory"` thì đúng form này dùng lại được ở
exercise studio mà không sửa gì — nhưng **đợt này không làm route đó**, vì lecturer chưa có
`kind: "theory"` ở bất kỳ chỗ nào và thêm nó là thay đổi luồng nghiệp vụ, không phải thay đổi
giao diện.

### 3.7 Workspace resize dùng chung

Chuyển `apps/web/src/components/workspace/` → `packages/ui/src/workspace/`:

`pane.tsx`, `tab-bar.tsx`, `tab.tsx`, `resize-handle.tsx`, `workspace-context.tsx`, `types.ts`.

Generic hóa: `PaneId` và `TabKind` hiện là union cứng của trang solve
(`"left" | "editor" | "console" | "ai"`, `"description" | "discussion" | …`). Đổi thành `string`,
và `TAB_META` thành tham số của `WorkspaceProvider` thay vì hằng số trong package.

Giữ lại ở `apps/web`: `mascot-assistant`, `discussion-panel`, `problem-picker`, `language-dropdown` —
đều gắn với dữ liệu và tính năng riêng của web client.

`apps/lecturer/package.json` thêm `react-resizable-panels: ^4.12.2` (đã có sẵn trong web).

**`LecturerShell` đổi thành full-height:**

```
trước:  div.min-h-screen > div.min-h-screen.md:pl-64 > main.p-4
sau:    div.h-screen.flex.flex-col > div.flex-1.flex.flex-col.min-h-0.md:pl-64
          > Topbar (shrink-0)
          > main.flex-1.min-h-0.overflow-hidden
```

Trang danh sách tự bọc padding (`px-4 py-4 sm:px-5` + `overflow-y-auto`); studio và solve chiếm
trọn chiều cao còn lại.

**Bố cục bốn trang:**

```
COURSE STUDIO          ROADMAP STUDIO        EXERCISE STUDIO
┌────────┬─────────┐   ┌────────┬────────┐   ┌────────┬────────┐
│ Cây    │Inspector│   │Đã chọn │  Kho   │   │  Form  │Xem trước│
│ chương │         │   │(kéo)   │  khóa  │   │  soạn  │ + editor│
└────────┴─────────┘   └────────┴────────┘   └────────┴────────┘

SOLVE (lecturer)
┌──────────────────────────────────────────────┐
│ ← Bài code    [Chạy] [Chấm*]      Mở studio  │
├─────────────┬────────────────────────────────┤
│ Đề bài      │ Code              [ngôn ngữ]   │
│ (markdown)  │  monaco                        │
│  Ví dụ      ├────────────────────────────────┤
│             │ Testcase │ Kết quả             │
└─────────────┴────────────────────────────────┘
  * disabled — judge-service chưa có sandbox
```

Tab "Thông tin khóa học" / "Thông tin lộ trình" chuyển thành tab thứ hai của pane trái, thay cho
`SegmentedTabs` riêng một hàng phía trên.

Nút "Chấm bài" ở solve lecturer **giữ nguyên trạng thái disabled** với tooltip hiện tại. Một nút
bấm không làm gì tệ hơn không có nút, và judge sandbox là việc của Phase 5b.

---

## 4. Phạm vi thay đổi

**`packages/ui` — file mới**

`src/drawer-detail.tsx`, `src/sortable.tsx`, `src/form/{section,remove-button,repeatable-list,test-case-row,language-tabs,markdown-preview,field}.tsx`,
`src/workspace/{pane,tab-bar,tab,resize-handle,workspace-context,types}.tsx`, cập nhật `src/index.ts`.

**`packages/ui` — sửa**

`theme.css` (radius), `card.tsx`, `modal.tsx`, `button.tsx`, `filter-bar.tsx`, `select.tsx`,
`side-drawer.tsx`, `data-table.tsx`, `manage-page.tsx`, `page-header.tsx`.

**`apps/lecturer` — sửa**

`globals.css`, `components/layout/lecturer-shell.tsx`, `components/form/field.tsx` (xoá, thay bằng
bản dùng chung), `app/(lecturer)/{exercises,courses,roadmaps}/page.tsx`,
`app/(lecturer)/{exercises,courses,roadmaps}/[id]/studio/page.tsx`,
`app/(lecturer)/exercises/[id]/solve/page.tsx`, `features/courses/{curriculum-tree,inspector}.tsx`,
`features/roadmaps/course-picker.tsx`, `features/exercises/code-problem-form.tsx`,
`features/exercises/theory-lesson-form.tsx` (mới), `package.json`.

**`apps/web` — sửa**

`globals.css` (thêm `@theme inline` còn thiếu — sửa luôn bug ở mục 1.7),
`components/create-problem/{code-problem-form,theory-lesson-form}.tsx` (import từ package),
`app/solve/[exerciseId]/solve-workspace.tsx` + `components/workspace/*` (import từ package),
10 file bỏ `Select shape="box"`.

**`packages/editor` — sửa**

`src/rich-text-editor.tsx`: bỏ `shape="box"`. Đó là thay đổi duy nhất chạm vào package này.

**Không đụng:** backend, `packages/api-client`, `packages/auth`, `packages/types`,
`packages/utils`, `apps/admin`.

---

## 4b. Thứ tự phụ thuộc

Bảy mảng không độc lập. Thứ tự bắt buộc:

```
1. Token + radius (3.1)          ── nền cho mọi thứ, phải xong trước
2. Mật độ (3.2)                  ── cùng file với (1), làm luôn một lượt
        │
        ├── 3. Layout 3 trang quản lý (3.3)  ─┐
        │                                     ├── 4. Drawer nội dung (3.4)
        │                                     ┘   (cần ManagePage đã ổn định)
        │
        ├── 5. Sortable indicator (3.5)      ── độc lập, làm song song được
        │
        ├── 6. Form dùng chung (3.6)         ─┐
        │                                     ├── 7. Studio + solve (3.7)
        └── (workspace primitives)           ─┘   (cần cả form lẫn pane)
```

(3.5) không chạm gì của (3.3)/(3.4)/(3.6) nên tách nhánh riêng được.
(3.7) đụng `LecturerShell` nên phải là mảng cuối — nó đổi chiều cao của mọi trang.

## 5. Kiểm chứng

Không có test framework trong repo (không thư mục `test`/`__tests__`, không script `test` ở bất kỳ
`package.json` nào). Kiểm chứng bằng:

1. `pnpm typecheck` ở cả ba app và hai package — bắt hết call site lệch API
   (`Select.shape`, `PageHeader.center`, `ManagePage.tabs`, generic `PaneId`).
2. `pnpm build` — bắt lỗi Tailwind v4 không sinh class.
3. Kiểm tra mắt trên `apps/web` sau khi thêm mapping token: `Modal` và `SideDrawer` phải có nền
   đặc (trước đó trong suốt). Đây là cách xác nhận bug 1.7 đã sửa.
4. Kiểm tra mắt kéo thả: đường chèn phải xuất hiện đúng cạnh sẽ thả, kể cả khi kéo bài sang chương
   khác và khi thả vào chương rỗng.

---

## 6. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Thêm mapping token vào web làm lộ ra chỗ đang vô tình dựa vào việc class không sinh CSS | Giá trị mapping trùng với palette web (`--card` `#fff` ≡ `--color-surface`), nên đổi chỉ theo hướng "có nền" thay cho "trong suốt" |
| Generic hóa `PaneId`/`TabKind` làm mất type safety ở solve của web | `WorkspaceProvider` nhận type parameter; web truyền union cũ của nó, không mất gì |
| Đưa `create-problem` lên package rồi web đổi hình thức | Token map 1-1 (`navy`→`foreground`, `surface`→`card`, `text-muted`→`muted-foreground`), cùng giá trị ở cả light lẫn dark |
| `LecturerShell` chuyển sang `h-screen` làm vỡ trang dashboard/profile | Trang danh sách tự bọc `overflow-y-auto`; kiểm tra cả 5 route không-studio |

---

## 7. Đã cân nhắc rồi bỏ

- **Cài shadcn/ui thật.** Viết lại 14 component + sửa 45 file import. Là dự án riêng, không phải
  một phần của đợt đại tu này. (D5)
- **Gom `curriculum-tree` và `course-picker` thành một component sortable chung.** Một cây hai tầng
  có thả chéo nhánh, một danh sách phẳng hai cột. Trừu tượng hoá chung sẽ có nhiều prop hơn số
  dòng tiết kiệm được.
- **Bê `MascotAssistant`, `DiscussionPanel`, `ProblemPicker` sang lecturer.** Chạy bằng dữ liệu thật. (D3)
- **Thêm prop `shape` cho `FilterBar` để web giữ pill.** Người dùng đã chốt bỏ pill ở cả hai app.
- **Tab kéo thả giữa các pane trong studio.** Không có giá trị cho màn soạn thảo, đổi lại là
  `TabKind` phải định nghĩa lại cho từng studio. (D4)
