/**
 * Lịch sử hội thoại với Lecter trong Studio bài tập của Workspace.
 *
 * Nằm ở localStorage vì phase này chưa đụng backend: `ai_agent_sessions` mới chỉ có đường
 * cho app giảng viên (`api.lecter.sessions()`). Đổi sang API chỉ phải thay bốn hàm dưới đây.
 */

export interface LecterAttachment {
  id: string;
  title: string;
}

/** Đúng hình dạng `POST /workspaces/:slug/exercises/generate-draft` trả về. */
export interface LecterDraft {
  title: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  content: Record<string, unknown>;
  sourceDocuments: LecterAttachment[];
}

export interface LecterMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Tài liệu đính kèm của lượt hỏi. */
  attachments?: LecterAttachment[];
  /** Bản nháp Lecter trả về; chỉ có ở lượt trả lời thành công. */
  draft?: LecterDraft;
  failed?: boolean;
}

export interface LecterSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: LecterMessage[];
}

/** Mỗi workspace một kho riêng: hội thoại nhắc tới tài liệu của chính nhóm đó. */
const storageKey = (slug: string) => `codementor:lecter-sessions:${slug}`;

/** ponytail: cắt cứng 20 hội thoại — localStorage có quota, và chưa ai cuộn xa hơn thế. */
const MAX_SESSIONS = 20;

export function readSessions(slug: string): LecterSession[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey(slug)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as LecterSession[]) : [];
  } catch {
    return [];
  }
}

export function writeSessions(slug: string, sessions: LecterSession[]): void {
  try {
    window.localStorage.setItem(
      storageKey(slug),
      JSON.stringify(sessions.slice(0, MAX_SESSIONS)),
    );
  } catch {
    // Hết quota thì bỏ qua: mất lịch sử vẫn hơn là chặn người soạn giữa chừng.
  }
}

export function newSession(): LecterSession {
  return {
    id: crypto.randomUUID(),
    title: "Hội thoại mới",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

/** Tên hội thoại lấy từ câu hỏi đầu tiên — không có gì để đặt tên thì giữ nhãn mặc định. */
export function sessionTitle(messages: LecterMessage[]): string {
  const first = messages.find((message) => message.role === "user")?.text.trim();
  if (!first) return "Hội thoại mới";
  return first.length > 60 ? `${first.slice(0, 60)}…` : first;
}
