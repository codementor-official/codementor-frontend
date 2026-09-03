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
export interface AiCitation {
  sourceId: string;
  documentId: string;
  title: string;
  page: number | null;
  excerpt: string;
}
export interface AiTurn {
  id: string;
  question: string;
  answer: string;
  supplementalAnswer?: string;
  citations: AiCitation[];
  insufficientEvidence: boolean;
  createdAt: string;
}
export interface AiConversation {
  id: string;
  title: string;
  documentIds: string[];
  documents: { id: string; title: string }[];
  turns: AiTurn[];
  createdAt: string;
  updatedAt: string;
}
export type AiConversationSummary = Pick<
  AiConversation,
  "id" | "title" | "documentIds" | "updatedAt"
>;
export interface AiPage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
