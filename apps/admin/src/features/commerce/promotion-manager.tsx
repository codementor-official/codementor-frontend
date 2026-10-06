"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import type { CoursePromotionProduct } from "@codementor/types";
import { Button, Card, CourseCover, CoursePrice, Modal, ServerPagination, useToast } from "@codementor/ui";
import { Layers3, Search, Sparkles } from "lucide-react";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi as api } from "./api";
import { inputClassName } from "./form-style";

function localDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function discountedPrice(listPrice: number, percent: number) {
  return Math.max(1_000, Math.floor(listPrice * (100 - percent) / 100_000) * 1_000);
}

type PromotionState = "none" | "pending" | "rejected" | "active" | "scheduled" | "ended" | "paused";

function promotionState(item: CoursePromotionProduct): PromotionState {
  if (item.promotionRequest?.status === "pending") return "pending";
  if (item.promotionRequest?.status === "rejected" && !item.promotion) return "rejected";
  if (!item.promotion) return "none";
  if (!item.promotion.isActive) return "paused";
  const now = Date.now();
  if (item.promotion.startsAt && new Date(item.promotion.startsAt).getTime() > now) return "scheduled";
  if (item.promotion.endsAt && new Date(item.promotion.endsAt).getTime() < now) return "ended";
  return "active";
}

const promotionStateLabel: Record<PromotionState, string> = {
  none: "Chưa có ưu đãi",
  pending: "Chờ Admin duyệt",
  rejected: "Đã từ chối",
  active: "Đang áp dụng",
  scheduled: "Sắp diễn ra",
  ended: "Đã kết thúc",
  paused: "Đang tạm dừng",
};

export function PromotionManager() {
  const request = useAdminApi();
  const toast = useToast();
  const [items, setItems] = useState<CoursePromotionProduct[]>([]);
  const [selected, setSelected] = useState<CoursePromotionProduct | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [promotionFilter, setPromotionFilter] = useState("all");
  const [sort, setSort] = useState("title");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("Ưu đãi khóa học");
  const [salePrice, setSalePrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCourseIds, setBulkCourseIds] = useState<string[]>([]);
  const [bulkQuery, setBulkQuery] = useState("");
  const [bulkDiscount, setBulkDiscount] = useState(20);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await api.promotions(request)) ?? []);
      setError("");
    } catch (exception) {
      setError(apiErrorMessage(exception));
    } finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    return items
      .filter((item) => !needle || `${item.title} ${item.authorName ?? ""}`.toLocaleLowerCase("vi").includes(needle))
      .filter((item) => {
        if (priceFilter === "free") return item.listPriceVnd === 0;
        if (priceFilter === "under_100") return item.listPriceVnd > 0 && item.listPriceVnd < 100_000;
        if (priceFilter === "100_200") return item.listPriceVnd >= 100_000 && item.listPriceVnd <= 200_000;
        if (priceFilter === "over_200") return item.listPriceVnd > 200_000;
        return true;
      })
      .filter((item) => promotionFilter === "all" || promotionState(item) === promotionFilter)
      .sort((a, b) => {
        if (sort === "price_low") return a.listPriceVnd - b.listPriceVnd;
        if (sort === "price_high") return b.listPriceVnd - a.listPriceVnd;
        if (sort === "discount") return b.discountPercent - a.discountPercent;
        return a.title.localeCompare(b.title, "vi");
      });
  }, [items, priceFilter, promotionFilter, query, sort]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / 20)));
  const pagedItems = visible.slice((currentPage - 1) * 20, currentPage * 20);
  const counts = useMemo(() => ({
    paid: items.filter((item) => item.listPriceVnd > 0).length,
    active: items.filter((item) => promotionState(item) === "active").length,
    scheduled: items.filter((item) => promotionState(item) === "scheduled").length,
    inactive: items.filter((item) => ["ended", "paused"].includes(promotionState(item))).length,
    pending: items.filter((item) => promotionState(item) === "pending").length,
  }), [items]);
  const bulkCandidates = useMemo(() => {
    const needle = bulkQuery.trim().toLocaleLowerCase("vi");
    return items.filter((item) => item.listPriceVnd > 1_000 && item.pendingPriceVnd == null)
      .filter((item) => item.promotionRequest?.status !== "pending")
      .filter((item) => !needle || `${item.title} ${item.authorName ?? ""}`.toLocaleLowerCase("vi").includes(needle));
  }, [bulkQuery, items]);
  function edit(item: CoursePromotionProduct) {
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    setSelected(item);
    setBulkOpen(false);
    setReviewing(false);
    setLabel(item.promotion?.label ?? "Ưu đãi khóa học");
    setSalePrice(item.salePriceVnd ? String(item.salePriceVnd) : "");
    setStartsAt(localDate(item.promotion?.startsAt) || localDate(now.toISOString()));
    setEndsAt(localDate(item.promotion?.endsAt) || localDate(twoWeeksLater.toISOString()));
    setActive(item.promotion?.isActive ?? true);
  }
  function review(item: CoursePromotionProduct) {
    setSelected(item);
    setReviewing(true);
    setReviewReason("");
  }
  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      await api.promotion(request, selected.courseId, { salePriceVnd: Number(salePrice), label: label.trim(), startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), isActive: active });
      toast.success(selected.pendingPriceVnd != null ? "Đã lưu đề xuất. Giá và khuyến mãi cần được duyệt cùng khóa học." : "Đã cập nhật khuyến mãi cho khóa học.");
      setSelected(null);
      await load();
    } catch (exception) { toast.error(apiErrorMessage(exception)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected) return;
    setBusy(true);
    try {
      await api.removePromotion(request, selected.courseId);
      toast.success(selected.pendingPriceVnd != null ? "Đã gửi yêu cầu gỡ cùng giá mới; cấu hình công khai chưa thay đổi." : "Đã gỡ khuyến mãi.");
      setSelected(null);
      await load();
    } catch (exception) { toast.error(apiErrorMessage(exception)); }
    finally { setBusy(false); }
  }
  function createPromotion() {
    const candidates = items.filter((item) => item.listPriceVnd > 1_000 && item.pendingPriceVnd == null && item.promotionRequest?.status !== "pending");
    if (!candidates.length) {
      toast.info("Không có khóa học phù hợp. Khóa miễn phí hoặc đang chờ duyệt không thể thêm vào chương trình theo lô.");
      return;
    }
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    setSelected(null);
    setBulkCourseIds([]);
    setBulkQuery("");
    setBulkDiscount(20);
    setLabel("Ưu đãi khóa học");
    setStartsAt(localDate(now.toISOString()));
    setEndsAt(localDate(twoWeeksLater.toISOString()));
    setActive(true);
    setBulkOpen(true);
  }
  function toggleBulkCourse(courseId: string) {
    setBulkCourseIds((current) => current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : [...current, courseId]);
  }
  async function saveBatch() {
    if (!bulkCourseIds.length) return;
    setBusy(true);
    try {
      const result = await api.batchPromotion(request, {
        courseIds: bulkCourseIds,
        discountPercent: bulkDiscount,
        label: label.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: active,
      });
      toast.success(`Đã áp dụng chương trình cho ${result?.updated ?? bulkCourseIds.length} khóa học.`);
      setBulkOpen(false);
      setBulkCourseIds([]);
      await load();
    } catch (exception) { toast.error(apiErrorMessage(exception)); }
    finally { setBusy(false); }
  }
  async function decide(approve: boolean) {
    const promotionRequest = selected?.promotionRequest;
    if (!promotionRequest) return;
    if (approve && promotionRequest.requiresPriceApproval) {
      toast.info("Khuyến mãi này gắn với giá đề xuất. Hãy mở Hàng chờ duyệt khóa học để duyệt toàn bộ cấu hình.");
      return;
    }
    setBusy(true);
    try {
      await api.decidePromotion(request, promotionRequest.id, approve, reviewReason.trim());
      toast.success(approve ? "Đã duyệt và áp dụng khuyến mãi theo lịch." : "Đã từ chối đề xuất và gửi lý do cho giảng viên.");
      setSelected(null);
      setReviewing(false);
      await load();
    } catch (exception) { toast.error(apiErrorMessage(exception)); }
    finally { setBusy(false); }
  }
  function applyDiscount(percent: number) {
    if (!selected) return;
    setSalePrice(String(Math.max(1_000, Math.floor((selected.pendingPriceVnd ?? selected.listPriceVnd) * (100 - percent) / 100_000) * 1_000)));
  }
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-primary/5 p-5">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm"><Sparkles className="size-5" /></span><div><p className="text-base font-semibold">Chương trình và đề xuất</p><p className="mt-0.5 text-sm text-muted-foreground">Tạo ưu đãi trực tiếp hoặc duyệt chương trình do giảng viên gửi lên.</p></div></div>
          <Button onClick={createPromotion}><Layers3 className="size-4" /> Tạo khuyến mãi cho nhiều khóa học</Button>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{counts.paid} khóa học trả phí · {counts.pending} chờ duyệt · {counts.active} đang áp dụng · {counts.scheduled} sắp diễn ra · {counts.inactive} tạm dừng hoặc đã kết thúc</p>
      </Card>
      <Card className="grid gap-3 p-4 md:grid-cols-[minmax(240px,1fr)_190px_190px_180px]">
        <label className="relative"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><input aria-label="Tìm khóa học khuyến mãi" className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm" placeholder="Tìm khóa học hoặc giảng viên" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} /></label>
        <select aria-label="Lọc khoảng giá" className={inputClassName} value={priceFilter} onChange={(event) => { setPage(1); setPriceFilter(event.target.value); }}><option value="all">Mọi mức giá</option><option value="free">Miễn phí</option><option value="under_100">Dưới 100.000 ₫</option><option value="100_200">100.000 ₫ – 200.000 ₫</option><option value="over_200">Trên 200.000 ₫</option></select>
        <select aria-label="Lọc trạng thái khuyến mãi" className={inputClassName} value={promotionFilter} onChange={(event) => { setPage(1); setPromotionFilter(event.target.value); }}><option value="all">Mọi khuyến mãi</option><option value="pending">Chờ Admin duyệt</option><option value="none">Chưa có ưu đãi</option><option value="active">Đang áp dụng</option><option value="scheduled">Sắp diễn ra</option><option value="paused">Đang tạm dừng</option><option value="ended">Đã kết thúc</option><option value="rejected">Đã từ chối</option></select>
        <select aria-label="Sắp xếp khóa học" className={inputClassName} value={sort} onChange={(event) => { setPage(1); setSort(event.target.value); }}><option value="title">Tên A–Z</option><option value="discount">Giảm nhiều nhất</option><option value="price_low">Giá thấp đến cao</option><option value="price_high">Giá cao đến thấp</option></select>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Đang tải sản phẩm…</p> : !visible.length ? <Card className="p-10 text-center text-sm text-muted-foreground">Không có khóa học phù hợp.</Card> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Khóa học</th><th className="px-4 py-3 font-medium">Giảng viên</th><th className="px-4 py-3 font-medium">Giá hiện tại</th><th className="px-4 py-3 font-medium">Chương trình</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 text-right font-medium">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedItems.map((item) => {
                  const state = promotionState(item);
                  return (
                    <tr key={item.courseId} className="align-middle hover:bg-muted/30">
                      <td className="px-4 py-3"><div className="flex min-w-64 items-center gap-3"><CourseCover src={item.coverImageUrl} title={item.title} className="h-14 w-24 shrink-0" /><div className="min-w-0"><p className="truncate font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.status}</p></div></div></td>
                      <td className="px-4 py-3 text-muted-foreground">{item.authorName ?? "Chưa có giảng viên"}</td>
                      <td className="px-4 py-3"><CoursePrice className="text-sm" priceVnd={item.priceVnd} listPriceVnd={item.listPriceVnd} /></td>
                      <td className="max-w-64 px-4 py-3"><p className="truncate font-medium">{item.promotionRequest?.status === "pending" ? item.promotionRequest.label : item.promotion?.label ?? "—"}</p>{item.promotion?.endsAt && <p className="mt-1 text-xs text-muted-foreground">Đến {new Date(item.promotion.endsAt).toLocaleString("vi-VN")}</p>}{item.promotionRequest?.status === "rejected" && item.promotionRequest.reviewReason && <p className="mt-1 line-clamp-1 text-xs text-destructive">{item.promotionRequest.reviewReason}</p>}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${state === "active" || state === "pending" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{promotionStateLabel[state]}</span></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-2">{state === "pending" && <Button onClick={() => review(item)}>Duyệt</Button>}{state === "pending" && item.promotion && <Button variant="outline" onClick={() => edit(item)}>Hiện tại</Button>}{state !== "pending" && <Button disabled={(item.pendingPriceVnd ?? item.listPriceVnd) === 0} variant={item.promotion ? "outline" : "default"} onClick={() => edit(item)}>{(item.pendingPriceVnd ?? item.listPriceVnd) === 0 ? "Miễn phí" : item.promotion ? "Quản lý" : "Thêm ưu đãi"}</Button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        <ServerPagination page={currentPage} total={visible.length} pageSize={20} disabled={loading || busy} onPageChange={setPage} /></Card>
      )}
      <Modal open={Boolean(selected) && !reviewing} onClose={() => !busy && setSelected(null)} title={selected?.promotion ? "Quản lý khuyến mãi" : "Thêm khóa học vào khuyến mãi"} description={selected?.title} footer={<><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Hủy</Button>{selected?.promotion && <Button variant="outline" disabled={busy} onClick={() => void remove()}>Gỡ khuyến mãi</Button>}<Button disabled={busy || !selected || !label.trim() || !startsAt || !endsAt || Number(salePrice) < 1000 || Number(salePrice) >= (selected?.pendingPriceVnd ?? selected?.listPriceVnd ?? 0)} onClick={() => void save()}>{busy ? "Đang lưu…" : selected?.promotion ? "Lưu thay đổi" : "Áp dụng khuyến mãi"}</Button></>}>
        {selected && <div className="space-y-5"><div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3"><CourseCover src={selected.coverImageUrl} title={selected.title} className="h-16 w-24" /><div><p className="text-xs text-muted-foreground">Giá niêm yết</p><CoursePrice priceVnd={selected.pendingPriceVnd ?? selected.listPriceVnd} /><p className="mt-1 text-xs text-muted-foreground">Giá ưu đãi chỉ thay đổi giá bán trong thời gian đã chọn.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Tên chương trình<input className={`${inputClassName} mt-1`} maxLength={60} value={label} onChange={(event) => setLabel(event.target.value)} /></label><label className="text-sm sm:col-span-2">Giá ưu đãi (VND)<input className={`${inputClassName} mt-1`} type="number" min={1000} step={1000} value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></label><div className="flex flex-wrap gap-2 sm:col-span-2"><span className="self-center text-xs text-muted-foreground">Giảm nhanh:</span>{[10, 20, 25, 30, 50].map((percent) => <button key={percent} type="button" onClick={() => applyDiscount(percent)} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">-{percent}%</button>)}</div><label className="text-sm">Bắt đầu<input className={`${inputClassName} mt-1`} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className="text-sm">Kết thúc<input className={`${inputClassName} mt-1`} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label></div><label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span><strong className="block">Cho phép áp dụng khuyến mãi</strong><span className="mt-0.5 block text-xs text-muted-foreground">Tắt lựa chọn này để tạm dừng ưu đãi nhưng vẫn giữ cấu hình.</span></span></label><div className="rounded-lg bg-primary/5 p-3 text-sm"><p className="font-medium">Xem trước giá hiển thị</p><CoursePrice className="mt-1" priceVnd={Number(salePrice) || (selected.pendingPriceVnd ?? selected.listPriceVnd)} listPriceVnd={selected.pendingPriceVnd ?? selected.listPriceVnd} /></div></div>}
      </Modal>
      <Modal open={bulkOpen} onClose={() => !busy && setBulkOpen(false)} width="lg" title="Tạo chương trình khuyến mãi" description="Chọn nhiều khóa học và áp dụng cùng mức giảm, tên chương trình và thời gian." footer={<><Button variant="outline" disabled={busy} onClick={() => setBulkOpen(false)}>Hủy</Button><Button disabled={busy || !bulkCourseIds.length || !label.trim() || !startsAt || !endsAt || bulkDiscount < 1 || bulkDiscount > 99} onClick={() => void saveBatch()}>{busy ? "Đang áp dụng…" : `Áp dụng cho ${bulkCourseIds.length} khóa học`}</Button></>}>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Tên chương trình<input className={`${inputClassName} mt-1`} maxLength={60} value={label} onChange={(event) => setLabel(event.target.value)} /></label><label className="text-sm">Mức giảm (%)<input aria-label="Mức giảm theo lô" className={`${inputClassName} mt-1`} type="number" min={1} max={99} value={bulkDiscount} onChange={(event) => setBulkDiscount(Number(event.target.value))} /></label><div className="flex flex-wrap items-end gap-2">{[10, 20, 25, 30, 50].map((percent) => <button key={percent} type="button" onClick={() => setBulkDiscount(percent)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${bulkDiscount === percent ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary hover:text-primary"}`}>-{percent}%</button>)}</div><label className="text-sm">Bắt đầu<input className={`${inputClassName} mt-1`} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className="text-sm">Kết thúc<input className={`${inputClassName} mt-1`} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label></div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span><strong className="block">Bật chương trình theo lịch</strong><span className="mt-0.5 block text-xs text-muted-foreground">Có thể lưu ở trạng thái tạm dừng và bật lại sau.</span></span></label>
          <div className="rounded-xl border border-border"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3"><label className="relative min-w-56 flex-1"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><input aria-label="Tìm khóa học để thêm" className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm" placeholder="Tìm khóa học hoặc giảng viên" value={bulkQuery} onChange={(event) => setBulkQuery(event.target.value)} /></label><Button type="button" variant="outline" onClick={() => setBulkCourseIds((current) => bulkCandidates.every((item) => current.includes(item.courseId)) ? current.filter((id) => !bulkCandidates.some((item) => item.courseId === id)) : [...new Set([...current, ...bulkCandidates.map((item) => item.courseId)])])}>{bulkCandidates.length > 0 && bulkCandidates.every((item) => bulkCourseIds.includes(item.courseId)) ? "Bỏ chọn danh sách" : "Chọn tất cả kết quả"}</Button></div><div className="max-h-72 divide-y divide-border overflow-y-auto">{bulkCandidates.map((item) => { const checked = bulkCourseIds.includes(item.courseId); const preview = discountedPrice(item.listPriceVnd, bulkDiscount); return <label key={item.courseId} className={`flex cursor-pointer items-center gap-3 p-3 transition-colors ${checked ? "bg-primary/5" : "hover:bg-muted/50"}`}><input type="checkbox" checked={checked} onChange={() => toggleBulkCourse(item.courseId)} /><CourseCover src={item.coverImageUrl} title={item.title} className="h-12 w-20" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="block truncate text-xs text-muted-foreground">{item.authorName ?? "Chưa có giảng viên"}{item.promotion ? " · ưu đãi hiện tại sẽ được thay thế" : ""}</span></span><span className="grid shrink-0 grid-cols-2 gap-4 text-right"><span><span className="block text-2xs text-muted-foreground">Hiện tại</span><CoursePrice className="text-sm" priceVnd={item.priceVnd} listPriceVnd={item.listPriceVnd} /></span><span><span className="block text-2xs text-muted-foreground">Sau áp dụng</span><CoursePrice className="text-sm" priceVnd={preview} listPriceVnd={item.listPriceVnd} /></span></span></label>; })}{!bulkCandidates.length && <p className="p-8 text-center text-sm text-muted-foreground">Không có khóa học phù hợp.</p>}</div></div>
          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3 text-sm"><span><strong>{bulkCourseIds.length}</strong> khóa học đã chọn</span><span className="text-xs text-muted-foreground">Khóa đang chờ duyệt không được đưa vào thao tác theo lô.</span></div>
        </div>
      </Modal>
      <Modal open={Boolean(selected) && reviewing} onClose={() => !busy && setSelected(null)} title="Duyệt đề xuất khuyến mãi" description={selected?.title} footer={<><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Đóng</Button><Button variant="danger" disabled={busy || reviewReason.trim().length < 3} onClick={() => void decide(false)}>{selected?.promotionRequest?.requiresPriceApproval ? "Từ chối cả giá & ưu đãi" : "Từ chối"}</Button><Button disabled={busy || reviewReason.trim().length < 3 || selected?.promotionRequest?.requiresPriceApproval} onClick={() => void decide(true)}>Duyệt & áp dụng</Button></>}>
        {selected?.promotionRequest?.requiresPriceApproval && <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">Đề xuất gắn với giá mới {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selected.promotionRequest.basePriceVnd ?? 0)}. Duyệt đồng thời tại <a className="font-medium text-primary underline" href="/moderation">Hàng chờ duyệt khóa học</a>. Từ chối ở đây sẽ hủy cả giá đề xuất và khuyến mãi, giữ nguyên cấu hình công khai.</div>}
        {selected?.promotionRequest && <div className="space-y-4 text-sm"><div className="rounded-lg border border-border bg-muted/50 p-4"><p className="font-semibold">{selected.promotionRequest.action === "remove" ? "Yêu cầu gỡ khuyến mãi" : selected.promotionRequest.label}</p>{selected.promotionRequest.action === "upsert" && <dl className="mt-3 grid gap-2 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Giá đề xuất</dt><dd><CoursePrice priceVnd={selected.promotionRequest.salePriceVnd ?? selected.promotionRequest.basePriceVnd ?? selected.listPriceVnd} listPriceVnd={selected.promotionRequest.basePriceVnd ?? selected.listPriceVnd} /></dd></div><div><dt className="text-xs text-muted-foreground">Trạng thái mong muốn</dt><dd>{selected.promotionRequest.isActive ? "Bật khi đến lịch" : "Lưu nhưng tạm dừng"}</dd></div><div><dt className="text-xs text-muted-foreground">Bắt đầu</dt><dd>{selected.promotionRequest.startsAt ? new Date(selected.promotionRequest.startsAt).toLocaleString("vi-VN") : "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Kết thúc</dt><dd>{selected.promotionRequest.endsAt ? new Date(selected.promotionRequest.endsAt).toLocaleString("vi-VN") : "—"}</dd></div></dl>}</div><label className="block">Ghi chú duyệt<textarea className={`${inputClassName} mt-1 min-h-24`} value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Nêu lý do duyệt hoặc nội dung giảng viên cần chỉnh sửa (tối thiểu 3 ký tự)." /></label><p className="text-xs text-muted-foreground">Chỉ sau khi duyệt, giá ưu đãi mới được áp dụng trên Client. Nếu từ chối, giảng viên sẽ nhận được lý do để gửi lại.</p></div>}
      </Modal>
    </div>
  );
}
