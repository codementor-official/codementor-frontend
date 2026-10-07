"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useState } from "react";
import { Button, Card, Modal, useToast } from "@codementor/ui";
import { Clock3, ShieldCheck } from "lucide-react";
import { vnd } from "./api";
import { inputClassName } from "./form-style";
import type { CommercePolicy } from "@codementor/types";
export function PolicyForm({
  initial,
  save,
}: {
  initial: CommercePolicy;
  save: (p: CommercePolicy) => Promise<unknown>;
}) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [holdInput, setHoldInput] = useState(String(initial.holdDays));
  const [confirmation, setConfirmation] = useState(false);
  const validHold = /^\d+$/.test(holdInput) && Number(holdInput) <= 90;
  const toast = useToast();
  async function submit() {
    setBusy(true);
    try {
      await save(value);
      toast.success("Đã lưu. Chỉ áp dụng cho đơn hàng/yêu cầu mới.");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
      setConfirmation(false);
    }
  }
  return (
    <Card className="space-y-5 p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="size-5 text-primary" /> Chính sách doanh thu
      </h2>
      <p className="text-sm text-muted-foreground">
        Đơn đã tạo giữ nguyên giá, tỷ lệ và thời gian giữ đã lưu. Phí cổng do
        CodeMentor chịu, không tự giả định mức phí.
      </p>
      <label className="block text-sm">
        Giảng viên hưởng (%)
        <input
          className={`${inputClassName} mt-1`}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value.instructorBps / 100}
          onChange={(e) =>
            setValue({
              ...value,
              instructorBps: Math.round(Number(e.target.value) * 100),
            })
          }
        />
      </label>
      <section className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 flex items-center gap-2 font-semibold">
          <Clock3 className="size-4 text-primary" /> Thời gian giữ doanh thu
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Chính sách hiện tại:{" "}
          <strong className="text-foreground">{initial.holdDays} ngày</strong>.
          Bắt đầu tính từ khi đơn được xác nhận thanh toán.
        </p>
        <label className="block text-sm">
          Số ngày giữ cho đơn mới
          <input
            className={`${inputClassName} mt-1`}
            type="number"
            min={0}
            max={90}
            value={holdInput}
            aria-invalid={!validHold}
            onChange={(e) => {
              setHoldInput(e.target.value);
              setValue({ ...value, holdDays: Number(e.target.value) });
            }}
          />
        </label>
        {!validHold && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Nhập số nguyên từ 0 đến 90 ngày.
          </p>
        )}
        {validHold && value.holdDays === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            0 ngày: không chờ theo thời gian, nhưng vẫn phải xác minh thanh toán
            và kiểm tra hoàn tiền trước khi mở số dư.
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Sau {validHold ? value.holdDays : "…"} ngày, doanh thu chỉ chuyển sang
          khả dụng khi lượt đối soát xác nhận đủ điều kiện. Đổi số ngày không mở
          sớm hoặc tính lại các đơn cũ.
        </p>
      </section>
      <label className="block text-sm">
        Rút tối thiểu (VND)
        <input
          className={`${inputClassName} mt-1`}
          type="number"
          min={1000}
          max={1000000000}
          value={value.minimumWithdrawal}
          onChange={(e) =>
            setValue({ ...value, minimumWithdrawal: Number(e.target.value) })
          }
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.approvalRequired}
          onChange={(e) =>
            setValue({ ...value, approvalRequired: e.target.checked })
          }
        />
        Yêu cầu admin duyệt rút tiền
      </label>
      <Button
        disabled={
          busy ||
          !validHold ||
          JSON.stringify(value) === JSON.stringify(initial) ||
          !Number.isInteger(value.holdDays) ||
          value.holdDays < 0 ||
          value.holdDays > 90 ||
          value.instructorBps < 0 ||
          value.instructorBps > 10000 ||
          !Number.isInteger(value.minimumWithdrawal) ||
          value.minimumWithdrawal < 1000 ||
          value.minimumWithdrawal > 1000000000
        }
        onClick={() => setConfirmation(true)}
      >
        {busy ? "Đang lưu…" : "Lưu chính sách"}
      </Button>
      <Modal
        open={confirmation}
        onClose={() => {
          if (!busy) setConfirmation(false);
        }}
        title="Xác nhận thay đổi chính sách doanh thu"
        footer={
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmation(false)}
            >
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => void submit()}>
              {busy ? "Đang lưu…" : "Xác nhận lưu chính sách"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <p>
            Chính sách mới chỉ áp dụng cho đơn hàng và yêu cầu rút tạo sau khi
            lưu. Đơn cũ giữ thời gian và tỷ lệ đã ghi nhận; số dư hiện tại không
            bị tính lại.
          </p>
          <dl className="divide-y rounded-lg border px-4">
            {[
              [
                "Thời gian giữ doanh thu",
                `${initial.holdDays} ngày → ${value.holdDays} ngày`,
              ],
              [
                "Tỷ lệ giảng viên",
                `${initial.instructorBps / 100}% → ${value.instructorBps / 100}%`,
              ],
              [
                "Rút tối thiểu",
                `${vnd(initial.minimumWithdrawal)} → ${vnd(value.minimumWithdrawal)}`,
              ],
              [
                "Duyệt yêu cầu rút",
                `${initial.approvalRequired ? "Bắt buộc" : "Không bắt buộc"} → ${value.approvalRequired ? "Bắt buộc" : "Không bắt buộc"}`,
              ],
            ].map(([label, change]) => (
              <div
                key={label}
                className="flex flex-wrap justify-between gap-2 py-3"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{change}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Modal>
    </Card>
  );
}
