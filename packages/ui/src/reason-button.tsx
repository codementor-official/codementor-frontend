"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

/**
 * Nút cho thao tác cần một lý do trước khi chạy: gỡ nội dung đang công khai, ví dụ. Cùng
 * hình dạng với `ConfirmButton` — bấm ra hộp thoại, hộp thoại mới thật sự chạy hành động
 * — chỉ khác chỗ hộp thoại đòi một câu chữ thay vì chỉ một cái bấm xác nhận. Nút xác nhận
 * tự khoá cho tới khi có chữ, nên không có đường nào gửi được lý do rỗng.
 */
export function ReasonButton({
  onConfirm,
  title,
  description,
  confirmLabel,
  placeholder,
  children,
  variant = "ghost",
  ...buttonProps
}: {
  onConfirm: (reason: string) => void | Promise<unknown>;
  /** Câu hỏi trên hộp thoại. */
  title: string;
  /** Vì sao cần lý do — hiện phía trên ô nhập. */
  description: ReactNode;
  /** Nhãn nút xác nhận. Mặc định dùng chính nhãn của nút gốc. */
  confirmLabel?: string;
  placeholder?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  const close = () => {
    if (running) return;
    setOpen(false);
    setReason("");
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
                  await onConfirm(trimmed);
                  setOpen(false);
                  setReason("");
                } finally {
                  setRunning(false);
                }
              }}
              type="button"
              variant="danger"
            >
              {running ? "Đang xử lý…" : (confirmLabel ?? title)}
            </Button>
          </div>
        }
        onClose={close}
        open={open}
        title={title}
        width="sm"
      >
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
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
