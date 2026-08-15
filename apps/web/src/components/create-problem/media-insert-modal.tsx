"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Clipboard, FolderOpen, Link2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

export type MediaKind = "image" | "video";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const COPY: Record<MediaKind, { title: string; urlLabel: string; placeholder: string; accept: string }> = {
  image: {
    title: "Chèn ảnh",
    urlLabel: "Dán URL ảnh từ nguồn bên ngoài.",
    placeholder: "https://.../hinh-anh.png",
    accept: "image/*",
  },
  video: {
    title: "Chèn video",
    urlLabel: "Dán link YouTube đầy đủ — video được nhúng trực tiếp vào bài.",
    placeholder: "https://www.youtube.com/watch?v=...",
    accept: "video/*",
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Collects a media source four ways: an external URL, a dropped file, a file picked from
 * disk, or a paste. Files resolve to an object URL so the draft can render immediately —
 * there is no upload endpoint yet, and an object URL dies with the tab, so `isLocal` is
 * reported back and the caller warns the author.
 */
export function MediaInsertModal({
  kind,
  onClose,
  onInsert,
}: {
  kind: MediaKind | null;
  onClose: () => void;
  onInsert: (src: string, isLocal: boolean) => void;
}) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const accept = kind ? COPY[kind].accept : "";

  const takeFile = useCallback(
    (candidate: File) => {
      const wantsImage = accept.startsWith("image");
      if (wantsImage !== candidate.type.startsWith("image/")) {
        setError(`Tệp phải là ${wantsImage ? "ảnh" : "video"}.`);
        return;
      }
      if (candidate.size > MAX_FILE_BYTES) {
        setError(`Tệp vượt quá 20 MB (${formatSize(candidate.size)}).`);
        return;
      }
      setError("");
      setFile(candidate);
    },
    [accept],
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setError(rejected[0].errors[0]?.message ?? "Tệp không hợp lệ.");
        return;
      }
      if (accepted[0]) takeFile(accepted[0]);
    },
    [takeFile],
  );

  const { getRootProps, getInputProps, isDragActive, open: openPicker } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles: 1,
    maxSize: MAX_FILE_BYTES,
    noClick: true,
    noKeyboard: true,
  });

  // Paste anywhere in the dialog. Listening on the document (not the dropzone) means the
  // author doesn't have to click a specific spot first — the modal is the only thing focused.
  useEffect(() => {
    if (!kind) return;
    const onPaste = (event: ClipboardEvent) => {
      const item = [...(event.clipboardData?.items ?? [])].find((i) => i.kind === "file");
      if (item) {
        const pasted = item.getAsFile();
        if (pasted) {
          setMode("upload");
          takeFile(pasted);
        }
        return;
      }
      const text = event.clipboardData?.getData("text")?.trim();
      if (text?.startsWith("http")) {
        setMode("url");
        setUrl(text);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [kind, takeFile]);

  const close = () => {
    setMode("upload");
    setUrl("");
    setFile(null);
    setError("");
    onClose();
  };

  const confirm = () => {
    if (mode === "url") {
      const href = url.trim();
      if (href) onInsert(href, false);
    } else if (file) {
      onInsert(URL.createObjectURL(file), true);
    }
    close();
  };

  const canInsert = mode === "url" ? url.trim().length > 0 : file !== null;

  return (
    <Modal
      open={kind !== null}
      onClose={close}
      title={kind ? COPY[kind].title : ""}
      description="Kéo thả, dán trực tiếp, chọn tệp từ máy hoặc dán liên kết."
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button onClick={confirm} disabled={!canInsert}>
            Chèn
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <SegmentedTabs
          value={mode}
          onChange={(v) => {
            setMode(v as "upload" | "url");
            setError("");
          }}
          options={[
            { value: "upload", label: "Từ máy" },
            { value: "url", label: "Từ liên kết" },
          ]}
        />

        {mode === "upload" ? (
          <>
            <div
              {...getRootProps()}
              className={`flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
                isDragActive ? "border-primary bg-primary-tint" : "border-border bg-bg"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-6 w-6 text-text-faint" />
              <p className="text-sm font-semibold text-navy">
                {file ? file.name : "Kéo thả tệp vào đây"}
              </p>
              <p className="text-xs text-text-muted">
                {file ? formatSize(file.size) : "hoặc dán bằng Ctrl+V · tối đa 20 MB"}
              </p>
              <Button size="sm" variant="outline" onClick={openPicker} className="mt-1">
                <FolderOpen className="h-3.5 w-3.5" /> Chọn tệp từ máy
              </Button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-text-faint">
              <Clipboard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Chưa có kho lưu trữ tệp — tệp chỉ hiển thị tạm trong phiên soạn thảo này. Dùng
              liên kết ngoài nếu cần lưu lại.
            </p>
          </>
        ) : (
          <>
            <Input
              autoFocus
              icon={<Link2 />}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              placeholder={kind ? COPY[kind].placeholder : ""}
            />
            <p className="text-xs text-text-faint">{kind ? COPY[kind].urlLabel : ""}</p>
          </>
        )}

        {error && <p className="text-xs font-medium text-primary">{error}</p>}
      </div>
    </Modal>
  );
}
