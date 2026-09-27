export interface AdminSectionDefinition {
  eyebrow: string;
  title: string;
}

/**
 * Các mục điều hướng CHƯA nối API. Mỗi mục chỉ có tiêu đề và nhóm.
 *
 * Trước đây mỗi mục còn kèm ba con số nổi bật — "1.247 khoá học", "26.814 request hôm nay"
 * — đều là số bịa viết cứng trong file này. Một màn quản trị hiển thị số bịa còn tệ hơn
 * một màn nói thẳng là chưa có dữ liệu: người đọc không có cách nào phân biệt, và quyết
 * định dựa trên nó thì sai mà không ai biết. Bỏ hẳn, tới khi nối được API thật.
 */
export const adminSections: Record<string, AdminSectionDefinition> = {
  "system-activity": {
    eyebrow: "Nền tảng",
    title: "Hoạt động hệ thống",
  },
  settings: {
    eyebrow: "Hệ thống",
    title: "Cài đặt",
  },
};
