import type { AuthoredProblem } from "@/types/authored-problem";

/** Everything the signed-in author has created in `/create-problem`, newest first. */
export const authoredProblems: AuthoredProblem[] = [
  {
    id: "ap-01",
    kind: "code",
    title: "Kiểm tra số nguyên tố",
    status: "published",
    updatedAt: "02/08/2026 21:40",
    assignedGroups: ["Nhóm Nhập môn Lập trình"],
    difficulty: "easy",
    tags: ["Vòng lặp", "Số học"],
    languageCount: 2,
    testCaseCount: 6,
    solverCount: 18,
    statement:
      "Cho một số nguyên dương n. Hãy kiểm tra xem n có phải là số nguyên tố hay không. In ra YES nếu đúng, ngược lại in ra NO.",
    examples: [
      { input: "n = 17", output: "YES" },
      { input: "n = 20", output: "NO" },
    ],
    constraints: ["1 ≤ n ≤ 10^9", "Giới hạn thời gian: 1 giây · Bộ nhớ: 64MB"],
    solveSlug: "kiem-tra-so-nguyen-to",
  },
  {
    id: "ap-02",
    kind: "theory",
    title: "Giới thiệu tư duy thuật toán",
    status: "published",
    updatedAt: "02/08/2026 16:12",
    assignedGroups: ["Nhóm Nhập môn Lập trình", "Python cho Người mới"],
    chapter: "Chương 1",
    durationMinutes: 10,
    objectiveCount: 3,
    readerCount: 42,
    summary: "Hiểu thuật toán là gì và cách chia nhỏ một bài toán trước khi viết code.",
    objectives: [
      "Nắm ý chính của bài học",
      "Áp dụng vào ví dụ nhỏ",
      "Tự kiểm tra trước khi chuyển sang bài tiếp theo",
    ],
    contentHtml: `<h2>Thuật toán là gì?</h2><p>Thuật toán là một <strong>chuỗi bước hữu hạn</strong> để giải một bài toán. Mỗi bước phải rõ ràng và thực hiện được.</p><h3>Nội dung trọng tâm</h3><p>Bài học trình bày khái niệm qua một tình huống gần với công việc thực tế. Sau khi xem hoặc đọc, hãy thử diễn giải lại bằng ngôn ngữ của bạn.</p><pre><code class="language-python">def is_prime(n):
    if n &lt; 2:
        return False
    i = 2
    while i * i &lt;= n:
        if n % i == 0:
            return False
        i += 1
    return True</code></pre><h3>Gợi ý thực hành</h3><p>Thay đổi một đầu vào trong ví dụ, quan sát kết quả rồi ghi lại điều bạn rút ra. Đây là cách nhanh nhất để biến kiến thức thành kỹ năng.</p>`,
  },
  {
    id: "ap-03",
    kind: "code",
    title: "Giải phương trình bậc hai",
    status: "published",
    updatedAt: "31/07/2026 09:05",
    assignedGroups: ["Nhóm Nhập môn Lập trình"],
    difficulty: "medium",
    tags: ["Toán", "Điều kiện"],
    languageCount: 3,
    testCaseCount: 8,
    solverCount: 12,
    statement:
      "Cho ba hệ số a, b, c của phương trình ax² + bx + c = 0. Hãy giải phương trình và in ra nghiệm theo yêu cầu.",
    examples: [
      { input: "1 -3 2", output: "x1 = 2.00, x2 = 1.00" },
      { input: "1 2 5", output: "Vo nghiem thuc" },
    ],
    constraints: ["|a|, |b|, |c| ≤ 10^4", "a có thể bằng 0 — xử lý như phương trình bậc nhất"],
    solveSlug: "giai-phuong-trinh-bac-hai",
  },
  {
    id: "ap-04",
    kind: "theory",
    title: "Cấu trúc điều kiện & vòng lặp",
    status: "draft",
    updatedAt: "30/07/2026 22:18",
    assignedGroups: [],
    chapter: "Chương 2",
    durationMinutes: 15,
    objectiveCount: 4,
    readerCount: 0,
    summary: "Phân biệt if/else, switch và ba dạng vòng lặp thường dùng.",
    objectives: [
      "Viết đúng câu lệnh điều kiện nhiều nhánh",
      "Chọn được vòng lặp phù hợp với bài toán",
      "Tránh lỗi lặp vô hạn",
      "Đọc hiểu vòng lặp lồng nhau",
    ],
    contentHtml: `<h2>Câu lệnh điều kiện</h2><p>Dùng <code>if</code> khi cần rẽ nhánh theo một biểu thức logic. Khi có nhiều nhánh rời rạc, <code>switch</code> đọc dễ hơn chuỗi <code>else if</code> dài.</p><h3>Vòng lặp</h3><ul><li><strong>for</strong> — biết trước số lần lặp</li><li><strong>while</strong> — lặp đến khi điều kiện sai</li><li><strong>do…while</strong> — chạy ít nhất một lần</li></ul><blockquote>Luôn đảm bảo biến điều khiển thay đổi bên trong vòng lặp, nếu không chương trình sẽ chạy mãi.</blockquote>`,
  },
  {
    id: "ap-05",
    kind: "code",
    title: "Đảo ngược danh sách liên kết",
    status: "published",
    updatedAt: "28/07/2026 14:30",
    assignedGroups: ["Hội ôn thi DSA"],
    difficulty: "hard",
    tags: ["Danh sách liên kết", "Con trỏ"],
    languageCount: 2,
    testCaseCount: 10,
    solverCount: 7,
    statement:
      "Cho danh sách liên kết đơn có n nút. Hãy đảo ngược danh sách và trả về nút đầu mới. Không được cấp phát mảng phụ.",
    examples: [
      { input: "1 -> 2 -> 3 -> null", output: "3 -> 2 -> 1 -> null" },
      { input: "null", output: "null" },
    ],
    constraints: ["0 ≤ n ≤ 10^5", "Bộ nhớ phụ O(1)"],
    solveSlug: "dao-nguoc-danh-sach-lien-ket",
  },
  {
    id: "ap-06",
    kind: "code",
    title: "Tính tổng phần tử mảng",
    status: "draft",
    updatedAt: "27/07/2026 08:44",
    assignedGroups: [],
    difficulty: "easy",
    tags: ["Mảng"],
    languageCount: 1,
    testCaseCount: 4,
    solverCount: 0,
    statement: "Cho mảng n số nguyên. Hãy tính và in ra tổng tất cả các phần tử của mảng.",
    examples: [{ input: "5\n1 2 3 4 5", output: "15" }],
    constraints: ["1 ≤ n ≤ 10^5", "|a[i]| ≤ 10^9 — chú ý tràn số khi cộng dồn"],
    solveSlug: "tinh-tong-phan-tu-mang",
  },
  {
    id: "ap-07",
    kind: "theory",
    title: "Độ phức tạp thuật toán Big-O",
    status: "draft",
    updatedAt: "25/07/2026 19:02",
    assignedGroups: [],
    chapter: "Chương 3",
    durationMinutes: 20,
    objectiveCount: 5,
    readerCount: 0,
    summary: "Ước lượng chi phí của thuật toán khi dữ liệu lớn dần.",
    objectives: [
      "Đọc hiểu ký hiệu O lớn",
      "Đếm số thao tác của một vòng lặp",
      "So sánh O(n) và O(n²)",
      "Nhận ra thuật toán O(log n)",
      "Chọn thuật toán theo giới hạn đề bài",
    ],
    contentHtml: `<h2>Vì sao cần Big-O?</h2><p>Đo bằng giây phụ thuộc vào máy chạy. Big-O mô tả <strong>tốc độ tăng chi phí</strong> khi dữ liệu lớn dần, nên so sánh được giữa các thuật toán.</p><h3>Các bậc thường gặp</h3><ol><li>O(1) — truy cập phần tử theo chỉ số</li><li>O(log n) — tìm kiếm nhị phân</li><li>O(n) — duyệt một lần qua mảng</li><li>O(n²) — hai vòng lặp lồng nhau</li></ol><p>Với n = 10⁵, một thuật toán O(n²) cần khoảng 10¹⁰ phép tính — quá chậm cho giới hạn 1 giây.</p>`,
  },
];

export function getAuthoredProblem(id: string): AuthoredProblem | undefined {
  return authoredProblems.find((p) => p.id === id);
}
