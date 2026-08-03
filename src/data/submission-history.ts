export type SubmissionOrigin = "Nhóm học tập" | "Bài luyện tập";

export interface SubmissionHistoryItem {
  id: string;
  title: string;
  origin: SubmissionOrigin;
  groupName?: string;
  language: string;
  result: "Đạt" | "Không đạt" | "Lỗi biên dịch";
  score: number;
  passedTests: number;
  totalTests: number;
  runtime: string;
  memory: string;
  submittedAt: string;
  version: number;
  sourceCode: string;
  note: string;
}

export const submissionHistory: SubmissionHistoryItem[] = [
  { id: "sub-01", title: "Đảo ngược danh sách liên kết", origin: "Nhóm học tập", groupName: "Nhóm Nhập môn Lập trình", language: "C++17", result: "Đạt", score: 100, passedTests: 6, totalTests: 6, runtime: "12 ms", memory: "4.2 MB", submittedAt: "23/07/2026 21:18", version: 1, sourceCode: "Node* reverse(Node* head) {\n  Node* prev = nullptr;\n  while (head) {\n    Node* next = head->next;\n    head->next = prev;\n    prev = head;\n    head = next;\n  }\n  return prev;\n}", note: "Đảo đúng liên kết, không dùng mảng phụ." },
  { id: "sub-02", title: "Giải Phương trình Bậc hai", origin: "Nhóm học tập", groupName: "Nhóm Nhập môn Lập trình", language: "C++17", result: "Không đạt", score: 80, passedTests: 4, totalTests: 5, runtime: "9 ms", memory: "3.8 MB", submittedAt: "23/07/2026 08:05", version: 3, sourceCode: "double delta = b*b - 4*a*c;\nif (delta == 0) cout << -b / (2*a);", note: "Cần xử lý sai số khi so sánh delta bằng 0." },
  { id: "sub-03", title: "Tính tổng phần tử mảng", origin: "Nhóm học tập", groupName: "Nhóm Nhập môn Lập trình", language: "Java", result: "Không đạt", score: 50, passedTests: 2, totalTests: 4, runtime: "14 ms", memory: "18 MB", submittedAt: "22/07/2026 19:55", version: 1, sourceCode: "int total = 0;\nfor (int i = 0; i <= values.length; i++) total += values[i];", note: "Vòng lặp đang vượt chỉ số mảng ở phần tử cuối." },
  { id: "sub-04", title: "Two Sum", origin: "Bài luyện tập", language: "TypeScript", result: "Đạt", score: 100, passedTests: 12, totalTests: 12, runtime: "46 ms", memory: "44 MB", submittedAt: "21/07/2026 22:10", version: 2, sourceCode: "const seen = new Map<number, number>();\nfor (let i = 0; i < nums.length; i++) {\n  const rest = target - nums[i];\n  if (seen.has(rest)) return [seen.get(rest)!, i];\n  seen.set(nums[i], i);\n}", note: "Độ phức tạp O(n) với hash map." },
  { id: "sub-05", title: "Xoay mảng k vị trí", origin: "Nhóm học tập", groupName: "Nhóm Nhập môn Lập trình", language: "Python 3", result: "Đạt", score: 100, passedTests: 8, totalTests: 8, runtime: "28 ms", memory: "11 MB", submittedAt: "20/07/2026 20:22", version: 1, sourceCode: "k %= len(nums)\nnums[:] = nums[-k:] + nums[:-k]", note: "Xử lý đúng k lớn hơn n." },
  { id: "sub-06", title: "Kiểm tra chuỗi đối xứng", origin: "Bài luyện tập", language: "Java", result: "Lỗi biên dịch", score: 0, passedTests: 0, totalTests: 8, runtime: "–", memory: "–", submittedAt: "19/07/2026 18:40", version: 1, sourceCode: "public boolean check(String text) {\n  return text == new StringBuilder(text).reverse();\n}", note: "Thiếu dấu chấm phẩy và so sánh String chưa đúng." },
  { id: "sub-07", title: "Kiểm tra số nguyên tố", origin: "Bài luyện tập", language: "C++17", result: "Đạt", score: 100, passedTests: 10, totalTests: 10, runtime: "7 ms", memory: "3.7 MB", submittedAt: "18/07/2026 21:02", version: 2, sourceCode: "bool isPrime(int n) {\n  if (n < 2) return false;\n  for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;\n  return true;\n}", note: "Đúng với độ phức tạp O(√n)." },
];
