"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, Flame, Layers3, Search, Sparkles, Target, Trophy } from "lucide-react";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import { Card } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import { practiceItems, type PracticeItem, type PracticeStatus, type PracticeTopic } from "@/data/practice-items";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import { personalizedPractice, practiceRecommendationReason } from "@/lib/practice/practice-recommendation";
import type { Difficulty } from "@/components/ui/badge";

type DifficultyFilter = Difficulty | "all";
type TopicFilter = PracticeTopic | "all";
type StatusFilter = PracticeStatus | "all";
type SortMode = "recommended" | "popular" | "acceptance";
type CollectionKey = "interview" | "foundation" | "backend";

const TOPICS: TopicFilter[] = ["all", "Algorithms", "Frontend", "Backend", "Database", "Data & AI", "Mobile", "Foundation"];
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "todo", label: "Chưa làm" },
  { value: "attempted", label: "Đang làm" },
  { value: "solved", label: "Đã giải" },
];
const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "Mọi độ khó" },
  { value: "Cơ bản", label: "Cơ bản" },
  { value: "Trung bình", label: "Trung bình" },
  { value: "Nâng cao", label: "Nâng cao" },
];
const SORT_OPTIONS = [
  { value: "recommended", label: "Ưu tiên gợi ý" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "acceptance", label: "Tỷ lệ hoàn thành" },
];
const TOPIC_LABEL: Record<TopicFilter, string> = { all: "Tất cả chủ đề", Algorithms: "Thuật toán", Frontend: "Frontend", Backend: "Backend", Database: "Cơ sở dữ liệu", "Data & AI": "Data & AI", Mobile: "Mobile", Foundation: "Nền tảng" };
const PAGE_SIZE = 10;
const COLLECTIONS: Record<CollectionKey, {
  title: string;
  description: string;
  action: string;
  outcome: string;
  matches: (item: PracticeItem) => boolean;
}> = {
  interview: {
    title: "Top 100 phỏng vấn",
    description: "Các dạng dữ liệu, thuật toán và xử lý nghiệp vụ thường gặp khi phỏng vấn kỹ thuật.",
    action: "Bạn sẽ luyện mảng, chuỗi, cấu trúc dữ liệu, tối ưu truy vấn và các tình huống thiết kế API.",
    outcome: "Hoàn thành bộ này để có một danh sách ôn tập có thứ tự, từ nền tảng tới bài phân tích.",
    matches: (item) => item.goals.includes("interview") || item.topic === "Algorithms",
  },
  foundation: {
    title: "30 ngày nền tảng",
    description: "Mỗi ngày một bài ngắn để củng cố tư duy lập trình có hệ thống.",
    action: "Bạn sẽ hoàn thiện từng dạng cơ bản: điều kiện, mảng, chuỗi, OOP, Git và các thao tác dữ liệu.",
    outcome: "Mục tiêu là tạo thói quen giải bài đều đặn trước khi vào các bài phỏng vấn khó hơn.",
    matches: (item) => item.level === "basic" || item.topic === "Foundation",
  },
  backend: {
    title: "Thử thách Backend",
    description: "API, SQL và các bài toán hệ thống gần với công việc thực tế.",
    action: "Bạn sẽ thiết kế endpoint, kiểm tra dữ liệu, viết SQL, xử lý xác thực và suy nghĩ về hiệu năng hệ thống.",
    outcome: "Bộ này phù hợp để chuyển kiến thức backend thành các case có thể trình bày trong portfolio hoặc phỏng vấn.",
    matches: (item) => item.topic === "Backend" || item.topic === "Database",
  },
};

function difficultyClass(difficulty: Difficulty) {
  return difficulty === "Cơ bản" ? "text-success" : difficulty === "Trung bình" ? "text-accent" : "text-danger";
}

function statusIcon(status: PracticeStatus) {
  if (status === "solved") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "attempted") return <Circle className="h-4 w-4 text-accent" />;
  return <Circle className="h-4 w-4 text-text-faint" />;
}

function ProblemTableRow({ item, number, featured, favorite, onToggleFavorite }: {
  item: PracticeItem; number: number; featured?: string; favorite: boolean; onToggleFavorite: () => void;
}) {
  return (
    <div className={`group flex items-center gap-3 border-t border-border-soft px-3 py-3 transition-colors hover:bg-bg sm:px-4 ${item.isDaily ? "bg-accent-tint/35" : ""}`}>
      <span className="shrink-0">{statusIcon(item.status)}</span>
      <span className="hidden w-7 shrink-0 text-right text-xs tabular-nums text-text-faint md:block">{number}</span>
      <Link href={item.href ?? "/practice"} className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-navy group-hover:text-primary">{item.title}</span>
          {item.isDaily && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">Daily</span>}
          {featured && <span className="hidden rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold text-primary sm:inline">{featured}</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(item.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded bg-border-soft px-1.5 py-0.5 text-[10px] font-medium text-text-muted">{tag}</span>)}
        </div>
      </Link>
      <span className="hidden w-15 text-right text-xs tabular-nums text-text-muted lg:block">{item.acceptanceRate.toFixed(1)}%</span>
      <span className={`hidden w-20 text-right text-xs font-semibold sm:block ${difficultyClass(item.difficulty)}`}>{item.difficulty}</span>
      <span className="hidden w-12 text-right text-xs text-text-faint xl:block">{item.estimatedMinutes}p</span>
      <button type="button" aria-label={favorite ? "Bỏ lưu bài tập" : "Lưu bài tập"} onClick={onToggleFavorite} className={`shrink-0 rounded p-1.5 ${favorite ? "text-accent" : "text-text-faint hover:bg-border-soft hover:text-navy"}`}>
        <Bookmark className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

function TopicChip({ topic, active, count, onClick }: { topic: TopicFilter; active: boolean; count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${active ? "border-navy bg-navy text-white" : "border-border bg-surface text-text-muted hover:border-navy"}`}><span>{TOPIC_LABEL[topic]}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-border-soft text-text-faint"}`}>{count}</span></button>;
}

function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3" aria-label="Phân trang bài tập">
      <span className="text-xs text-text-faint">Trang {page} / {pageCount}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
        {Array.from({ length: pageCount }).map((_, index) => <button key={index + 1} type="button" onClick={() => onChange(index + 1)} className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${page === index + 1 ? "bg-navy text-white" : "text-text-muted hover:bg-bg"}`}>{index + 1}</button>)}
        <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">Sau</button>
      </div>
    </nav>
  );
}

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [collection, setCollection] = useState<CollectionKey | null>(null);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState(() => new Set(practiceItems.filter((item) => item.isFavorite).map((item) => item.id)));
  const preference = useLearningPreferenceStore((state) => state.preference);
  const recommendations = useMemo(() => personalizedPractice(practiceItems, preference), [preference]);

  const topicCounts = useMemo(() => Object.fromEntries(TOPICS.map((value) => [value, value === "all" ? practiceItems.length : practiceItems.filter((item) => item.topic === value).length])) as Record<TopicFilter, number>, []);
  const statusCounts = useMemo(() => Object.fromEntries(STATUS_OPTIONS.map(({ value }) => [value, value === "all" ? practiceItems.length : practiceItems.filter((item) => item.status === value).length])) as Record<StatusFilter, number>, []);
  const activeFilters = Number(topic !== "all") + Number(status !== "all") + Number(difficulty !== "all") + Number(collection !== null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sortValue = (item: PracticeItem) => sort === "popular" ? item.popularity : sort === "acceptance" ? item.acceptanceRate : item.popularity;
    return practiceItems
      .filter((item) => !collection || COLLECTIONS[collection].matches(item))
      .filter((item) => topic === "all" || item.topic === topic)
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => difficulty === "all" || item.difficulty === difficulty)
      .filter((item) => !query || `${item.title} ${item.desc} ${item.topic} ${(item.tags ?? []).join(" ")}`.toLowerCase().includes(query))
      .sort((left, right) => sortValue(right) - sortValue(left));
  }, [search, topic, status, difficulty, sort, collection]);

  const shouldShowRecommendations = !collection && !search.trim() && topic === "all" && status === "all" && difficulty === "all" && sort === "recommended";
  const recommendationIds = new Set(recommendations.map((item) => item.id));
  const tableItems = shouldShowRecommendations ? filteredItems.filter((item) => !recommendationIds.has(item.id)) : filteredItems;
  const pageCount = Math.max(1, Math.ceil(tableItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = tableItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCollection = collection ? COLLECTIONS[collection] : null;
  const solvedCount = practiceItems.filter((item) => item.status === "solved").length;
  const toggleFavorite = (id: string) => setFavorites((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const clearFilters = () => { setTopic("all"); setStatus("all"); setDifficulty("all"); setSearch(""); setSort("recommended"); setCollection(null); setPage(1); };
  const selectCollection = (key: CollectionKey) => { setCollection(key); setTopic("all"); setStatus("all"); setDifficulty("all"); setSearch(""); setSort("recommended"); setPage(1); };

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wide text-primary uppercase"><Layers3 className="h-3.5 w-3.5" /> Problem bank</div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Bài luyện tập</h1>
          <p className="mt-1 text-sm text-text-muted">Luyện theo chủ đề, lưu bài quan trọng và duy trì chuỗi giải bài mỗi ngày.</p>
        </div>
        <PersonalizationSettingsTrigger label="Điều chỉnh gợi ý" />
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => selectCollection("interview")} className={`rounded-xl bg-navy p-4 text-left text-white transition-transform hover:-translate-y-0.5 ${collection === "interview" ? "ring-2 ring-primary ring-offset-2" : ""}`}><div className="mb-5 flex items-center justify-between"><Trophy className="h-5 w-5 text-primary" /><ChevronRight className="h-4 w-4 text-zinc-400" /></div><div className="text-base font-bold">Top 100 phỏng vấn</div><p className="mt-1 text-xs leading-relaxed text-zinc-300">Các dạng dữ liệu, thuật toán và xử lý nghiệp vụ thường gặp.</p></button>
        <button type="button" onClick={() => selectCollection("foundation")} className={`rounded-xl bg-linear-to-br from-primary to-primary-hover p-4 text-left text-white transition-transform hover:-translate-y-0.5 ${collection === "foundation" ? "ring-2 ring-navy ring-offset-2" : ""}`}><div className="mb-5 flex items-center justify-between"><CalendarDays className="h-5 w-5" /><ChevronRight className="h-4 w-4 text-white/70" /></div><div className="text-base font-bold">30 ngày nền tảng</div><p className="mt-1 text-xs leading-relaxed text-white/80">Mỗi ngày một bài, củng cố tư duy lập trình có hệ thống.</p></button>
        <button type="button" onClick={() => selectCollection("backend")} className={`rounded-xl bg-linear-to-br from-accent to-orange-500 p-4 text-left text-white transition-transform hover:-translate-y-0.5 ${collection === "backend" ? "ring-2 ring-navy ring-offset-2" : ""}`}><div className="mb-5 flex items-center justify-between"><Flame className="h-5 w-5" /><ChevronRight className="h-4 w-4 text-white/70" /></div><div className="text-base font-bold">Thử thách Backend</div><p className="mt-1 text-xs leading-relaxed text-white/85">API, SQL và các bài toán hệ thống gần với công việc thực tế.</p></button>
      </div>

      {activeCollection && (
        <section className="mb-5 rounded-xl border border-primary/20 bg-primary-tint p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl"><div className="mb-1 flex items-center gap-2 text-xs font-bold text-primary"><Sparkles className="h-4 w-4" /> BỘ LUYỆN ĐANG CHỌN</div><h2 className="text-lg font-bold text-navy">{activeCollection.title}</h2><p className="mt-1 text-sm leading-relaxed text-text-muted">{activeCollection.description}</p></div>
            <button type="button" onClick={clearFilters} className="rounded-md border border-primary/30 bg-surface px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-tint">Thoát bộ luyện</button>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-lg bg-surface/80 p-3"><div className="mb-1 text-xs font-bold text-navy">Khi học bộ này, bạn sẽ làm gì?</div><p className="text-xs leading-relaxed text-text-muted">{activeCollection.action}</p></div><div className="rounded-lg bg-surface/80 p-3"><div className="mb-1 text-xs font-bold text-navy">Kết quả hướng tới</div><p className="text-xs leading-relaxed text-text-muted">{activeCollection.outcome}</p></div></div>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main className="min-w-0">
          <section className="mb-4 overflow-x-auto pb-1"><div className="flex min-w-max gap-2">{TOPICS.map((value) => <TopicChip key={value} topic={value} active={topic === value} count={topicCounts[value]} onClick={() => { setTopic(value); setCollection(null); setPage(1); }} />)}</div></section>

          <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4">
            {STATUS_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { setStatus(option.value); setCollection(null); setPage(1); }} className={`rounded-md px-3 py-2 text-xs font-semibold ${status === option.value ? "bg-primary-tint text-primary" : "text-text-muted hover:bg-bg"}`}>{option.label} <span className="ml-1 text-[10px] opacity-75">{statusCounts[option.value]}</span></button>)}
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            searchPlaceholder="Tìm theo tên bài, keyword, chủ đề..."
            activeFilterCount={activeFilters}
            onClearFilters={clearFilters}
            sheetTitle="Lọc bài tập"
            controls={<><Select label="Độ khó" value={difficulty} options={DIFFICULTY_OPTIONS} onChange={(value) => { setDifficulty(value as DifficultyFilter); setCollection(null); setPage(1); }} /><Select label="Sắp xếp" value={sort} options={SORT_OPTIONS} onChange={(value) => { setSort(value as SortMode); setPage(1); }} /></>}
          />

          <section id="problem-list" className="scroll-mt-5 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <div className="flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
              <Search className="h-4 w-4 text-text-faint" />
              <span className="flex-1 text-sm font-bold text-navy">Danh sách bài tập</span>
              <span className="hidden text-xs text-text-faint lg:block">Tỷ lệ đạt</span>
              <span className="hidden w-20 text-right text-xs text-text-faint sm:block">Độ khó</span>
              <span className="w-7" />
            </div>
            {shouldShowRecommendations && recommendations.length > 0 && <div className="flex items-center gap-2 border-b border-primary/20 bg-primary-tint px-4 py-2.5 text-xs font-semibold text-primary"><Sparkles className="h-4 w-4" /> Phù hợp nhất với bạn</div>}
            {shouldShowRecommendations && recommendations.map((item, index) => <ProblemTableRow key={`suggestion-${item.id}`} item={item} number={index + 1} featured={practiceRecommendationReason(item, preference)} favorite={favorites.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} />)}
            {shouldShowRecommendations && <div className="border-y border-border-soft bg-bg px-4 py-2 text-[11px] font-bold tracking-wide text-text-muted uppercase">Tất cả bài tập</div>}
            {paginatedItems.map((item, index) => <ProblemTableRow key={item.id} item={item} number={(currentPage - 1) * PAGE_SIZE + index + 1} favorite={favorites.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} />)}
            {filteredItems.length === 0 && <div className="p-10 text-center"><Target className="mx-auto mb-2 h-5 w-5 text-text-faint" /><p className="text-sm font-semibold text-navy">Chưa có bài phù hợp</p><p className="mt-1 text-xs text-text-faint">Thử thay đổi chủ đề, trạng thái hoặc từ khóa tìm kiếm.</p></div>}
            {tableItems.length > 0 && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <Card className="p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-navy">Chuỗi luyện tập</span><Flame className="h-4 w-4 text-accent" /></div><div className="mb-3 flex items-baseline gap-1"><span className="text-3xl font-bold text-primary">5</span><span className="text-xs text-text-faint">ngày liên tiếp</span></div><div className="grid grid-cols-7 gap-1.5">{[true, true, true, true, true, false, false].map((done, index) => <div key={index} className="text-center"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-primary text-white" : "bg-border-soft text-text-faint"}`}>{done ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="mt-1 block text-[9px] text-text-faint">T{index + 2}</span></div>)}</div><p className="mt-3 border-t border-border-soft pt-3 text-xs leading-relaxed text-text-muted">Giải thêm 1 bài hôm nay để giữ chuỗi và nhận 20 XP.</p></Card>
          <Card className="p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-navy">Tiến độ của bạn</span><span className="text-xs font-semibold text-primary">{solvedCount}/{practiceItems.length}</span></div><div className="mb-2 h-2 overflow-hidden rounded-full bg-border-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${(solvedCount / practiceItems.length) * 100}%` }} /></div><div className="flex justify-between text-[11px] text-text-faint"><span>{solvedCount} đã giải</span><span>{favorites.size} đã lưu</span></div></Card>
          <Card className="p-4"><h2 className="mb-3 text-sm font-bold text-navy">Từ khóa thịnh hành</h2><div className="flex flex-wrap gap-2">{["Array", "String", "SQL", "React", "REST API", "BFS/DFS", "OOP", "Dynamic Programming", "System design", "Git"].map((tag) => <button key={tag} type="button" onClick={() => { setSearch(tag); setCollection(null); setPage(1); }} className="rounded-full bg-bg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-primary-tint hover:text-primary">{tag}</button>)}</div></Card>
          <Card className="p-4"><h2 className="mb-2 text-sm font-bold text-navy">Nhu cầu tuyển dụng</h2><p className="mb-3 text-xs leading-relaxed text-text-muted">Các kỹ năng xuất hiện nhiều trong bộ bài phỏng vấn mock.</p><div className="flex flex-wrap gap-1.5">{["VNG", "MoMo", "Viettel", "FPT Software", "KMS", "NashTech"].map((company) => <span key={company} className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-text-muted">{company}</span>)}</div></Card>
        </aside>
      </div>
    </div>
  );
}
