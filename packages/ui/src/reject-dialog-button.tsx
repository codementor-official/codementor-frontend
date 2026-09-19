"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import { Select, type SelectOption } from "./select";

/**
 * Một nút xử lý từ chối duy nhất, gộp "Từ chối" và "Yêu cầu sửa" (và các loại tương tự)
 * thành một hộp thoại: chọn loại quyết định rồi nhập lý do. Thay cho hai nút riêng cộng ô
 * lý do luôn hiện trên màn hình — cùng hình dạng với `ReasonButton`, chỉ thêm một `Select`
 * phía trên ô nhập.
 */
export function RejectDialogButton({
  onConfirm,
  title,
  description,
  decisions,
  placeholder,
  children,
  variant = "ghost",
  ...buttonProps
}: {
  onConfirm: (decision: string, reason: string) => void | Promise<unknown>;
  title: string;
  description?: ReactNode;
  /** Các loại quyết định để chọn — ví dụ Từ chối / Yêu cầu sửa. */
  decisions: SelectOption[];
  placeholder?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [decision, setDecision] = useState(decisions[0]?.value ?? "");
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  const close = () => {
    if (running) return;
    setOpen(false);
    setReason("");
    setDecision(decisions[0]?.value ?? "");
  };

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)} variant={variant}>
        {children}
      </Button>

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={running} onClick={close} type="button" variant="outline">
              Huỷ
            </Button>
            <Button
              disabled={running || trimmed.length === 0}
              onClick={async () => {
                setRunning(true);
                try {
                  await onConfirm(decision, trimmed);
                  setOpen(false);
                  setReason("");
                  setDecision(decisions[0]?.value ?? "");
                } finally {
                  setRunning(false);
                }
              }}
              type="button"
              variant="danger"
            >
              {running ? "Đang xử lý…" : "Xác nhận"}
            </Button>
          </div>
        }
        onClose={close}
        open={open}
        title={title}
        width="sm"
      >
        {description ? <p className="mb-3 text-sm text-muted-foreground">{description}</p> : null}
        <Select
          className="mb-3 w-full"
          label="Loại xử lý"
          onChange={setDecision}
          options={decisions}
          value={decision}
        />
        <textarea
          autoFocus
          className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring"
          onChange={(event) => setReason(event.target.value)}
          placeholder={placeholder}
          value={reason}
        />
      </Modal>
    </>
  );
}
