import type { CourseCardProps } from "@/components/course-card";
import type { CurrentLevel } from "@/types/learning-preference";
import type { RoadmapField } from "@/types/roadmap";

export interface PracticeItem extends CourseCardProps {
  id: string;
  fields: RoadmapField[];
  technologies: string[];
  level: CurrentLevel;
  goals: Array<"workplace" | "fundamental" | "interview" | "algorithm">;
  estimatedMinutes: number;
  /** XP awarded once the exercise is accepted. Kept on the catalogue item so every surface uses the same reward. */
  xp: number;
  popularity: number;
  topic: PracticeTopic;
  status: PracticeStatus;
  acceptanceRate: number;
  companies: string[];
  isFavorite: boolean;
  isDaily: boolean;
}

export type PracticeTopic = "Algorithms" | "Frontend" | "Backend" | "Database" | "Data & AI" | "Mobile" | "Foundation";
export type PracticeStatus = "solved" | "attempted" | "todo";

type PracticeItemSeed = Omit<PracticeItem, "topic" | "status" | "acceptanceRate" | "companies" | "isFavorite" | "isDaily" | "xp">;

const practice = (item: PracticeItemSeed) => item;

/** A realistic mixed catalogue: short drills, applied business cases and interview exercises. */
const practiceItemSeeds: PracticeItemSeed[] = [
  practice({ id: "responsive-product-card", tile: "CSS", tileVariant: "primary", title: "Dựng thẻ sản phẩm responsive", desc: "Hoàn thiện thẻ sản phẩm có ảnh, giá khuyến mại và nút mua; bố cục phải hoạt động tốt từ mobile đến desktop.", difficulty: "Cơ bản", tags: ["CSS", "Responsive"], participants: "5.842", updated: "Cập nhật hôm nay", href: "/solve/responsive-product-card", fields: ["frontend"], technologies: ["JavaScript"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 25, popularity: 96 }),
  practice({ id: "validate-registration-form", tile: "form", tileVariant: "accent", title: "Kiểm tra form đăng ký tài khoản", desc: "Xử lý dữ liệu email, mật khẩu và thông báo lỗi trực tiếp để người dùng hoàn thành đăng ký chính xác.", difficulty: "Cơ bản", tags: ["JavaScript", "DOM"], participants: "5.216", updated: "Cập nhật 1 ngày trước", href: "/solve/validate-registration-form", fields: ["frontend", "fullstack"], technologies: ["JavaScript", "TypeScript"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 30, popularity: 94 }),
  practice({ id: "cart-discount-rule", tile: "%", tileVariant: "navy", title: "Tính khuyến mại giỏ hàng", desc: "Áp dụng đúng mã giảm giá, ngưỡng đơn hàng và phí vận chuyển cho đơn mua nhiều sản phẩm.", difficulty: "Trung bình", tags: ["JavaScript", "Logic"], participants: "4.680", updated: "Cập nhật hôm qua", href: "/solve/cart-discount-rule", fields: ["frontend", "backend", "fullstack"], technologies: ["JavaScript", "TypeScript", "Java"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 40, popularity: 93 }),
  practice({ id: "todo-api-pagination", tile: "API", tileVariant: "navy", title: "Phân trang API danh sách công việc", desc: "Thiết kế endpoint trả về danh sách công việc theo trang, kèm tổng số bản ghi và trạng thái bộ lọc.", difficulty: "Trung bình", tags: ["Node.js", "REST API"], participants: "4.326", updated: "Cập nhật 2 ngày trước", href: "/solve/todo-api-pagination", fields: ["backend", "fullstack"], technologies: ["Node.js", "TypeScript", "Java"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 45, popularity: 91 }),
  practice({ id: "sql-sales-report", tile: "SQL", tileVariant: "accent", title: "Báo cáo doanh thu theo tháng", desc: "Viết truy vấn tổng hợp đơn hàng, nhóm theo tháng và chỉ giữ các tháng có doanh thu vượt mục tiêu.", difficulty: "Trung bình", tags: ["SQL", "GROUP BY"], participants: "4.118", updated: "Cập nhật 3 ngày trước", href: "/solve/sql-sales-report", fields: ["backend", "data-ai"], technologies: ["SQL"], level: "intermediate", goals: ["workplace", "fundamental"], estimatedMinutes: 35, popularity: 90 }),
  practice({ id: "react-product-filter", tile: "Rx", tileVariant: "primary", title: "Bộ lọc sản phẩm với React", desc: "Đồng bộ ô tìm kiếm, mức giá và danh mục thành danh sách sản phẩm phản hồi tức thời.", difficulty: "Trung bình", tags: ["React", "State"], participants: "3.984", updated: "Cập nhật hôm nay", href: "/solve/react-product-filter", fields: ["frontend", "fullstack"], technologies: ["React", "TypeScript"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 50, popularity: 89 }),
  practice({ id: "python-clean-csv", tile: "py", tileVariant: "navy", title: "Làm sạch dữ liệu đơn hàng CSV", desc: "Chuẩn hóa ngày tháng, loại bỏ bản ghi trùng và tạo cột doanh thu để sẵn sàng phân tích.", difficulty: "Cơ bản", tags: ["Python", "Pandas"], participants: "3.751", updated: "Cập nhật 1 ngày trước", href: "/solve/python-clean-csv", fields: ["data-ai"], technologies: ["Python"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 35, popularity: 88 }),
  practice({ id: "flutter-task-list", tile: "Fl", tileVariant: "accent", title: "Danh sách công việc trên Flutter", desc: "Tạo màn hình công việc có thêm, đánh dấu hoàn tất và lưu trạng thái giao diện nhất quán.", difficulty: "Trung bình", tags: ["Flutter", "Widget"], participants: "3.405", updated: "Cập nhật 2 ngày trước", href: "/solve/flutter-task-list", fields: ["mobile"], technologies: ["Flutter"], level: "intermediate", goals: ["workplace", "fundamental"], estimatedMinutes: 45, popularity: 86 }),
  practice({ id: "spring-booking-validation", tile: "Sb", tileVariant: "navy", title: "Xác thực yêu cầu đặt lịch Spring Boot", desc: "Kiểm tra thời gian hợp lệ, dữ liệu trùng lịch và trả về lỗi chuẩn cho ứng dụng đặt lịch khám.", difficulty: "Trung bình", tags: ["Spring Boot", "Validation"], participants: "3.212", updated: "Cập nhật 4 ngày trước", href: "/solve/spring-booking-validation", fields: ["backend"], technologies: ["Java", "Spring Boot"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 50, popularity: 84 }),
  practice({ id: "binary-search-orders", tile: "O(log)", tileVariant: "primary", title: "Tìm đơn hàng theo mã đã sắp xếp", desc: "Áp dụng tìm kiếm nhị phân để xác định nhanh đơn hàng trong tập dữ liệu có thứ tự.", difficulty: "Cơ bản", tags: ["Mảng", "Thuật toán"], participants: "3.980", updated: "Cập nhật 5 ngày trước", href: "/solve/binary-search-orders", fields: ["foundation"], technologies: ["C/C++", "Java", "Python"], level: "basic", goals: ["fundamental", "interview", "algorithm"], estimatedMinutes: 25, popularity: 83 }),
  practice({ id: "linked-list-history", tile: "↔", tileVariant: "navy", title: "Quản lý lịch sử thao tác bằng Linked List", desc: "Mô phỏng lịch sử chỉnh sửa văn bản với thao tác thêm, xóa và di chuyển con trỏ.", difficulty: "Trung bình", tags: ["Linked List", "C++"], participants: "3.206", updated: "Cập nhật 1 tuần trước", href: "/solve/linked-list-history", fields: ["foundation"], technologies: ["C/C++", "Java"], level: "intermediate", goals: ["fundamental", "interview", "algorithm"], estimatedMinutes: 45, popularity: 81 }),
  practice({ id: "jwt-route-guard", tile: "JWT", tileVariant: "accent", title: "Bảo vệ API bằng JWT", desc: "Kiểm tra token, vai trò người dùng và phản hồi phù hợp khi truy cập tài nguyên riêng tư.", difficulty: "Nâng cao", tags: ["Node.js", "Security"], participants: "2.890", updated: "Cập nhật 3 ngày trước", href: "/solve/jwt-route-guard", fields: ["backend", "fullstack"], technologies: ["Node.js", "Java", "Spring Boot"], level: "experienced", goals: ["workplace", "interview"], estimatedMinutes: 60, popularity: 80 }),
  practice({ id: "typescript-invoice", tile: "TS", tileVariant: "primary", title: "Mô hình hóa hóa đơn bằng TypeScript", desc: "Tạo kiểu dữ liệu an toàn cho hóa đơn, chi tiết sản phẩm và trạng thái thanh toán.", difficulty: "Cơ bản", tags: ["TypeScript", "OOP"], participants: "3.115", updated: "Cập nhật hôm qua", href: "/solve/typescript-invoice", fields: ["frontend", "backend", "fullstack"], technologies: ["TypeScript"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 30, popularity: 79 }),
  practice({ id: "dashboard-chart-data", tile: "viz", tileVariant: "navy", title: "Chuẩn bị dữ liệu biểu đồ dashboard", desc: "Chuyển dữ liệu hoạt động thô thành chuỗi thời gian đủ để hiển thị biểu đồ theo ngày.", difficulty: "Trung bình", tags: ["Python", "Data"], participants: "2.764", updated: "Cập nhật 2 ngày trước", href: "/solve/dashboard-chart-data", fields: ["data-ai", "frontend"], technologies: ["Python", "JavaScript"], level: "intermediate", goals: ["workplace"], estimatedMinutes: 40, popularity: 77 }),
  practice({ id: "dotnet-inventory-api", tile: ".NET", tileVariant: "accent", title: "API tồn kho với ASP.NET Core", desc: "Xây dựng thao tác thêm và cập nhật tồn kho, đồng thời ngăn số lượng sản phẩm âm.", difficulty: "Trung bình", tags: ["C#", ".NET"], participants: "2.640", updated: "Cập nhật 4 ngày trước", href: "/solve/dotnet-inventory-api", fields: ["backend"], technologies: ["C#/.NET", "SQL"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 50, popularity: 75 }),
  practice({ id: "git-conflict-release", tile: "Git", tileVariant: "navy", title: "Xử lý conflict trước khi phát hành", desc: "Chọn thay đổi đúng giữa hai nhánh, hoàn tất merge và chuẩn bị ghi chú phiên bản an toàn.", difficulty: "Cơ bản", tags: ["Git", "Workflow"], participants: "3.482", updated: "Cập nhật hôm nay", href: "/solve/git-conflict-release", fields: ["foundation", "frontend", "backend"], technologies: ["Git"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 20, popularity: 74 }),
  practice({ id: "tree-permissions", tile: "tree", tileVariant: "primary", title: "Kiểm tra quyền truy cập theo cây phòng ban", desc: "Duyệt cấu trúc phòng ban để xác định nhân sự có thừa hưởng quyền truy cập tài liệu hay không.", difficulty: "Nâng cao", tags: ["Tree", "DFS"], participants: "2.301", updated: "Cập nhật 6 ngày trước", href: "/solve/tree-permissions", fields: ["foundation", "backend"], technologies: ["C/C++", "Java", "Python"], level: "experienced", goals: ["interview", "algorithm"], estimatedMinutes: 60, popularity: 72 }),
  practice({ id: "react-query-states", tile: "Rx", tileVariant: "accent", title: "Xử lý loading, empty và error state", desc: "Hoàn chỉnh trải nghiệm danh sách dữ liệu React cho cả lúc đang tải, không có dữ liệu và gặp lỗi mạng.", difficulty: "Trung bình", tags: ["React", "UX"], participants: "2.955", updated: "Cập nhật 1 ngày trước", href: "/solve/react-query-states", fields: ["frontend"], technologies: ["React", "TypeScript"], level: "intermediate", goals: ["workplace", "interview"], estimatedMinutes: 35, popularity: 71 }),
  practice({ id: "sql-window-ranking", tile: "rank", tileVariant: "navy", title: "Xếp hạng doanh số bằng SQL Window Function", desc: "Tính thứ hạng doanh số theo từng chi nhánh mà vẫn giữ toàn bộ chi tiết đơn hàng.", difficulty: "Nâng cao", tags: ["SQL", "Window Function"], participants: "2.176", updated: "Cập nhật 5 ngày trước", href: "/solve/sql-window-ranking", fields: ["data-ai", "backend"], technologies: ["SQL"], level: "experienced", goals: ["workplace", "interview"], estimatedMinutes: 55, popularity: 69 }),
  practice({ id: "flood-fill-map", tile: "BFS", tileVariant: "primary", title: "Đếm vùng liên thông trên bản đồ", desc: "Dùng BFS hoặc DFS để đếm các khu vực liên thông trên bản đồ ô vuông.", difficulty: "Trung bình", tags: ["Graph", "BFS/DFS"], participants: "2.816", updated: "Cập nhật 1 tuần trước", href: "/solve/flood-fill-map", fields: ["foundation"], technologies: ["C/C++", "Python", "Java"], level: "intermediate", goals: ["interview", "algorithm"], estimatedMinutes: 40, popularity: 68 }),
  practice({ id: "flutter-offline-note", tile: "Fl", tileVariant: "navy", title: "Ghi chú offline-first trên Flutter", desc: "Lưu bản nháp cục bộ, đồng bộ khi có mạng và hiển thị trạng thái dữ liệu rõ ràng.", difficulty: "Nâng cao", tags: ["Flutter", "Local storage"], participants: "1.986", updated: "Cập nhật 2 ngày trước", href: "/solve/flutter-offline-note", fields: ["mobile"], technologies: ["Flutter"], level: "experienced", goals: ["workplace"], estimatedMinutes: 65, popularity: 67 }),
  practice({ id: "rate-limiter", tile: "429", tileVariant: "accent", title: "Giới hạn số lần gọi API", desc: "Thiết kế bộ đếm cửa sổ thời gian để bảo vệ endpoint đăng nhập trước lượng yêu cầu bất thường.", difficulty: "Nâng cao", tags: ["Backend", "System design"], participants: "1.842", updated: "Cập nhật 3 ngày trước", href: "/solve/rate-limiter", fields: ["backend"], technologies: ["Node.js", "Java", "Spring Boot"], level: "experienced", goals: ["workplace", "interview"], estimatedMinutes: 60, popularity: 65 }),
  practice({ id: "portfolio-accessibility", tile: "a11y", tileVariant: "primary", title: "Rà soát accessibility trang portfolio", desc: "Sửa nhãn điều khiển, thứ tự tab và độ tương phản để portfolio thân thiện hơn với mọi người dùng.", difficulty: "Cơ bản", tags: ["HTML", "Accessibility"], participants: "2.462", updated: "Cập nhật hôm qua", href: "/solve/portfolio-accessibility", fields: ["frontend"], technologies: ["JavaScript", "React"], level: "basic", goals: ["workplace", "fundamental"], estimatedMinutes: 25, popularity: 64 }),
];

const TOPIC_BY_ID: Record<string, PracticeTopic> = {
  "responsive-product-card": "Frontend", "validate-registration-form": "Frontend", "cart-discount-rule": "Algorithms",
  "todo-api-pagination": "Backend", "sql-sales-report": "Database", "react-product-filter": "Frontend",
  "python-clean-csv": "Data & AI", "flutter-task-list": "Mobile", "spring-booking-validation": "Backend",
  "binary-search-orders": "Algorithms", "linked-list-history": "Algorithms", "jwt-route-guard": "Backend",
  "typescript-invoice": "Foundation", "dashboard-chart-data": "Data & AI", "dotnet-inventory-api": "Backend",
  "git-conflict-release": "Foundation", "tree-permissions": "Algorithms", "react-query-states": "Frontend",
  "sql-window-ranking": "Database", "flood-fill-map": "Algorithms", "flutter-offline-note": "Mobile",
  "rate-limiter": "Backend", "portfolio-accessibility": "Frontend",
};

const SOLVED_IDS = new Set([
  "responsive-product-card", "validate-registration-form", "python-clean-csv", "binary-search-orders",
  "typescript-invoice", "git-conflict-release", "portfolio-accessibility",
]);
const ATTEMPTED_IDS = new Set(["cart-discount-rule", "react-product-filter", "todo-api-pagination", "linked-list-history"]);
const FAVORITE_IDS = new Set(["cart-discount-rule", "todo-api-pagination", "binary-search-orders", "tree-permissions", "sql-window-ranking"]);
const XP_BY_DIFFICULTY: Record<PracticeItem["difficulty"], number> = { "Cơ bản": 25, "Trung bình": 50, "Nâng cao": 80 };
const COMPANY_BY_TOPIC: Record<PracticeTopic, string[]> = {
  Algorithms: ["FPT Software", "VNG", "Google"],
  Frontend: ["VNG", "MoMo", "Tiki"],
  Backend: ["Viettel", "VNPay", "NashTech"],
  Database: ["MoMo", "KMS", "Viettel"],
  "Data & AI": ["FPT Smart Cloud", "VNG", "NielsenIQ"],
  Mobile: ["Zalo", "MoMo", "Grab"],
  Foundation: ["FPT Software", "KMS", "Rikkeisoft"],
};

/** Mock problem-bank fields intentionally stay separate from course recommendation metadata. */
export const practiceItems: PracticeItem[] = practiceItemSeeds.map((item, index) => {
  const topic = TOPIC_BY_ID[item.id] ?? "Foundation";
  return {
    ...item,
    topic,
    status: SOLVED_IDS.has(item.id) ? "solved" : ATTEMPTED_IDS.has(item.id) ? "attempted" : "todo",
    acceptanceRate: Math.max(28.4, Math.min(78.6, 77.8 - index * 1.9 + (index % 4) * 3.2)),
    xp: XP_BY_DIFFICULTY[item.difficulty],
    companies: COMPANY_BY_TOPIC[topic],
    isFavorite: FAVORITE_IDS.has(item.id),
    isDaily: item.id === "cart-discount-rule",
  };
});
