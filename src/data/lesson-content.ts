import type { Course, Lesson } from "@/types/roadmap";

export interface LessonContent {
  summary: string;
  objectives: string[];
  sections: Array<{ heading: string; paragraphs: string[] }>;
  code?: { label: string; language: string; value: string };
  exerciseBrief?: string[];
}

const JAVA_CORE_CONTENT: Record<string, LessonContent> = {
  "Cú pháp Java cơ bản": {
    summary: "Làm quen với cấu trúc một chương trình Java, phương thức main và cách biên dịch đoạn mã đầu tiên.",
    objectives: ["Nhận biết class, phương thức main và câu lệnh", "Chạy được chương trình Java đầu tiên", "Hiểu vì sao tên class cần nhất quán với file"],
    sections: [
      { heading: "Một chương trình Java bắt đầu từ đâu?", paragraphs: ["Java tổ chức mã nguồn bên trong class. Khi chạy ứng dụng console, JVM tìm tới phương thức main để bắt đầu thực thi.", "Mỗi câu lệnh kết thúc bằng dấu chấm phẩy; Java phân biệt chữ hoa và chữ thường nên cần đặt tên cẩn thận."] },
      { heading: "Cách đọc đoạn mã", paragraphs: ["Hãy đọc từ ngoài vào trong: class chứa chương trình, main là điểm khởi động, System.out.println là lệnh in dữ liệu ra màn hình."] },
    ],
    code: { label: "Main.java", language: "java", value: "public class Main {\n  public static void main(String[] args) {\n    String learner = \"Gia Sĩ\";\n    System.out.println(\"Chào mừng \" + learner + \" đến với Java Core!\");\n  }\n}" },
  },
  "Kiểu dữ liệu nguyên thủy và tham chiếu": {
    summary: "Phân biệt dữ liệu lưu trực tiếp như int, double, boolean với các đối tượng được tham chiếu như String và ArrayList.",
    objectives: ["Chọn kiểu dữ liệu phù hợp", "Hiểu khác biệt primitive/reference", "Tránh lỗi ép kiểu không cần thiết"],
    sections: [
      { heading: "Kiểu nguyên thủy", paragraphs: ["int phù hợp cho số nguyên, double cho số thực, boolean cho trạng thái đúng/sai. Chúng lưu giá trị trực tiếp."] },
      { heading: "Kiểu tham chiếu", paragraphs: ["String và object lưu địa chỉ tham chiếu đến vùng dữ liệu. Vì thế, cách so sánh và truyền dữ liệu của chúng cần được chú ý hơn."] },
    ],
    code: { label: "DataTypes.java", language: "java", value: "int completedLessons = 8;\ndouble progress = 30.5;\nboolean isActive = true;\nString courseName = \"Java Core\";\n\nSystem.out.println(courseName + \": \" + completedLessons);" },
  },
  "Class và Object": {
    summary: "Dùng class để mô tả dữ liệu và hành vi; tạo object để biểu diễn một thực thể cụ thể trong ứng dụng.",
    objectives: ["Khai báo class có thuộc tính và phương thức", "Khởi tạo object bằng new", "Tách dữ liệu và hành vi hợp lý"],
    sections: [
      { heading: "Từ dữ liệu rời rạc tới mô hình", paragraphs: ["Thay vì quản lý tên, email và tiến độ bằng nhiều biến, class Learner gom chúng vào một cấu trúc có ý nghĩa.", "Object là một bản thể cụ thể của class; mỗi object có dữ liệu riêng nhưng dùng chung các hành vi được định nghĩa trong class."] },
    ],
    code: { label: "Learner.java", language: "java", value: "class Learner {\n  String name;\n  int xp;\n\n  void addXp(int amount) {\n    xp += amount;\n  }\n}\n\nLearner giaSi = new Learner();\ngiaSi.name = \"Gia Sĩ\";\ngiaSi.addXp(20);" },
  },
  "Kế thừa và đa hình": {
    summary: "Tái sử dụng hành vi chung qua kế thừa và để từng loại đối tượng triển khai hành vi phù hợp bằng đa hình.",
    objectives: ["Tạo class con với extends", "Ghi đè phương thức bằng @Override", "Nhận biết lợi ích của đa hình trong code nghiệp vụ"],
    sections: [
      { heading: "Kế thừa có mục đích", paragraphs: ["CourseContent có thể chứa thông tin chung như title và duration. VideoLesson và ArticleLesson kế thừa phần đó, rồi bổ sung cách hiển thị riêng."] },
      { heading: "Đa hình giúp mở rộng", paragraphs: ["Khi hệ thống xử lý danh sách CourseContent, mỗi phần tử có thể thực thi phương thức display theo đúng loại của nó mà không cần nhiều câu lệnh if/else."] },
    ],
    code: { label: "Polymorphism.java", language: "java", value: "class Lesson {\n  void open() { System.out.println(\"Mở bài học\"); }\n}\n\nclass VideoLesson extends Lesson {\n  @Override void open() { System.out.println(\"Phát video\"); }\n}\n\nLesson lesson = new VideoLesson();\nlesson.open();" },
  },
  "Bài tập: Mô hình hóa hệ thống quản lý thư viện": {
    summary: "Vận dụng OOP để thiết kế các class Book, Member và Loan cho một quy trình mượn/trả sách đơn giản.",
    objectives: ["Xác định entity và thuộc tính cốt lõi", "Viết quan hệ giữa các class", "Mô phỏng nghiệp vụ mượn và trả sách"],
    sections: [
      { heading: "Bối cảnh nghiệp vụ", paragraphs: ["Thư viện cần quản lý sách, bạn đọc và mỗi lượt mượn. Một quyển sách chỉ được cho mượn khi còn sẵn; một lượt mượn cần biết ngày mượn và hạn trả."] },
    ],
    exerciseBrief: ["Tạo class Book gồm mã sách, tên sách và trạng thái còn sẵn.", "Tạo class Member và Loan; Loan liên kết một Book với một Member.", "Viết phương thức borrowBook() không cho phép mượn nếu sách đã được đánh dấu unavailable.", "In ra thông tin một lượt mượn hợp lệ để tự kiểm tra kết quả."],
  },
};

function genericContent(course: Course, lesson: Lesson): LessonContent {
  const kind = lesson.type === "video" ? "video hướng dẫn" : lesson.type === "exercise" || lesson.type === "project" ? "bài thực hành" : "bài đọc";
  return {
    summary: `Nội dung mock cho ${kind.toLowerCase()} “${lesson.title}” trong khóa ${course.title}.`,
    objectives: ["Nắm ý chính của bài học", "Áp dụng vào ví dụ nhỏ", "Tự kiểm tra trước khi chuyển sang bài tiếp theo"],
    sections: [
      { heading: "Nội dung trọng tâm", paragraphs: ["Bài học trình bày khái niệm qua một tình huống gần với công việc thực tế.", "Sau khi xem hoặc đọc, hãy thử diễn giải lại bằng ngôn ngữ của bạn và liên hệ với dự án đang làm."] },
      { heading: "Gợi ý thực hành", paragraphs: ["Thay đổi một đầu vào trong ví dụ, quan sát kết quả rồi ghi lại điều bạn rút ra. Đây là cách nhanh nhất để biến kiến thức thành kỹ năng."] },
    ],
  };
}

export function getLessonContent(course: Course, lesson: Lesson): LessonContent {
  return course.slug === "java-core" ? JAVA_CORE_CONTENT[lesson.title] ?? genericContent(course, lesson) : genericContent(course, lesson);
}
