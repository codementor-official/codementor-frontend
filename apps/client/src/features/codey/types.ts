/** Trạng thái hoạt ảnh của mascot. Mỗi giá trị là một ô trên `mascot-sprite.png`. */
export type MascotState = "idle" | "thinking" | "typing" | "loading" | "success" | "error";

/** Một dòng trong khung chat. Lời gọi tool là một dòng trạng thái, không phải bong bóng. */
export type CodeyItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "codey"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; done: boolean };

/** Một hội thoại trong droplist lịch sử. `exerciseTitle` để phân biệt phiên của bài khác. */
export interface CodeySessionSummary {
  id: string;
  title: string;
  exerciseTitle: string;
  updatedAt: string;
}

/** Lần chạy gần nhất. `seq` tăng mỗi lần bấm Chạy/Nộp — kể cả khi kết quả giống hệt lần trước,
 *  nếu không thì hai lần fail liên tiếp cùng số test sẽ không đánh thức lại lời mời của mascot. */
export interface CodeyRun {
  seq: number;
  failed: number;
  /** Số lần sửa code TÍNH ĐẾN lúc chạy. So với số hiện tại là biết học viên đã sửa gì sau đó
   *  chưa — sửa rồi thì họ tự tìm ra chỗ sai, và lời mời của mascot thành nhiễu. */
  codeRevision: number;
}
