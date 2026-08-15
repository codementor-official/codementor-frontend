"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Yes/no gate for a destructive or hard-to-undo action. The message must name the
 * exact scope (how many items, which ones) — a bare "are you sure?" is what makes
 * people click through without reading.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = "Hủy",
  /** `danger` for irreversible removal, `default` for reversible state changes. */
  tone = "danger",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button size="sm" variant={tone === "danger" ? "primary" : "outline"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === "danger" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        <div className="min-w-0 text-sm leading-relaxed text-text">{message}</div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Modal>
  );
}
