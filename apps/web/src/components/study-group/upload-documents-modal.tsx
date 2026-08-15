"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turns dropzone's rejection codes into something a person can act on. */
function describeRejection(rejection: FileRejection): string {
  const reason = rejection.errors[0]?.code;
  if (reason === "file-too-large") {
    return `${rejection.file.name} — vượt quá 20 MB (${formatSize(rejection.file.size)})`;
  }
  if (reason === "too-many-files") return `${rejection.file.name} — vượt quá ${MAX_FILES} tệp mỗi lần`;
  return `${rejection.file.name} — ${rejection.errors[0]?.message ?? "không hợp lệ"}`;
}

export function UploadDocumentsModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setErrors(rejected.map(describeRejection));
    setFiles((prev) => {
      // Re-check the total here too: dropzone's maxFiles only knows about one drop.
      const merged = [...prev];
      for (const file of accepted) {
        if (merged.length >= MAX_FILES) {
          setErrors((e) => [...e, `${file.name} — đã đủ ${MAX_FILES} tệp`]);
          continue;
        }
        if (!merged.some((f) => f.name === file.name && f.size === file.size)) merged.push(file);
      }
      return merged;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openPicker } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_BYTES,
    noClick: true,
    noKeyboard: true,
  });

  const close = () => {
    setFiles([]);
    setErrors([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Tải tài liệu lên"
      description={`Tối đa ${MAX_FILES} tệp mỗi lần, mỗi tệp không quá 20 MB.`}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={files.length === 0}
            onClick={() => {
              onUpload(files);
              close();
            }}
          >
            Tải lên {files.length > 0 ? `${files.length} tệp` : ""}
          </Button>
        </>
      }
    >
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary-tint" : "border-border bg-bg"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`mb-2 h-7 w-7 ${isDragActive ? "text-primary" : "text-text-faint"}`} />
        <p className="text-sm font-medium text-navy">
          {isDragActive ? "Thả tệp vào đây" : "Kéo thả tệp vào đây"}
        </p>
        <p className="mt-1 mb-3 text-xs text-text-faint">PDF, DOCX, PPTX, XLSX, hình ảnh hoặc video.</p>
        <Button type="button" size="sm" variant="outline" onClick={openPicker}>
          Chọn tệp từ máy
        </Button>
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {errors.map((e) => (
            <li key={e} className="text-xs font-medium text-primary">
              {e}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2.5 rounded-md border border-border-soft px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-text-faint" />
              <span className="min-w-0 flex-1 truncate text-sm text-navy">{file.name}</span>
              <span className="shrink-0 text-xs text-text-faint">{formatSize(file.size)}</span>
              <button
                type="button"
                aria-label={`Bỏ ${file.name}`}
                onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-faint hover:bg-bg hover:text-navy"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
