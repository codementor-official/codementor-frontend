"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useEffect, useState } from "react";
import { Button, Card, CoursePrice, useToast } from "@codementor/ui";
import type { CourseOffer, CoursePromotionRequest } from "@codementor/types";
import { inputClassName } from "@/components/form/field";
import { earningsApi, vnd } from "./api";
export function PriceEditor({ id, status }: { id: string; status: string }) {
  const [price, setPrice] = useState("0");
  const [saved, setSaved] = useState<number | null>(null);
  const [offer, setOffer] = useState<CourseOffer | null>(null);
  const [promotionRequest, setPromotionRequest] = useState<CoursePromotionRequest | null>(null);
  const [label, setLabel] = useState("Ưu đãi khóa học");
  const [salePrice, setSalePrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  useEffect(() => {
    let active = true;
    void Promise.all([earningsApi.offer(id), earningsApi.promotions()])
      .then(([o, products]) => {
        if (active) {
          const request = products.find((item) => item.courseId === id)?.promotionRequest ?? null;
          setOffer(o);
          setPromotionRequest(request);
          setSaved(o.listPriceVnd);
          setPrice(String(o.listPriceVnd));
          setLabel(request?.action === "upsert" && request.label ? request.label : (o.promotion?.label ?? "Ưu đãi khóa học"));
          setSalePrice(request?.action === "upsert" && request.salePriceVnd ? String(request.salePriceVnd) : (o.salePriceVnd ? String(o.salePriceVnd) : ""));
          const local = (value: string | null | undefined) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
          const now = new Date();
          const twoWeeksLater = new Date(now.getTime() + 14 * 86_400_000);
          setStartsAt(local(request?.action === "upsert" ? request.startsAt : o.promotion?.startsAt) || local(now.toISOString()));
          setEndsAt(local(request?.action === "upsert" ? request.endsAt : o.promotion?.endsAt) || local(twoWeeksLater.toISOString()));
          setActive(request?.action === "upsert" ? Boolean(request.isActive) : (o.promotion?.isActive ?? true));
        }
      })
      .catch(() => {
        if (active) setError("Không tải được giá. Hãy tải lại trang.");
      });
    return () => {
      active = false;
    };
  }, [id]);
  const editable = ["draft", "changes_requested", "rejected"].includes(status);
  async function save() {
    setBusy(true);
    setError("");
    try {
      await earningsApi.price(id, Number(price));
      setSaved(Number(price));
      setOffer((current) => current ? { ...current, priceVnd: Number(price), listPriceVnd: Number(price), salePriceVnd: null, savingsVnd: 0, discountPercent: 0, promotion: null, pricingType: Number(price) ? "paid" : "free" } : current);
      toast.success("Đã lưu giá. Giá này sẽ theo khóa học khi gửi duyệt.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function savePromotion() {
    setBusy(true);
    setError("");
    try {
      await earningsApi.promotion(id, {
        salePriceVnd: Number(salePrice),
        label: label.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: active,
      });
      const next = await earningsApi.offer(id);
      const product = (await earningsApi.promotions()).find((item) => item.courseId === id);
      setOffer(next);
      setPromotionRequest(product?.promotionRequest ?? null);
      toast.success("Đã gửi đề xuất khuyến mãi cho Admin duyệt.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function removePromotion() {
    setBusy(true);
    try {
      await earningsApi.removePromotion(id);
      const next = await earningsApi.offer(id);
      const product = (await earningsApi.promotions()).find((item) => item.courseId === id);
      setOffer(next);
      setPromotionRequest(product?.promotionRequest ?? null);
      toast.success(offer?.promotion ? "Đã gửi yêu cầu gỡ khuyến mãi cho Admin duyệt." : "Đã hủy đề xuất khuyến mãi.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function applyDiscount(percent: number) {
    if (!saved) return;
    setSalePrice(String(Math.max(1_000, Math.floor(saved * (100 - percent) / 100_000) * 1_000)));
  }
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold text-foreground">Giá khóa học</h2>
      <p className="text-xs text-muted-foreground">
        Nhập 0 để phát hành miễn phí; giá lớn hơn 0 là mức học viên thanh toán
        một lần để mở toàn bộ khóa học.
      </p>
      <label className="block text-sm text-foreground">
        Giá (VND)
        <input
          className={`${inputClassName} mt-1`}
          type="number"
          min={0}
          max={1000000000}
          step={1000}
          value={price}
          disabled={!editable || busy || saved === null}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        {saved === null
          ? "Đang tải…"
          : saved === 0
            ? "Hiện miễn phí"
            : `Giá đã lưu: ${vnd(saved)}`}
        . Quyền học đã cấp trước đó vẫn được giữ.
      </p>
      {!editable && (
        <p className="text-xs text-muted-foreground">
          Chỉ thay đổi giá ở bản nháp hoặc bản được yêu cầu sửa.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        disabled={
          !editable ||
          busy ||
          saved === null ||
          price === "" ||
          !Number.isInteger(Number(price)) ||
          Number(price) < 0 ||
          Number(price) > 1000000000 ||
          Number(price) === saved
        }
        onClick={() => void save()}
      >
        {busy ? "Đang lưu…" : "Lưu giá"}
      </Button>
      {saved !== null && saved > 0 && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Quản lý khuyến mãi</h3>
              <p className="mt-1 text-xs text-muted-foreground">Đề xuất tên, giá và lịch ưu đãi cho khóa học. Thay đổi chỉ xuất hiện với học viên sau khi Admin duyệt.</p>
            </div>
            {offer && <CoursePrice priceVnd={offer.priceVnd} listPriceVnd={offer.listPriceVnd} />}
          </div>
          {promotionRequest?.status === "pending" && <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm"><p className="font-semibold text-primary">Đang chờ Admin duyệt</p><p className="mt-1 text-xs text-muted-foreground">Bạn có thể cập nhật đề xuất trong lúc chờ. Giá hiện tại trên Client chưa thay đổi cho đến khi Admin phê duyệt.</p></div>}
          {promotionRequest?.status === "rejected" && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"><p className="font-semibold text-destructive">Đề xuất cần chỉnh sửa</p><p className="mt-1 text-xs text-muted-foreground">{promotionRequest.reviewReason || "Admin chưa phê duyệt đề xuất này."}</p></div>}
          {offer?.promotion && promotionRequest?.status !== "pending" && promotionRequest?.status !== "rejected" && <div className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm"><p className="font-semibold text-success">Khuyến mãi đã được duyệt</p><p className="mt-1 text-xs text-muted-foreground">Ưu đãi đang theo lịch đã duyệt. Mọi chỉnh sửa hoặc yêu cầu gỡ sẽ được gửi lại cho Admin.</p></div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Tên chương trình<input className={`${inputClassName} mt-1`} maxLength={60} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
            <label className="text-sm">Giá ưu đãi (VND)<input className={`${inputClassName} mt-1`} type="number" min={1000} step={1000} value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></label>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><span className="text-xs text-muted-foreground">Giảm nhanh:</span>{[10, 20, 25, 30, 50].map((percent) => <button key={percent} type="button" onClick={() => applyDiscount(percent)} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">-{percent}%</button>)}</div>
            <label className="text-sm">Bắt đầu<input className={`${inputClassName} mt-1`} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            <label className="text-sm">Kết thúc<input className={`${inputClassName} mt-1`} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span><strong className="block">Cho phép áp dụng khuyến mãi</strong><span className="mt-0.5 block text-xs text-muted-foreground">Tắt để tạm dừng nhưng vẫn giữ tên, giá và lịch áp dụng.</span></span></label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || !label.trim() || !startsAt || !endsAt || !Number.isInteger(Number(salePrice)) || Number(salePrice) < 1000 || Number(salePrice) >= saved} onClick={() => void savePromotion()}>{busy ? "Đang gửi…" : promotionRequest?.status === "pending" ? "Cập nhật đề xuất" : offer?.promotion ? "Gửi thay đổi để duyệt" : "Gửi Admin duyệt"}</Button>
            {(offer?.promotion || promotionRequest?.status === "pending") && <Button type="button" variant="outline" disabled={busy} onClick={() => void removePromotion()}>{offer?.promotion ? "Gửi yêu cầu gỡ" : "Hủy đề xuất"}</Button>}
          </div>
          {salePrice && Number(salePrice) >= saved && <p className="text-xs text-destructive">Giá ưu đãi phải thấp hơn giá niêm yết.</p>}
        </div>
      )}
    </Card>
  );
}
