"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button, Modal } from "@codementor/ui";
import { formatSize } from "./types";

/**
 * Hộp chọn tệp để tải lên Tài liệu.
 *
 * Dùng ở HAI chỗ: trang Tài liệu và menu đính kèm của Lecter. Tệp tải từ chat cũng nằm lại
 * trang Tài liệu như mọi tệp khác — không có khái niệm tệp tạm, nên không có hai luồng tải lên.
 *
 * Bám sát hộp tương ứng bên ứng dụng người học (`study-group/upload-documents-modal.tsx`); chép
 * ý chứ không import, vì mã không đi ngang giữa các app (AGENTS.md).
 *
 * Portal ra `body`, bắt buộc chứ không phải cho gọn — cùng lý do đã ghi ở `AttachPicker`. Một
 * trong hai nơi dùng hộp này là menu đính kèm của Lecter, và nó nằm bên trong khung ô nhập của
 * CopilotChatView: khung đó là `pointer-events-none` (thuộc tính này DI TRUYỀN xuống con) và
 * `absolute z-20` (tạo stacking context riêng, nhốt `z-50` của Modal lại). Để nguyên tại chỗ thì
 * hộp vẫn hiện nhưng không bấm được gì cả: không chọn tệp, không kéo thả, không đóng được.
 *
 * Đặt portal ở ĐÂY chứ không ở nơi gọi: trang Tài liệu không cần nó, nhưng portal ở đó cũng vô
 * hại, và một component tự lo chỗ đứng của mình thì nơi gọi thứ ba không phải nhớ luật này.
 */

export const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

/** Mã lỗi của dropzone, đổi thành câu người soạn làm được gì với nó. */
function describeRejection(rejection: FileRejection, maxBytes: number, maxFiles: number): string {
  const reason = rejection.errors[0]?.code;
  if (reason === "file-too-large") {
    return `${rejection.file.name} — vượt quá ${formatSize(maxBytes)} (${formatSize(rejection.file.size)})`;
  }
  if (reason === "too-many-files") return `${rejection.file.name} — mỗi lần tối đa ${maxFiles} tệp`;
  if (reason === "file-invalid-type") {
    return `${rejection.file.name} — chỉ nhận PDF, DOCX, PPTX, TXT, MD`;
  }
  return `${rejection.file.name} — ${rejection.errors[0]?.message ?? "không hợp lệ"}`;
}

export function DocumentUploadModal({
  open,
  onClose,
  onUpload,
  maxFiles,
  maxBytes,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  maxFiles: number;
  maxBytes: number;
  busy?: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setErrors(rejected.map((item) => describeRejection(item, maxBytes, maxFiles)));
      setFiles((previous) => {
        // Đếm lại tổng ở đây: `maxFiles` của dropzone chỉ biết về MỘT lần thả.
        const merged = [...previous];
        for (const file of accepted) {
          if (merged.length >= maxFiles) {
            setErrors((current) => [...current, `${file.name} — đã đủ ${maxFiles} tệp`]);
            continue;
          }
          if (!merged.some((item) => item.name === file.name && item.size === file.size)) {
            merged.push(file);
          }
        }
        return merged;
      });
    },
    [maxBytes, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive, open: pick } = useDropzone({
    accept: ACCEPTED,
    onDrop,
    maxFiles,
    maxSize: maxBytes,
    noClick: true,
    noKeyboard: true,
  });

  const close = () => {
    setFiles([]);
    setErrors([]);
    onClose();
  };

  // Sau MỌI hook — `useDropzone` ở trên vẫn phải chạy mỗi lần render. `document` chỉ tồn tại ở
  // trình duyệt; `open` luôn là `false` ở lần render đầu nên nhánh này không chạy lúc SSR, và
  // điều kiện dưới đây là hàng rào cho trường hợp một nơi gọi sau này mở sẵn từ server.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <Modal
      description={`Tối đa ${maxFiles} tệp mỗi lần, mỗi tệp không quá ${formatSize(maxBytes)}. Tài liệu tự xóa sau 30 ngày.`}
      footer={
        <>
          <Button onClick={close} type="button" variant="outline">
            Huỷ
          </Button>
          <Button
            disabled={busy || files.length === 0}
            onClick={() => {
              onUpload(files);
              close();
            }}
            type="button"
          >
            Tải lên{files.length > 0 ? ` ${files.length} tệp` : ""}
          </Button>
        </>
      }
      onClose={close}
      open={open}
      title="Tải tài liệu lên"
    >
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border bg-background"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud
          aria-hidden="true"
          className={`mb-2 size-7 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
        />
        <p className="text-sm font-medium">
          {isDragActive ? "Thả tệp vào đây" : "Kéo thả tệp vào đây"}
        </p>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          PDF (có text), DOCX, PPTX, TXT hoặc Markdown. Bản scan cần OCR trước.
        </p>
        <Button onClick={pick} size="sm" type="button" variant="outline">
          Chọn tệp từ máy
        </Button>
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {errors.map((line) => (
            <li className="text-xs font-medium text-destructive" key={line}>
              {line}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {files.map((file) => (
            <li
              className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2"
              key={`${file.name}-${file.size}`}
            >
              <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(file.size)}
              </span>
              <button
                aria-label={`Bỏ ${file.name}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setFiles((previous) => previous.filter((item) => item !== file))}
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>,
    document.body,
  );
}
