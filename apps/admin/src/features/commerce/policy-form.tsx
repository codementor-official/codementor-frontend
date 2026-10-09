"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useState } from "react";
import {
  Button,
  Card,
  Field,
  fieldA11y,
  Modal,
  useFieldErrors,
  useToast,
} from "@codementor/ui";
import { Clock3, ShieldCheck } from "lucide-react";
import { vnd } from "./api";
import { inputClassName } from "./form-style";
import type { CommercePolicy } from "@codementor/types";
import {
  decimal,
  formatHoldingPeriod,
  integer,
  toNumber,
} from "@codementor/utils";
export function PolicyForm({
  initial,
  save,
}: {
  initial: CommercePolicy;
  save: (p: CommercePolicy) => Promise<unknown>;
}) {
  const initialMinutes = initial.holdMinutes ?? initial.holdDays * 1440;
  // Ô số giữ CHUỖI (xem `integer` ở @codementor/utils): ép `Number("")` về 0 là thứ sinh ra
  // "012" khi gõ tiếp vào ô vừa xoá. Chỉ đổi sang số ở `value` bên dưới, sau khi đã hợp lệ.
  const [percent, setPercent] = useState(String(initial.instructorBps / 100));
  const [holdUnit, setHoldUnit] = useState<"days" | "minutes">(
    initialMinutes % 1440 === 0 ? "days" : "minutes",
  );
  const [holdInput, setHoldInput] = useState(
    String(
      initialMinutes % 1440 === 0 ? initialMinutes / 1440 : initialMinutes,
    ),
  );
  const [minimum, setMinimum] = useState(String(initial.minimumWithdrawal));
  const [approvalRequired, setApprovalRequired] = useState(
    initial.approvalRequired,
  );
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const multiplier = holdUnit === "days" ? 1440 : 1;
  // Bản sao `PolicyDto`: instructorBps 0–10000 (= 0–100% với 2 chữ số thập phân),
  // holdMinutes 0–129600 (= 90 ngày), minimumWithdrawal 1.000–1.000.000.000.
  const holdError = integer(holdInput, "Thời gian giữ", {
    min: 0,
    max: 129600 / multiplier,
    optional: false,
  });
  const validHold = holdError === undefined;
  const form = useFieldErrors(
    { percent, hold: holdInput, minimum },
    {
      percent: decimal(percent, "Tỷ lệ giảng viên hưởng", {
        min: 0,
        max: 100,
        scale: 2,
        optional: false,
      }),
      hold: holdError,
      minimum: integer(minimum, "Mức rút tối thiểu", {
        min: 1000,
        max: 1_000_000_000,
        optional: false,
      }),
    },
  );
  const holdMinutes = toNumber(holdInput) * multiplier;
  const value: CommercePolicy = {
    instructorBps: Math.round(toNumber(percent) * 100),
    holdDays: Math.ceil(holdMinutes / 1440),
    holdMinutes,
    minimumWithdrawal: toNumber(minimum),
    approvalRequired,
  };
  const unchanged =
    form.valid &&
    value.instructorBps === initial.instructorBps &&
    holdMinutes === initialMinutes &&
    value.minimumWithdrawal === initial.minimumWithdrawal &&
    approvalRequired === initial.approvalRequired;
  function changeUnit(unit: "days" | "minutes") {
    // Giữ nguyên độ dài thời gian khi biểu diễn được; ô đang sai thì giữ nguyên chữ đã gõ.
    if (validHold) {
      setHoldInput(
        String(
          unit === "minutes"
            ? toNumber(holdInput) * 1440
            : toNumber(holdInput) / 1440,
        ),
      );
    }
    setHoldUnit(unit);
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
      <Field
        description="Từ 0 đến 100%, tối đa 2 chữ số thập phân."
        error={form.errors.percent}
        htmlFor="policy-percent"
        label="Giảng viên hưởng (%)"
      >
        <input
          {...fieldA11y("policy-percent", form.errors.percent)}
          className={inputClassName}
          inputMode="decimal"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
        />
      </Field>
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
          <Field
            description={`Số nguyên từ 0 đến ${holdUnit === "days" ? "90 ngày" : "129.600 phút"}.`}
            error={form.errors.hold}
            htmlFor="policy-hold"
            label="Thời gian giữ cho đơn mới"
          >
            <input
              {...fieldA11y("policy-hold", form.errors.hold)}
              className={inputClassName}
              inputMode="numeric"
              value={holdInput}
              onChange={(e) => setHoldInput(e.target.value)}
            />
          </Field>
          <Field htmlFor="policy-hold-unit" label="Đơn vị thời gian">
            <select
              id="policy-hold-unit"
              className={inputClassName}
              value={holdUnit}
              onChange={(e) =>
                changeUnit(e.target.value as "days" | "minutes")
              }
            >
              <option value="days">Ngày</option>
              <option value="minutes">Phút</option>
            </select>
          </Field>
        </div>
        {validHold && holdMinutes === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Không chờ theo thời gian, nhưng vẫn phải xác minh thanh toán và kiểm
            tra hoàn tiền trước khi mở số dư.
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Sau {validHold ? formatHoldingPeriod(holdMinutes) : "…"}, doanh
          thu chỉ chuyển sang khả dụng khi lượt đối soát xác nhận đủ điều kiện.
          Đổi thời gian không mở sớm hoặc tính lại các đơn cũ.
        </p>
        {validHold && holdMinutes > 0 && holdMinutes < 1440 && (
          <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            Để demo 1 phút, lưu chính sách trước khi tạo đơn mới. Sau khi thanh
            toán được xác minh và hết thời gian giữ, chạy đối soát hoặc chờ lượt
            tự động. Áp dụng toàn hệ thống cho đơn mới; khôi phục thời gian giữ
            sau demo.
          </p>
        )}
      </section>
      <Field
        description="Từ 1.000 ₫ đến 1.000.000.000 ₫."
        error={form.errors.minimum}
        htmlFor="policy-minimum"
        label="Rút tối thiểu (VND)"
      >
        <input
          {...fieldA11y("policy-minimum", form.errors.minimum)}
          className={inputClassName}
          inputMode="numeric"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={approvalRequired}
          onChange={(e) => setApprovalRequired(e.target.checked)}
        />
        Yêu cầu admin duyệt rút tiền
      </label>
      <Button
        // Chỉ khoá khi đang lưu hoặc chưa đổi gì. Ô sai thì bấm vẫn được: lỗi hiện ra dưới
        // ô và form dừng ở đó, thay vì một nút xám không nói vì sao.
        disabled={busy || unchanged}
        onClick={() => {
          if (form.validate()) setConfirmation(true);
        }}
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
                `${formatHoldingPeriod(initialMinutes)} → ${formatHoldingPeriod(holdMinutes)}`,
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
