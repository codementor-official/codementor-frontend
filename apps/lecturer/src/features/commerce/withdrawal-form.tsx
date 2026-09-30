"use client";

import { apiErrorMessage } from "@codementor/api-client";
import type { PayoutMethod, PayoutRecipient, WalletSummary } from "@codementor/types";
import { Button, Card, useToast } from "@codementor/ui";
import { Check, Landmark, ShieldCheck, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { inputClassName } from "@/components/form/field";
import { earningsApi, vnd } from "./api";

const METHODS: Array<{ id: PayoutMethod; name: string; note: string; mark: string; color: string }> = [
  { id: "bank", name: "Ngân hàng", note: "Tài khoản ngân hàng", mark: "BANK", color: "#2563eb" },
  { id: "momo", name: "Ví MoMo", note: "Số điện thoại MoMo", mark: "M", color: "#a50064" },
  { id: "vnpay", name: "Ví VNPAY", note: "Tài khoản VNPAY", mark: "VN", color: "#0756a5" },
];
const BANKS = [["VCB", "Vietcombank"], ["BIDV", "BIDV"], ["CTG", "VietinBank"], ["TCB", "Techcombank"], ["MBB", "MB Bank"], ["ACB", "ACB"], ["VPB", "VPBank"], ["TPB", "TPBank"], ["STB", "Sacombank"], ["OTHER", "Ngân hàng khác"]] as const;

function initialRecipient(wallet: WalletSummary): PayoutRecipient {
  return wallet.recipient ?? { method: "bank", institutionCode: "VCB", accountName: "", accountNumber: "", label: "Tài khoản chính", testReference: "" };
}

export function WithdrawalForm({ wallet, refresh }: { wallet: WalletSummary; refresh: () => Promise<void> }) {
  const [recipient, setRecipient] = useState(() => initialRecipient(wallet));
  const [amount, setAmount] = useState(String(wallet.policy.minimumWithdrawal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const toast = useToast();
  const numericAmount = Number(amount);
  const method = METHODS.find((item) => item.id === recipient.method) ?? METHODS[0];
  const institutionName = recipient.method === "bank" ? BANKS.find(([code]) => code === recipient.institutionCode)?.[1] ?? recipient.institutionCode : recipient.method === "momo" ? "Ví MoMo" : "Ví VNPAY";
  const recipientValid = recipient.accountName.trim().length >= 2 && /^\d{8,20}$/.test(recipient.accountNumber);
  const amountValid = Number.isInteger(numericAmount) && numericAmount >= wallet.policy.minimumWithdrawal && numericAmount <= (wallet.balances.available ?? 0);
  const maskedAccount = recipient.accountNumber ? `${"•".repeat(Math.max(0, recipient.accountNumber.length - 4))}${recipient.accountNumber.slice(-4)}` : "Chưa nhập tài khoản";
  const savedInstitution = wallet.recipient?.method === "bank" ? BANKS.find(([code]) => code === wallet.recipient?.institutionCode)?.[1] ?? wallet.recipient.institutionCode : wallet.recipient?.method === "momo" ? "Ví MoMo" : "Ví VNPAY";
  const savedAccount = wallet.recipient?.accountNumber ? `••••${wallet.recipient.accountNumber.slice(-4)}` : "Chưa thiết lập";
  const percentage = useMemo(() => wallet.balances.available > 0 ? Math.min(100, Math.round((numericAmount / wallet.balances.available) * 100)) : 0, [numericAmount, wallet.balances.available]);
  const update = (patch: Partial<PayoutRecipient>) => setRecipient((current) => ({ ...current, ...patch }));

  async function saveRecipient() {
    setBusy(true); setError("");
    try {
      const payload: PayoutRecipient = { ...recipient, label: recipient.label.trim() || `${institutionName} · ${recipient.accountNumber.slice(-4)}`, accountName: recipient.accountName.trim().toUpperCase(), accountNumber: recipient.accountNumber.trim(), testReference: `TEST-${recipient.method.toUpperCase()}-${recipient.accountNumber.slice(-6)}` };
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
      <div className="border-b p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><WalletCards className="size-5" /></span><div><h2 className="font-semibold">Phương thức nhận tiền</h2><p className="mt-1 text-xs text-muted-foreground">Thông tin được bảo vệ và lưu cùng từng yêu cầu rút.</p></div></div></div>
      <div className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-3">{METHODS.map((item) => { const selected = recipient.method === item.id; return <button key={item.id} type="button" onClick={() => update({ method: item.id, institutionCode: item.id === "bank" ? "VCB" : item.id.toUpperCase() })} className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/60"}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-black text-on-ink-fixed" style={{ backgroundColor: item.color }}>{item.mark}</span><span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span><span className="block truncate text-2xs text-muted-foreground">{item.note}</span></span>{selected && <Check className="absolute right-2 top-2 size-4 text-primary" />}</button>; })}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recipient.method === "bank" && <label className="block text-sm font-medium">Ngân hàng<select className={`${inputClassName} mt-1.5`} value={recipient.institutionCode} onChange={(e) => update({ institutionCode: e.target.value })}>{BANKS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>}
          <label className="block text-sm font-medium">{recipient.method === "bank" ? "Số tài khoản" : "Số điện thoại đăng ký"}<input className={`${inputClassName} mt-1.5`} inputMode="numeric" maxLength={20} placeholder={recipient.method === "bank" ? "Nhập số tài khoản" : "Nhập số điện thoại"} value={recipient.accountNumber} onChange={(e) => update({ accountNumber: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="block text-sm font-medium">Tên chủ tài khoản<input className={`${inputClassName} mt-1.5 uppercase`} maxLength={100} placeholder="NGUYEN VAN A" value={recipient.accountName} onChange={(e) => update({ accountName: e.target.value })} /></label>
          <label className="block text-sm font-medium">Tên gợi nhớ<input className={`${inputClassName} mt-1.5`} maxLength={80} placeholder="Tài khoản nhận tiền chính" value={recipient.label} onChange={(e) => update({ label: e.target.value })} /></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg text-xs font-black text-on-ink-fixed" style={{ backgroundColor: method.color }}>{method.mark}</span><div><p className="text-sm font-semibold">{institutionName} · {maskedAccount}</p><p className="text-xs text-muted-foreground">{recipient.accountName || "Tên chủ tài khoản sẽ hiển thị tại đây"}</p></div></div><Button disabled={busy || !recipientValid} onClick={() => void saveRecipient()}>{busy ? "Đang lưu…" : "Lưu phương thức"}</Button></div>
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="border-b p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Landmark className="size-5" /></span><div><h2 className="font-semibold">Tạo yêu cầu rút tiền</h2><p className="mt-1 text-xs text-muted-foreground">Số dư khả dụng: <strong className="text-foreground">{vnd(wallet.balances.available ?? 0)}</strong></p></div></div></div>
      <div className="space-y-4 p-5">
        <label className="block text-sm font-medium">Số tiền muốn rút<div className="relative mt-1.5"><input className={`${inputClassName} pr-12 text-base font-semibold`} type="number" step={1000} min={wallet.policy.minimumWithdrawal} max={wallet.balances.available} value={amount} onChange={(e) => setAmount(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">VND</span></div></label>
        <div className="grid grid-cols-4 gap-2">{[25, 50, 75, 100].map((value) => <button type="button" key={value} onClick={() => setAmount(String(Math.floor((wallet.balances.available * value) / 100 / 1000) * 1000))} className={`rounded-lg border px-2 py-2 text-xs font-semibold hover:border-primary hover:text-primary ${percentage === value ? "border-primary bg-primary/5 text-primary" : ""}`}>{value}%</button>)}</div>
        <div className="space-y-2 rounded-xl border bg-muted/20 p-4 text-sm"><div className="flex justify-between gap-3 text-muted-foreground"><span>Phương thức nhận đã lưu</span><span className="text-right font-medium text-foreground">{wallet.recipient ? `${savedInstitution} · ${savedAccount}` : "Chưa thiết lập"}</span></div><div className="flex justify-between gap-3 text-muted-foreground"><span>Phí xử lý</span><span className="font-medium text-foreground">{vnd(0)}</span></div><div className="flex justify-between gap-3 border-t pt-3 font-semibold"><span>Thực nhận dự kiến</span><span className="text-base text-primary">{vnd(Number.isFinite(numericAmount) ? numericAmount : 0)}</span></div></div>
        <p className="flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />Tối thiểu {vnd(wallet.policy.minimumWithdrawal)}. {wallet.policy.approvalRequired ? "Yêu cầu được quản trị viên duyệt trước khi chi trả." : "Yêu cầu đủ điều kiện sẽ được xử lý tự động."}</p>
        <Button className="w-full" disabled={busy || !wallet.recipient || !amountValid} onClick={() => void withdraw()}>{busy ? "Đang gửi yêu cầu…" : "Xác nhận yêu cầu rút tiền"}</Button>
        {!wallet.recipient && <p className="text-center text-xs text-destructive">Hãy lưu phương thức nhận tiền trước khi rút.</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </Card>
  </div>;
}
