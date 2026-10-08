"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useState } from "react";
import { Button, Card, Modal, useToast } from "@codementor/ui";
import { Clock3, ShieldCheck } from "lucide-react";
import { vnd } from "./api";
import { inputClassName } from "./form-style";
import type { CommercePolicy } from "@codementor/types";
import { formatHoldingPeriod } from "@codementor/utils";
export function PolicyForm({
  initial,
  save,
}: {
  initial: CommercePolicy;
  save: (p: CommercePolicy) => Promise<unknown>;
}) {
  const initialMinutes = initial.holdMinutes ?? initial.holdDays * 1440;
  const [value, setValue] = useState({
    ...initial,
    holdMinutes: initialMinutes,
  });
  const [busy, setBusy] = useState(false);
  const [holdUnit, setHoldUnit] = useState<"days" | "minutes">(
    initialMinutes % 1440 === 0 ? "days" : "minutes",
  );
  const [holdInput, setHoldInput] = useState(
    String(
      initialMinutes % 1440 === 0 ? initialMinutes / 1440 : initialMinutes,
    ),
  );
  const [confirmation, setConfirmation] = useState(false);
  const multiplier = holdUnit === "days" ? 1440 : 1;
  const validHold =
    /^\d+$/.test(holdInput) && Number(holdInput) * multiplier <= 129600;
  function updateHold(input: string, unit: "days" | "minutes") {
    setHoldInput(input);
    setHoldUnit(unit);
    const minutes = Number(input) * (unit === "days" ? 1440 : 1);
    setValue({
      ...value,
      holdDays: Math.ceil(minutes / 1440),
      holdMinutes: minutes,
    });
  }
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
          <strong className="text-foreground">
            {formatHoldingPeriod(initialMinutes)}
          </strong>
          . Bắt đầu tính từ khi đơn được xác nhận thanh toán.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className="block text-sm">
            Thời gian giữ cho đơn mới
            <input
              className={`${inputClassName} mt-1`}
              type="number"
              min={0}
              max={129600 / multiplier}
              step={1}
              value={holdInput}
              aria-invalid={!validHold}
              onChange={(e) => {
                updateHold(e.target.value, holdUnit);
              }}
            />
          </label>
          <label className="block text-sm">
            Đơn vị thời gian
            <select
              className={`${inputClassName} mt-1`}
              value={holdUnit}
              onChange={(e) => {
                const unit = e.target.value as "days" | "minutes";
                // Preserve the duration where representable; do not silently round it.
                updateHold(
                  String(
                    unit === "minutes"
                      ? Number(holdInput) * 1440
                      : Number(holdInput) / 1440,
                  ),
                  unit,
                );
              }}
            >
              <option value="days">Ngày</option>
              <option value="minutes">Phút</option>
            </select>
          </label>
        </div>
        {!validHold && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Nhập số nguyên từ 0 đến{" "}
            {holdUnit === "days" ? "90 ngày" : "129.600 phút"}.
          </p>
        )}
        {validHold && value.holdMinutes === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Không chờ theo thời gian, nhưng vẫn phải xác minh thanh toán và kiểm
            tra hoàn tiền trước khi mở số dư.
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Sau {validHold ? formatHoldingPeriod(value.holdMinutes) : "…"}, doanh
          thu chỉ chuyển sang khả dụng khi lượt đối soát xác nhận đủ điều kiện.
          Đổi thời gian không mở sớm hoặc tính lại các đơn cũ.
        </p>
        {validHold && value.holdMinutes > 0 && value.holdMinutes < 1440 && (
          <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            Để demo 1 phút, lưu chính sách trước khi tạo đơn mới. Sau khi thanh
            toán được xác minh và hết thời gian giữ, chạy đối soát hoặc chờ lượt
            tự động. Áp dụng toàn hệ thống cho đơn mới; khôi phục thời gian giữ
            sau demo.
          </p>
        )}
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
          JSON.stringify(value) ===
            JSON.stringify({ ...initial, holdMinutes: initialMinutes }) ||
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
                `${formatHoldingPeriod(initialMinutes)} → ${formatHoldingPeriod(value.holdMinutes)}`,
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
