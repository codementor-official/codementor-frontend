"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useEffect, useState } from "react";
import { Button, Card, CoursePrice, Field, fieldA11y, useFieldErrors, useToast } from "@codementor/ui";
import { integer, promotion as promotionRule, toNumber } from "@codementor/utils";
import type { CourseOffer, CoursePromotionRequest } from "@codementor/types";
import { inputClassName } from "@/components/form/field";
import { earningsApi, vnd } from "./api";
export function PriceEditor({ id, locked = false }: { id: string; locked?: boolean }) {
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
  // Bản sao `PriceDto` (0–1.000.000.000) và luật khuyến mãi dùng chung với Admin.
  const priceForm = useFieldErrors({ price }, { price: integer(price, "Giá", { min: 0, max: 1_000_000_000, optional: false }) });
  const promoForm = useFieldErrors(
    { label, salePrice, startsAt, endsAt },
    promotionRule({ label, startsAt, endsAt, salePrice, listPrice: offer ? (offer.pendingPriceVnd ?? offer.listPriceVnd) : undefined }),
  );
  const { reset: resetPrice } = priceForm;
  const { reset: resetPromo } = promoForm;
  useEffect(() => {
    let active = true;
    void Promise.all([earningsApi.offer(id), earningsApi.promotions()])
      .then(([o, products]) => {
        if (active) {
          const request = products.find((item) => item.courseId === id)?.promotionRequest ?? null;
          setOffer(o);
          setPromotionRequest(request);
          const editablePrice = o.pendingPriceVnd ?? o.listPriceVnd;
          setSaved(editablePrice);
          setPrice(String(editablePrice));
          setLabel(request?.action === "upsert" && request.label ? request.label : (o.promotion?.label ?? "Ưu đãi khóa học"));
          setSalePrice(request?.action === "upsert" && request.salePriceVnd ? String(request.salePriceVnd) : (o.salePriceVnd ? String(o.salePriceVnd) : ""));
          const local = (value: string | null | undefined) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
          const now = new Date();
          const twoWeeksLater = new Date(now.getTime() + 14 * 86_400_000);
          setStartsAt(local(request?.action === "upsert" ? request.startsAt : o.promotion?.startsAt) || local(now.toISOString()));
          setEndsAt(local(request?.action === "upsert" ? request.endsAt : o.promotion?.endsAt) || local(twoWeeksLater.toISOString()));
          setActive(request?.action === "upsert" ? Boolean(request.isActive) : (o.promotion?.isActive ?? true));
          // Giá trị vừa nạp là mốc "chưa sửa" — không tô đỏ thứ người dùng chưa đụng tới.
          resetPrice();
          resetPromo();
        }
      })
      .catch(() => {
        if (active) setError("Không tải được giá. Hãy tải lại trang.");
      });
    return () => {
      active = false;
    };
  }, [id, resetPrice, resetPromo]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void earningsApi.offer(id).then((next) => {
        if (!active) return;
        setOffer(next);
        setSaved(next.pendingPriceVnd ?? next.listPriceVnd);
        setPrice(String(next.pendingPriceVnd ?? next.listPriceVnd));
        resetPrice();
      }).catch(() => undefined);
    };
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [id, resetPrice]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await earningsApi.price(id, toNumber(price));
      const next = await earningsApi.offer(id);
      const products = await earningsApi.promotions();
      setPromotionRequest(products.find((item) => item.courseId === id)?.promotionRequest ?? null);
      setOffer(next);
      setSaved(next.pendingPriceVnd ?? next.listPriceVnd);
      setPrice(String(next.pendingPriceVnd ?? next.listPriceVnd));
      resetPrice();
      toast.success(result.requiresReview
        ? "Đã lưu giá đề xuất. Hãy gửi duyệt lại khóa học để Admin phê duyệt."
        : "Đã cập nhật giá khóa học.");
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
        salePriceVnd: toNumber(salePrice),
        label: label.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: active,
      });
      const next = await earningsApi.offer(id);
      const product = (await earningsApi.promotions()).find((item) => item.courseId === id);
      setOffer(next);
      setPromotionRequest(product?.promotionRequest ?? null);
      toast.success(next.pendingPriceVnd !== null ? "Đã lưu đề xuất khuyến mãi cùng giá mới. Hãy gửi duyệt khóa học để Admin duyệt toàn bộ cấu hình." : "Đã gửi đề xuất khuyến mãi cho Admin duyệt.");
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
    <Card className="min-w-0 overflow-hidden p-0">
      <section className="space-y-3 p-5">
      <h2 className="font-semibold text-foreground">Giá khóa học</h2>
      <p className="text-xs text-muted-foreground">
        Nhập 0 để phát hành miễn phí; giá lớn hơn 0 là mức học viên thanh toán
        một lần để mở toàn bộ khóa học.
      </p>
      <Field error={priceForm.errors.price} htmlFor="course-price" label="Giá (VND)">
        <input
          {...fieldA11y("course-price", priceForm.errors.price)}
          className={inputClassName}
          inputMode="numeric"
          value={price}
          disabled={busy || saved === null || locked}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        {saved === null || offer === null
          ? "Đang tải…"
          : offer.pendingPriceVnd !== null
            ? `Giá đang công khai: ${vnd(offer.listPriceVnd)}. Giá đề xuất chờ gửi duyệt: ${vnd(offer.pendingPriceVnd)}`
          : saved === 0
            ? "Hiện miễn phí"
            : `Giá đã lưu: ${vnd(saved)}`}
        . Quyền học đã cấp trước đó vẫn được giữ.
      </p>
      {locked && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Khóa học đang chờ Admin duyệt. Hãy hủy gửi duyệt nếu bạn cần sửa lại giá đề xuất.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        // Không khoá theo lỗi — bấm thì lỗi hiện dưới ô. Chỉ khoá khi chưa đổi gì.
        disabled={busy || saved === null || locked || (priceForm.valid && toNumber(price) === saved)}
        onClick={() => {
          if (priceForm.validate()) void save();
        }}
      >
        {busy ? "Đang lưu…" : "Lưu giá"}
      </Button>
      </section>
      {offer !== null && (offer.pendingPriceVnd ?? offer.listPriceVnd) > 0 && (
        <section className="min-w-0 space-y-4 border-t border-border bg-muted/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">Quản lý khuyến mãi</h3>
              <p className="mt-1 text-xs text-muted-foreground">Đề xuất tên, giá và lịch ưu đãi cho khóa học. Thay đổi chỉ xuất hiện với học viên sau khi Admin duyệt.</p>
            </div>
            {offer && <CoursePrice priceVnd={offer.priceVnd} listPriceVnd={offer.listPriceVnd} />}
          </div>
          {promotionRequest?.status === "pending" && <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm"><p className="font-semibold text-primary">{promotionRequest.requiresPriceApproval ? "Đề xuất duyệt cùng giá khóa học" : "Đang chờ Admin duyệt"}</p><p className="mt-1 text-xs text-muted-foreground">{promotionRequest.requiresPriceApproval ? "Gửi duyệt khóa học để Admin duyệt đồng thời giá và khuyến mãi. Hủy gửi duyệt nếu cần sửa. Giá công khai chưa thay đổi." : "Bạn có thể cập nhật đề xuất trong lúc chờ. Giá hiện tại trên Client chưa thay đổi cho đến khi Admin phê duyệt."}</p></div>}
          {promotionRequest?.status === "rejected" && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"><p className="font-semibold text-destructive">Đề xuất cần chỉnh sửa</p><p className="mt-1 text-xs text-muted-foreground">{promotionRequest.reviewReason || "Admin chưa phê duyệt đề xuất này."}</p></div>}
          {offer?.promotion && promotionRequest?.status !== "pending" && promotionRequest?.status !== "rejected" && <div className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm"><p className="font-semibold text-success">Khuyến mãi đã được duyệt</p><p className="mt-1 text-xs text-muted-foreground">Ưu đãi đang theo lịch đã duyệt. Mọi chỉnh sửa hoặc yêu cầu gỡ sẽ được gửi lại cho Admin.</p></div>}
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Field error={promoForm.errors.label} htmlFor="promo-label" label="Tên chương trình" description="Từ 2 đến 60 ký tự."><input {...fieldA11y("promo-label", promoForm.errors.label)} className={inputClassName} value={label} onChange={(event) => setLabel(event.target.value)} /></Field>
            <Field error={promoForm.errors.salePrice} htmlFor="promo-price" label="Giá ưu đãi (VND)" description={`Từ 1.000 ₫ và thấp hơn giá ${offer.pendingPriceVnd !== null ? "đề xuất" : "niêm yết"}.`}><input {...fieldA11y("promo-price", promoForm.errors.salePrice)} className={inputClassName} inputMode="numeric" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></Field>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><span className="text-xs text-muted-foreground">Giảm nhanh:</span>{[10, 20, 25, 30, 50].map((percent) => <button key={percent} type="button" onClick={() => applyDiscount(percent)} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">-{percent}%</button>)}</div>
            <Field error={promoForm.errors.startsAt} htmlFor="promo-starts" label="Bắt đầu"><input {...fieldA11y("promo-starts", promoForm.errors.startsAt)} className={inputClassName} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
            <Field error={promoForm.errors.endsAt} htmlFor="promo-ends" label="Kết thúc"><input {...fieldA11y("promo-ends", promoForm.errors.endsAt)} className={inputClassName} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span><strong className="block">Cho phép áp dụng khuyến mãi</strong><span className="mt-0.5 block text-xs text-muted-foreground">Tắt để tạm dừng nhưng vẫn giữ tên, giá và lịch áp dụng.</span></span></label>
          <div className="flex flex-wrap gap-2 pb-1">
            <Button type="button" disabled={busy || locked} onClick={() => { if (promoForm.validate()) void savePromotion(); }}>{busy ? "Đang gửi…" : promotionRequest?.status === "pending" ? "Cập nhật đề xuất" : offer?.promotion ? "Gửi thay đổi để duyệt" : "Gửi Admin duyệt"}</Button>
            {(offer?.promotion || promotionRequest?.status === "pending") && <Button type="button" variant="outline" disabled={busy || locked} onClick={() => void removePromotion()}>{offer?.promotion ? "Gửi yêu cầu gỡ" : "Hủy đề xuất"}</Button>}
          </div>
        </section>
      )}
    </Card>
  );
}
