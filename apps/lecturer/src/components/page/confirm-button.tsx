"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, Modal } from "@codementor/ui";

/**
 * Nút cho thao tác không lùi lại được: bấm ra hộp xác nhận, xác nhận rồi mới chạy.
 *
 * Xoá là một cú bấm chuột và cả một khóa học biến mất — kể cả khi đặt trong khối viền đỏ,
 * bấm nhầm vẫn là bấm nhầm. Hộp xác nhận nói rõ mất cái gì, và nút xác nhận nhắc lại tên
 * bản ghi để người ta thấy mình đang xoá đúng thứ định xoá.
 */
export function ConfirmButton({
  onConfirm,
  title,
  description,
  confirmLabel,
  children,
  variant = "danger",
  ...buttonProps
}: {
  onConfirm: () => void | Promise<unknown>;
  /** Câu hỏi trên hộp thoại. */
  title: string;
  /** Nói rõ chuyện gì xảy ra sau khi xác nhận. */
  description: ReactNode;
  /** Nhãn nút xác nhận. Mặc định dùng chính nhãn của nút gốc. */
  confirmLabel?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)} variant={variant}>
        {children}
      </Button>

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button disabled={running} onClick={() => setOpen(false)} type="button" variant="outline">
              Huỷ
            </Button>
            <Button
              disabled={running}
              onClick={async () => {
                setRunning(true);
                try {
                  await onConfirm();
                  setOpen(false);
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
        onClose={() => !running && setOpen(false)}
        open={open}
        title={title}
        width="sm"
      >
        <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{description}</span>
        </p>
      </Modal>
    </>
  );
}
