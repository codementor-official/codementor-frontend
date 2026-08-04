export interface ProblemDiscussion {
  id: string;
  author: string;
  initials: string;
  role: string;
  postedAt: string;
  title: string;
  content: string;
  tags: string[];
  language?: string;
  code?: string;
  votes: number;
  replies: number;
  solved: boolean;
}

export const problemDiscussions: ProblemDiscussion[] = [
  {
    id: "discussion-1",
    author: "Trần Minh Khoa",
    initials: "MK",
    role: "Top 3% tuần này",
    postedAt: "18 phút trước",
    title: "Tách trường hợp biên trước khi xử lý công thức chính",
    content: "Mình thấy cách dễ kiểm soát nhất là liệt kê các trường hợp đặc biệt trước, sau đó mới đi vào nhánh xử lý chính. Cách này giúp test hidden case dễ hơn nhiều.",
    tags: ["Gợi ý", "Trường hợp biên"],
    language: "C++",
    code: "if (a == 0) {\n  // xử lý phương trình bậc nhất\n}\n// tiếp tục với delta",
    votes: 84,
    replies: 12,
    solved: true,
  },
  {
    id: "discussion-2",
    author: "Nguyễn Hải Yến",
    initials: "HY",
    role: "Backend Developer",
    postedAt: "1 giờ trước",
    title: "Vì sao so sánh số thực trực tiếp dễ sai?",
    content: "Nếu dùng delta == 0 thì một vài bộ test số thực có thể không ổn định. Mọi người nên thử so sánh với epsilon và tự giải thích vì sao cách này an toàn hơn.",
    tags: ["Hỏi đáp", "Độ chính xác"],
    language: "Java",
    code: "if (Math.abs(delta) < 1e-9) {\n  // nghiệm kép\n}",
    votes: 57,
    replies: 8,
    solved: false,
  },
  {
    id: "discussion-3",
    author: "Phạm Quốc Bảo",
    initials: "QB",
    role: "Thành viên",
    postedAt: "Hôm qua",
    title: "Checklist tự kiểm tra trước khi nộp bài",
    content: "Mình thường kiểm tra thứ tự nghiệm, định dạng hai chữ số thập phân, input âm và trường hợp delta rất gần 0. Chia sẻ để các bạn mới tránh mất lượt nộp.",
    tags: ["Kinh nghiệm", "Test case"],
    votes: 41,
    replies: 5,
    solved: true,
  },
  {
    id: "discussion-4",
    author: "Lê Thu Trang",
    initials: "TT",
    role: "Người học",
    postedAt: "2 ngày trước",
    title: "Có nên dùng hàm riêng để in kết quả không?",
    content: "Mình đang phân vân giữa viết toàn bộ trong main và tách hàm solve. Với bài nhỏ thì cách nào giúp code rõ hơn khi phỏng vấn?",
    tags: ["Hỏi đáp", "Clean code"],
    votes: 23,
    replies: 14,
    solved: false,
  },
];
