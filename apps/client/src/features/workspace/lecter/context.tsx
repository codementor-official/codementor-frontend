"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExerciseDraft } from "@codementor/solve";
import type { LecterDraftPatch } from "./types";

/**
 * Ngữ cảnh của một phiên Lecter trong studio: nhóm nào, form nào.
 *
 * Phải là context chứ không phải prop: `input` và các tool HITL của CopilotKit là **slot** —
 * chúng được `React.createElement(slot, props)` gọi với đúng props của CopilotKit, nên không có
 * đường nào truyền `slug` hay hàm áp vào form xuống bằng prop thường.
 */
interface LecterContextValue {
  slug: string;
  /** Bản nháp đang mở trong studio — dùng để nói trước những gì sắp bị ghi đè. */
  draft: ExerciseDraft;
  /** Áp một thay đổi TỪNG PHẦN vào form. Không lưu; người soạn tự bấm Lưu ở studio. */
  applyPatch: (patch: LecterDraftPatch) => void;
  /** Bài đã đăng trong nhóm hay chưa — thẻ xác nhận nói khác nhau ở hai trường hợp. */
  editingSaved: boolean;
}

const LecterContext = createContext<LecterContextValue | null>(null);

export function LecterProvider({
  value,
  children,
}: {
  value: LecterContextValue;
  children: ReactNode;
}) {
  return <LecterContext.Provider value={value}>{children}</LecterContext.Provider>;
}

export function useLecterContext(): LecterContextValue {
  const value = useContext(LecterContext);
  if (!value) throw new Error("useLecterContext phải nằm trong <LecterProvider>");
  return value;
}
