export interface AdminSectionDefinition {
  description: string;
  eyebrow: string;
  title: string;
}

/**
 * Các mục điều hướng CHƯA nối API. Mỗi mục chỉ có tiêu đề, nhóm và một câu mô tả phạm vi.
 *
 * Trước đây mỗi mục còn kèm ba con số nổi bật — "1.247 khoá học", "26.814 request hôm nay"
 * — đều là số bịa viết cứng trong file này. Một màn quản trị hiển thị số bịa còn tệ hơn
 * một màn nói thẳng là chưa có dữ liệu: người đọc không có cách nào phân biệt, và quyết
 * định dựa trên nó thì sai mà không ai biết. Bỏ hẳn, tới khi nối được API thật.
 */
export const adminSections: Record<string, AdminSectionDefinition> = {
  documents: {
    description: "Theo dõi tài liệu người dùng tải lên và kết quả xử lý.",
    eyebrow: "Nội dung",
    title: "Tài liệu",
  },
  "ai-operations": {
    description: "Quan sát mức dùng AI, hàng đợi xử lý và ngưỡng dịch vụ.",
    eyebrow: "Nền tảng",
    title: "Vận hành AI",
  },
  "code-judge": {
    description: "Theo dõi năng lực chấm bài, độ tin cậy và trình chạy từng ngôn ngữ.",
    eyebrow: "Nền tảng",
    title: "Chấm bài",
  },
  "system-activity": {
    description: "Xem sự kiện vận hành và hoạt động xuyên suốt các dịch vụ.",
    eyebrow: "Nền tảng",
    title: "Hoạt động hệ thống",
  },
  settings: {
    description: "Cấu hình mặc định nền tảng, tích hợp và chính sách quản trị.",
    eyebrow: "Hệ thống",
    title: "Cài đặt",
  },
};
