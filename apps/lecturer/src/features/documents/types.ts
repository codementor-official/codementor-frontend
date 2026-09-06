/** `StatusBadge` không xuất kiểu tone của nó ra ngoài; chép đúng union của nó. */
type BadgeTone = "neutral" | "success" | "warning" | "danger";

/** Trạng thái xử lý của một tài liệu — vòng đời index ở ai-service, không phải vòng đời nội dung. */
export type DocumentState =
  | "not_indexed"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "unsupported";

export interface AiDocument {
  id: string;
  title: string;
  docType: "pdf" | "docx" | "pptx" | "txt" | "md";
  sizeBytes: number;
  createdAt: string;
  expiresAt?: string | null;
  state: DocumentState;
  chunkCount: number;
  error?: string;
}

export interface DocumentLimits {
  supportedTypes: string[];
  maxFileBytes: number;
  maxFilesPerMessage: number;
}

export const DOCUMENT_STATE_LABELS: Record<DocumentState, string> = {
  not_indexed: "Chưa xử lý",
  queued: "Đang chờ",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Lỗi",
  unsupported: "Không hỗ trợ",
};

export const DOCUMENT_STATE_TONES: Record<DocumentState, BadgeTone> = {
  not_indexed: "neutral",
  queued: "neutral",
  processing: "warning",
  ready: "success",
  failed: "danger",
  unsupported: "danger",
};

/** Chỉ những tài liệu đã xử lý xong mới đính kèm được — Lecter chưa đọc được phần còn lại. */
export function isUsable(document: AiDocument): boolean {
  return document.state === "ready";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
