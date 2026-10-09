"use client";

import { apiErrorMessage } from "@codementor/api-client";
import type { PayoutMethod, PayoutRecipient, WalletSummary } from "@codementor/types";
import { Button, Card, Field, fieldA11y, MaskedAccount, useFieldErrors, useToast } from "@codementor/ui";
import { integer, length, toNumber } from "@codementor/utils";
import { Check, ChevronDown, Landmark, ShieldCheck, WalletCards } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { inputClassName } from "@/components/form/field";
import { earningsApi, vnd } from "./api";
import { BankLogo } from "./bank-logo";

// `logo`: WebP sinh bởi scripts/convert-payment-logos.sh. `mark` chỉ còn là chữ dự phòng của BankLogo.
const METHODS: Array<{ id: PayoutMethod; name: string; note: string; mark: string; color: string; logo?: string }> = [
  { id: "bank", name: "Ngân hàng", note: "Tài khoản ngân hàng", mark: "BANK", color: "#2563eb" },
  { id: "momo", name: "Ví MoMo", note: "Số điện thoại MoMo", mark: "M", color: "#a50064", logo: "/payments/momo.webp" },
  { id: "vnpay", name: "Ví VNPAY", note: "Tài khoản VNPAY", mark: "VN", color: "#0756a5", logo: "/payments/vnpay.webp" },
];
const BANKS = [["VCB", "Vietcombank"], ["BIDV", "BIDV"], ["CTG", "VietinBank"], ["TCB", "Techcombank"], ["MBB", "MB Bank"], ["ACB", "ACB"], ["VPB", "VPBank"], ["TPB", "TPBank"], ["STB", "Sacombank"], ["OTHER", "Ngân hàng khác"]] as const;

function initialRecipient(wallet: WalletSummary): PayoutRecipient {
  return wallet.recipient ?? { method: "bank", institutionCode: "VCB", accountName: "", accountNumber: "", label: "Tài khoản chính", testReference: "" };
}

export function WithdrawalForm({ wallet, refresh }: { wallet: WalletSummary; refresh: () => Promise<void> }) {
  const [recipient, setRecipient] = useState(() => initialRecipient(wallet));
  const [amount, setAmount] = useState(String(wallet.policy.minimumWithdrawal));
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const toast = useToast();
  const numericAmount = toNumber(amount);
  const method = METHODS.find((item) => item.id === recipient.method) ?? METHODS[0];
  const institutionName = recipient.method === "bank" ? BANKS.find(([code]) => code === recipient.institutionCode)?.[1] ?? recipient.institutionCode : recipient.method === "momo" ? "Ví MoMo" : "Ví VNPAY";
  const accountLabel = recipient.method === "bank" ? "Số tài khoản" : "Số điện thoại";
  // `RecipientDto` nhận 4–40 ký tự bất kỳ; form chặt hơn (8–20 chữ số) để không lọt số sai.
  const recipientForm = useFieldErrors(
    { accountNumber: recipient.accountNumber, accountName: recipient.accountName, label: recipient.label },
    {
      accountNumber: !recipient.accountNumber.trim()
        ? `${accountLabel} không được để trống`
        : /^\d{8,20}$/.test(recipient.accountNumber.trim()) ? undefined : `${accountLabel} chỉ gồm 8–20 chữ số`,
      accountName: length(recipient.accountName, "Tên chủ tài khoản", { min: 2, max: 100 }),
      // Để trống thì hệ thống tự đặt tên gợi nhớ khi lưu.
      label: length(recipient.label, "Tên gợi nhớ", { max: 100 }),
    },
  );
  const available = wallet.balances.available ?? 0;
  const amountError =
    integer(amount, "Số tiền rút", { min: wallet.policy.minimumWithdrawal, max: 1_000_000_000, optional: false }) ??
    (numericAmount > available ? `Số tiền rút vượt số dư khả dụng (${vnd(available)})` : undefined);
  const amountForm = useFieldErrors({ amount }, { amount: amountError });
  const savedInstitution = wallet.recipient?.method === "bank" ? BANKS.find(([code]) => code === wallet.recipient?.institutionCode)?.[1] ?? wallet.recipient.institutionCode : wallet.recipient?.method === "momo" ? "Ví MoMo" : "Ví VNPAY";
  const percentage = useMemo(() => wallet.balances.available > 0 ? Math.min(100, Math.round((numericAmount / wallet.balances.available) * 100)) : 0, [numericAmount, wallet.balances.available]);
  const update = (patch: Partial<PayoutRecipient>) => setRecipient((current) => ({ ...current, ...patch }));

  async function saveRecipient() {
    setBusy(true); setError("");
    try {
      const payload: PayoutRecipient = { ...recipient, label: recipient.label.trim() || `${institutionName} · ${recipient.accountNumber.slice(-4)}`, accountName: recipient.accountName.trim().toUpperCase(), accountNumber: recipient.accountNumber.trim(), testReference: `TEST-${recipient.method.toUpperCase()}-${recipient.accountNumber.trim().slice(-6)}` };
      await earningsApi.recipient(payload); setRecipient(payload); toast.success("Đã lưu phương thức nhận tiền."); await refresh();
    } catch (e) { setError(apiErrorMessage(e)); } finally { setBusy(false); }
  }
  async function withdraw() {
    setBusy(true); setError("");
    try { await earningsApi.withdraw(numericAmount, requestKey, "success"); setRequestKey(crypto.randomUUID()); toast.success("Yêu cầu rút tiền đã được gửi để xét duyệt."); await refresh(); }
    catch (e) { setError(apiErrorMessage(e)); } finally { setBusy(false); }
  }

  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><WalletCards className="size-5" /></span><div><h2 className="font-semibold">Phương thức nhận tiền</h2><p className="mt-1 text-xs text-muted-foreground">{expanded ? "Thông tin được bảo vệ và lưu cùng từng yêu cầu rút." : wallet.recipient ? <span className="inline-flex items-center gap-2">{savedInstitution}<MaskedAccount accountNumber={wallet.recipient.accountNumber} /></span> : "Chưa thiết lập phương thức nhận tiền"}</p></div></div><button type="button" aria-expanded={expanded} aria-controls="payout-recipient-panel withdrawal-request-panel" aria-label={expanded ? "Thu gọn nhận tiền và rút tiền" : "Mở nhận tiền và rút tiền"} onClick={() => setExpanded((value) => !value)} className="rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></button></div>
      {expanded && <div id="payout-recipient-panel" className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-3">{METHODS.map((item) => { const selected = recipient.method === item.id; return <button key={item.id} type="button" onClick={() => update({ method: item.id, institutionCode: item.id === "bank" ? "VCB" : item.id.toUpperCase() })} className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/60"}`}>{item.logo ? <span className="size-9 shrink-0 overflow-hidden rounded-lg border"><Image alt="" className="size-full object-contain" height={36} src={item.logo} width={36} /></span> : <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-on-ink-fixed" style={{ backgroundColor: item.color }}><Landmark aria-hidden="true" className="size-4" /></span>}<span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span><span className="block truncate text-2xs text-muted-foreground">{item.note}</span></span>{selected && <Check className="absolute right-2 top-2 size-4 text-primary" />}</button>; })}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recipient.method === "bank" && <label className="block text-sm font-medium">Ngân hàng<div className="mt-1.5 flex items-center gap-2"><BankLogo code={recipient.institutionCode} fallback="BANK" /><select className={inputClassName} value={recipient.institutionCode} onChange={(e) => update({ institutionCode: e.target.value })}>{BANKS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></div></label>}
          <Field error={recipientForm.errors.accountNumber} htmlFor="payout-account" label={recipient.method === "bank" ? "Số tài khoản" : "Số điện thoại đăng ký"}><input {...fieldA11y("payout-account", recipientForm.errors.accountNumber)} className={inputClassName} inputMode="numeric" placeholder={recipient.method === "bank" ? "Nhập số tài khoản" : "Nhập số điện thoại"} value={recipient.accountNumber} onChange={(e) => update({ accountNumber: e.target.value })} /></Field>
          <Field error={recipientForm.errors.accountName} htmlFor="payout-name" label="Tên chủ tài khoản"><input {...fieldA11y("payout-name", recipientForm.errors.accountName)} className={`${inputClassName} uppercase`} placeholder="NGUYEN VAN A" value={recipient.accountName} onChange={(e) => update({ accountName: e.target.value })} /></Field>
          <Field error={recipientForm.errors.label} htmlFor="payout-label" label="Tên gợi nhớ"><input {...fieldA11y("payout-label", recipientForm.errors.label)} className={inputClassName} placeholder="Tài khoản nhận tiền chính" value={recipient.label} onChange={(e) => update({ label: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3"><div className="flex items-center gap-3"><BankLogo code={recipient.method === "bank" ? recipient.institutionCode : recipient.method} fallback={method.mark} /><div><p className="flex items-center gap-2 text-sm font-semibold">{institutionName}{recipient.accountNumber.trim() ? <MaskedAccount accountNumber={recipient.accountNumber} /> : <span className="font-normal text-muted-foreground">Chưa nhập tài khoản</span>}</p><p className="text-xs text-muted-foreground">{recipient.accountName || "Tên chủ tài khoản sẽ hiển thị tại đây"}</p></div></div><Button disabled={busy} onClick={() => { if (recipientForm.validate()) void saveRecipient(); }}>{busy ? "Đang lưu…" : "Lưu phương thức"}</Button></div>
      </div>}
    </Card>
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Landmark className="size-5" /></span><div><h2 className="font-semibold">Tạo yêu cầu rút tiền</h2><p className="mt-1 text-xs text-muted-foreground">Số dư khả dụng: <strong className="text-foreground">{vnd(wallet.balances.available ?? 0)}</strong></p></div></div><button type="button" aria-expanded={expanded} aria-controls="payout-recipient-panel withdrawal-request-panel" aria-label={expanded ? "Thu gọn nhận tiền và rút tiền" : "Mở nhận tiền và rút tiền"} onClick={() => setExpanded((value) => !value)} className="rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></button></div>
      {expanded && <div id="withdrawal-request-panel" className="space-y-4 p-5">
        <Field error={amountForm.errors.amount} htmlFor="withdraw-amount" label="Số tiền muốn rút"><div className="relative"><input {...fieldA11y("withdraw-amount", amountForm.errors.amount)} className={`${inputClassName} pr-12 text-base font-semibold`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">VND</span></div></Field>
        <div className="grid grid-cols-4 gap-2">{[25, 50, 75, 100].map((value) => <button type="button" disabled={(wallet.balances.available ?? 0) < wallet.policy.minimumWithdrawal} key={value} onClick={() => setAmount(String(Math.floor((wallet.balances.available * value) / 100 / 1000) * 1000))} className={`rounded-lg border px-2 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-primary ${percentage === value ? "border-primary bg-primary/5 text-primary" : ""}`}>{value}%</button>)}</div>
        <div className="space-y-2 rounded-xl border bg-muted/20 p-4 text-sm"><div className="flex justify-between gap-3 text-muted-foreground"><span>Phương thức nhận đã lưu</span><span className="inline-flex items-center gap-2 text-right font-medium text-foreground">{wallet.recipient ? <>{savedInstitution}<MaskedAccount accountNumber={wallet.recipient.accountNumber} /></> : "Chưa thiết lập"}</span></div><div className="flex justify-between gap-3 text-muted-foreground"><span>Phí xử lý</span><span className="font-medium text-foreground">{vnd(0)}</span></div><div className="flex justify-between gap-3 border-t pt-3 font-semibold"><span>Thực nhận dự kiến</span><span className="text-base text-primary">{vnd(Number.isFinite(numericAmount) ? numericAmount : 0)}</span></div></div>
        <p className="flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />Tối thiểu {vnd(wallet.policy.minimumWithdrawal)}. {wallet.policy.approvalRequired ? "Yêu cầu được quản trị viên duyệt trước khi chi trả." : "Yêu cầu đủ điều kiện sẽ được xử lý tự động."}</p>
        <Button className="w-full" disabled={busy || !wallet.recipient} onClick={() => { if (amountForm.validate()) void withdraw(); }}>{busy ? "Đang gửi yêu cầu…" : "Xác nhận yêu cầu rút tiền"}</Button>
        {!wallet.recipient && <p className="text-center text-xs text-destructive">Hãy lưu phương thức nhận tiền trước khi rút.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>}
    </Card>
  </div>;
}
