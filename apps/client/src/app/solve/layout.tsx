import { RequireAuth } from "@/components/require-auth";

/**
 * Trang làm bài nằm ngoài nhóm `(app)` vì nó không có sidebar — nhưng nó vẫn đọc bài tập
 * và gọi chấm bài qua BFF, nên vẫn cần phiên. Không có layout này thì nó là lỗ duy nhất
 * lọt qua cổng ở `(app)/layout.tsx`, và đúng là lỗ mà người dùng đi vào: mở tab làm bài
 * khi phiên đã hết thì trang bày ra "Không mở được bài tập này" thay vì đưa đi đăng nhập.
 */
export default function SolveLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
