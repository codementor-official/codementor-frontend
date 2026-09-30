"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useState } from "react";
import { Button, Card, useToast } from "@codementor/ui";
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
  const [error, setError] = useState("");
  const toast = useToast();
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await save(value);
      toast.success("Đã lưu. Chỉ áp dụng cho đơn hàng/yêu cầu mới.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="max-w-2xl space-y-4 p-5">
      <h2 className="font-semibold">Chính sách cho giao dịch mới</h2>
      <p className="text-sm text-muted-foreground">
        Đơn đã tạo giữ nguyên snapshot giá, tỷ lệ và thời gian giữ. Phí cổng do
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
      <label className="block text-sm">
        Giữ thu nhập (ngày)
        <input
          className={`${inputClassName} mt-1`}
          type="number"
          min={0}
          max={90}
          value={value.holdDays}
          onChange={(e) =>
            setValue({ ...value, holdDays: Number(e.target.value) })
          }
        />
      </label>
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
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        disabled={
          busy ||
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
        onClick={() => void submit()}
      >
        {busy ? "Đang lưu…" : "Lưu chính sách"}
      </Button>
    </Card>
  );
}
