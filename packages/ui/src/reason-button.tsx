"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { reason as reasonRule } from "@codementor/utils";
import { Modal } from "./modal";
import { ReasonField } from "./reason-field";

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
  const [attempted, setAttempted] = useState(false);
  const fieldId = useId();
  const trimmed = reason.trim();

  const close = () => {
    if (running) return;
    setOpen(false);
    setReason("");
    setAttempted(false);
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
              disabled={running}
              onClick={async () => {
                // Không khoá nút theo lỗi: bấm thì lỗi hiện ra dưới ô, rồi dừng ở đó.
                setAttempted(true);
                if (reasonRule(reason)) return;
                setRunning(true);
                try {
                  await onConfirm(trimmed);
                  setOpen(false);
                  setReason("");
                  setAttempted(false);
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
        <ReasonField
          autoFocus
          id={fieldId}
          onChange={setReason}
          placeholder={placeholder}
          showError={attempted}
          value={reason}
        />
      </Modal>
    </>
  );
}
