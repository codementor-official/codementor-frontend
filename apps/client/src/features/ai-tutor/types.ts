export interface AiStatus {
  configured: boolean;
  embeddingModel: string;
  chatModel: string;
  supportedTypes: string[];
  maxDocuments: number;
}
export interface AiDocument {
  id: string;
  title: string;
  docType: string;
  state:
    | "not_indexed"
    | "queued"
    | "processing"
    | "ready"
    | "failed"
    | "unsupported";
  chunkCount: number;
  error?: string;
}
/** Một đoạn tài liệu đã đưa cho model, mã `S1`, `S2`… theo từng lượt. Cũng là hình dạng của
 *  một trích dẫn đã đối chiếu — ai-service dùng chung. */
export interface AiCitation {
  sourceId: string;
  documentId: string;
  title: string;
  page: number | null;
  excerpt: string;
}
/** Một lượt đã đối chiếu (`grounding[id tin nhắn người dùng]` ở ai-service). Cùng hình dạng
 *  turn của `ai_conversations` cũ, nên hội thoại đã migrate vẽ y như hội thoại mới. */
export interface TutorTurn {
  answer: string;
  supplementalAnswer: string;
  insufficientEvidence: boolean;
  citations: AiCitation[];
  createdAt: string;
}
export interface TutorDocument {
  id: string;
  title: string;
}
/** State AG-UI của agent `tutor`. Server là nguồn sự thật; trình duyệt chỉ gửi `documents`. */
export interface TutorState {
  documents?: TutorDocument[];
  sources?: AiCitation[];
  grounding?: Record<string, TutorTurn>;
  step?: string;
}
export interface TutorSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}
export interface AiPage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
