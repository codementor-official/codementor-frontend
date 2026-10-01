"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Layers3, Search } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import type { CoursePromotionProduct } from "@codementor/types";
import {
  Button,
  Card,
  CourseCover,
  CoursePrice,
  Modal,
  PageHeader,
  StatStrip,
  useToast,
} from "@codementor/ui";
import { inputClassName } from "@/components/form/field";
import { earningsApi } from "./api";

function localDate(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function discountedPrice(listPrice: number, percent: number) {
  return Math.max(
    1_000,
    Math.floor((listPrice * (100 - percent)) / 100_000) * 1_000,
  );
}

function state(item: CoursePromotionProduct) {
  if (item.promotionRequest?.status === "pending") return "pending";
  if (item.promotionRequest?.status === "rejected") return "rejected";
  if (!item.promotion) return "none";
  if (!item.promotion.isActive) return "paused";
  const now = Date.now();
  if (item.promotion.startsAt && new Date(item.promotion.startsAt).getTime() > now)
    return "scheduled";
  if (item.promotion.endsAt && new Date(item.promotion.endsAt).getTime() < now)
    return "ended";
  return "active";
}

const labels: Record<string, string> = {
  pending: "Chờ Admin duyệt",
  rejected: "Cần chỉnh sửa",
  none: "Chưa có khuyến mãi",
  paused: "Đang tạm dừng",
  scheduled: "Sắp diễn ra",
  ended: "Đã kết thúc",
  active: "Đang áp dụng",
};

function stateTone(value: string) {
  if (value === "active") return "border-success/30 bg-success/10 text-success";
  if (value === "pending" || value === "scheduled")
    return "border-primary/30 bg-primary/10 text-primary";
  if (value === "rejected")
    return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border bg-muted text-muted-foreground";
}

function promotionPeriod(item: CoursePromotionProduct) {
  const promotion = item.promotionRequest?.status === "pending" || item.promotionRequest?.status === "rejected"
    ? item.promotionRequest
    : item.promotion;
  if (!promotion?.startsAt || !promotion.endsAt) return "Chưa thiết lập lịch";
  return `${new Date(promotion.startsAt).toLocaleDateString("vi-VN")} – ${new Date(promotion.endsAt).toLocaleDateString("vi-VN")}`;
}

export function LecturerPromotionScreen() {
  const toast = useToast();
  const [items, setItems] = useState<CoursePromotionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("title");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [label, setLabel] = useState("Ưu đãi khóa học");
  const [discount, setDiscount] = useState(20);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await earningsApi.promotions());
      setError("");
    } catch (exception) {
      setError(apiErrorMessage(exception));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    return items
      .filter((item) => !needle || item.title.toLocaleLowerCase("vi").includes(needle))
      .filter((item) => filter === "all" || state(item) === filter)
      .sort((a, b) => {
        if (sort === "price_low") return a.listPriceVnd - b.listPriceVnd;
        if (sort === "price_high") return b.listPriceVnd - a.listPriceVnd;
        if (sort === "discount") return b.discountPercent - a.discountPercent;
        return a.title.localeCompare(b.title, "vi");
      });
  }, [filter, items, query, sort]);

  const candidates = items.filter(
    (item) => item.listPriceVnd > 1_000 && item.promotionRequest?.status !== "pending",
  );

  function startBatch() {
    if (!candidates.length) {
      toast.info("Không có khóa học trả phí phù hợp để gửi chương trình mới.");
      return;
    }
    const now = new Date();
    const end = new Date(now.getTime() + 14 * 86_400_000);
    setSelected([]);
    setLabel("Ưu đãi khóa học");
    setDiscount(20);
    setStartsAt(localDate(now));
    setEndsAt(localDate(end));
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const result = await earningsApi.batchPromotion({
        courseIds: selected,
        discountPercent: discount,
        label: label.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: true,
      });
      toast.success(
        `Đã gửi ${result.submitted} khóa học cho Admin duyệt. Giá bán trên Client chưa thay đổi.`,
      );
      setOpen(false);
      await load();
    } catch (exception) {
      toast.error(apiErrorMessage(exception));
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    total: items.length,
    pending: items.filter((item) => state(item) === "pending").length,
    active: items.filter((item) => state(item) === "active").length,
    rejected: items.filter((item) => state(item) === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BadgePercent}
        title="Khuyến mãi"
        description="Tạo ưu đãi cho khóa học của bạn. Mọi chương trình chỉ hiển thị với học viên sau khi Admin duyệt."
        action={
          <Button onClick={startBatch}>
            <Layers3 className="size-4" /> Tạo chương trình
          </Button>
        }
      />
      <StatStrip
        stats={[
          { label: "Khóa học trả phí", value: String(counts.total) },
          { label: "Chờ duyệt", value: String(counts.pending) },
          { label: "Đang áp dụng", value: String(counts.active) },
          { label: "Cần chỉnh sửa", value: String(counts.rejected) },
        ]}
      />
      <Card className="grid gap-3 p-4 md:grid-cols-[minmax(240px,1fr)_200px_180px]">
        <label className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <input
            aria-label="Tìm khóa học"
            className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm"
            placeholder="Tìm khóa học"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select className={inputClassName} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Mọi trạng thái</option>
          <option value="none">Chưa có khuyến mãi</option>
          <option value="pending">Chờ Admin duyệt</option>
          <option value="active">Đang áp dụng</option>
          <option value="scheduled">Sắp diễn ra</option>
          <option value="paused">Đang tạm dừng</option>
          <option value="ended">Đã kết thúc</option>
          <option value="rejected">Cần chỉnh sửa</option>
        </select>
        <select className={inputClassName} value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="title">Tên A–Z</option>
          <option value="discount">Giảm nhiều nhất</option>
          <option value="price_low">Giá thấp đến cao</option>
          <option value="price_high">Giá cao đến thấp</option>
        </select>
      </Card>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Đang tải khuyến mãi…</p>
      ) : !visible.length ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Không có khóa học phù hợp.</Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="w-[34%] px-4 py-3 font-semibold">Khóa học</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Giá bán</th>
                  <th className="w-[22%] px-4 py-3 font-semibold">Chương trình</th>
                  <th className="w-[16%] px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="w-[10%] px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((item) => {
                  const current = state(item);
                  const campaign = item.promotionRequest?.label ?? item.promotion?.label;
                  return (
                    <tr key={item.courseId} className="align-middle transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <CourseCover
                            src={item.coverImageUrl}
                            title={item.title}
                            className="h-14 w-24 shrink-0 rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground" title={item.title}>{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Mã {item.courseId.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CoursePrice
                          className="text-sm"
                          priceVnd={item.priceVnd}
                          listPriceVnd={item.listPriceVnd}
                        />
                        {item.discountPercent > 0 && (
                          <p className="mt-1 text-xs font-semibold text-success">Tiết kiệm {item.discountPercent}%</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate font-medium text-foreground" title={campaign ?? undefined}>
                          {campaign ?? "Chưa có chương trình"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{promotionPeriod(item)}</p>
                        {item.promotionRequest?.status === "rejected" && item.promotionRequest.reviewReason && (
                          <p className="mt-1 line-clamp-1 text-xs text-destructive" title={item.promotionRequest.reviewReason}>
                            Admin: {item.promotionRequest.reviewReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${stateTone(current)}`}>
                          {labels[current]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                          href={`/courses/${item.courseId}/studio?tab=metadata`}
                        >
                          Thiết lập
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <span>Hiển thị {visible.length} khóa học</span>
            <span>{filter === "all" ? "Tất cả trạng thái" : labels[filter]}</span>
          </div>
        </Card>
      )}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        width="lg"
        title="Tạo chương trình khuyến mãi"
        description="Chọn nhiều khóa học của bạn. Admin sẽ duyệt riêng từng đề xuất trước khi giá mới xuất hiện."
        footer={
          <>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button>
            <Button disabled={busy || !selected.length || !label.trim() || !startsAt || !endsAt || discount < 1 || discount > 99} onClick={() => void submit()}>
              {busy ? "Đang gửi…" : `Gửi ${selected.length} khóa học để duyệt`}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">Tên chương trình<input className={`${inputClassName} mt-1`} maxLength={60} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
            <label className="text-sm">Mức giảm (%)<input className={`${inputClassName} mt-1`} type="number" min={1} max={99} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></label>
            <div className="flex flex-wrap items-end gap-2">{[10, 20, 25, 30, 50].map((value) => <button key={value} type="button" className={discount === value ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary" : "rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary"} onClick={() => setDiscount(value)}>-{value}%</button>)}</div>
            <label className="text-sm">Bắt đầu<input className={`${inputClassName} mt-1`} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            <label className="text-sm">Kết thúc<input className={`${inputClassName} mt-1`} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
          </div>
          <div className="max-h-80 divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {candidates.map((item) => {
              const checked = selected.includes(item.courseId);
              return (
                <label key={item.courseId} className={checked ? "flex cursor-pointer items-center gap-3 bg-primary/5 p-3" : "flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50"}>
                  <input type="checkbox" checked={checked} onChange={() => setSelected((current) => checked ? current.filter((id) => id !== item.courseId) : [...current, item.courseId])} />
                  <CourseCover src={item.coverImageUrl} title={item.title} className="h-12 w-20" />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="text-xs text-muted-foreground">{item.promotion ? "Sẽ cập nhật ưu đãi hiện tại" : "Chưa có khuyến mãi"}</span></span>
                  <CoursePrice className="text-sm" priceVnd={discountedPrice(item.listPriceVnd, discount)} listPriceVnd={item.listPriceVnd} />
                </label>
              );
            })}
          </div>
          <p className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">Đã chọn <strong className="text-foreground">{selected.length}</strong> khóa học. Khóa miễn phí và khóa đang chờ duyệt không xuất hiện trong danh sách.</p>
        </div>
      </Modal>
    </div>
  );
}
