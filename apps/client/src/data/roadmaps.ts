import type { Chapter, Course, Lesson, LessonType, LearningRoadmap } from "@/types/roadmap";
import type { CurrentLevel } from "@/types/learning-preference";

let idSeq = 0;
function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

function lesson(title: string, type: LessonType, minutes: number, opts: Partial<Lesson> = {}): Lesson {
  return {
    id: nextId("lesson"),
    title,
    type,
    durationMinutes: minutes,
    isPreview: false,
    isLocked: false,
    isCompleted: false,
    ...opts,
  };
}

function chapter(title: string, description: string, lessons: Lesson[]): Omit<Chapter, "order"> {
  return { id: nextId("chapter"), title, description, lessons };
}

function withOrder(chapters: Omit<Chapter, "order">[]): Chapter[] {
  return chapters.map((c, i) => ({ ...c, order: i + 1 }));
}

interface CourseInput {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  level: CurrentLevel;
  durationHours: number;
  technologies: string[];
  prerequisites?: string[];
  outcomes?: string[];
  chapters?: Omit<Chapter, "order">[];
  totalChapters?: number;
  totalLessons?: number;
  status?: Course["status"];
  progressPercent?: number;
  instructor?: string;
  rating?: number;
  ratingCount?: number;
  studentCount?: number;
}

function course(input: CourseInput): Course {
  const chapters = input.chapters ? withOrder(input.chapters) : [];
  return {
    id: nextId("course"),
    slug: input.slug,
    title: input.title,
    description: input.description,
    thumbnail: input.thumbnail,
    level: input.level,
    durationHours: input.durationHours,
    technologies: input.technologies,
    prerequisites: input.prerequisites ?? [],
    outcomes: input.outcomes ?? [],
    chapters,
    totalChapters: input.totalChapters ?? chapters.length,
    totalLessons: input.totalLessons ?? chapters.reduce((t, c) => t + c.lessons.length, 0),
    status: input.status ?? "not-started",
    progressPercent: input.progressPercent ?? 0,
    instructor: input.instructor,
    rating: input.rating,
    ratingCount: input.ratingCount,
    studentCount: input.studentCount,
  };
}

/** Shallow course: summary only, curriculum not authored yet — renders an
 * "đang biên soạn" state on the roadmap detail page. */
function shallowCourse(
  slug: string,
  title: string,
  description: string,
  thumbnail: string,
  level: CurrentLevel,
  durationHours: number,
  technologies: string[],
  totalChapters: number,
  totalLessons: number,
) {
  return course({ slug, title, description, thumbnail, level, durationHours, technologies, totalChapters, totalLessons });
}

// ---------------------------------------------------------------------------
// Nhập môn Lập trình — fully-authored curriculum for "Lập trình C cơ bản"
// ---------------------------------------------------------------------------

const laptrinhCCoBan = course({
  slug: "lap-trinh-c-co-ban",
  title: "Lập trình C cơ bản",
  description: "Biến, cấu trúc điều kiện và vòng lặp qua các bài luyện tập thực hành bằng C.",
  thumbnail: "{ }",
  level: "none",
  durationHours: 24,
  technologies: ["C"],
  prerequisites: ["Không yêu cầu kiến thức nền — bắt đầu từ con số 0"],
  outcomes: [
    "Khai báo biến và các kiểu dữ liệu cơ bản",
    "Cấu trúc điều kiện if/else, switch",
    "Vòng lặp for/while và vòng lặp lồng nhau",
    "Viết và tổ chức chương trình bằng hàm",
  ],
  status: "in-progress",
  progressPercent: 64,
  chapters: [
    chapter("Biến và Kiểu dữ liệu", "Khai báo, gán giá trị và các kiểu dữ liệu cơ bản trong C", [
      lesson("Khai báo và gán giá trị biến", "video", 12, { isCompleted: true, isPreview: true }),
      lesson("Các kiểu dữ liệu cơ bản và ép kiểu", "article", 10, { isCompleted: true }),
      lesson("Bài tập: Tính chu vi & diện tích hình chữ nhật", "exercise", 15, { isCompleted: true }),
    ]),
    chapter("Cấu trúc điều kiện", "Rẽ nhánh chương trình với if/else và switch", [
      lesson("Câu lệnh if / else", "video", 14, { isCompleted: true }),
      lesson("Toán tử so sánh và logic", "article", 8, { isCompleted: true }),
      lesson("Bài tập: Giải phương trình bậc hai", "exercise", 20, { isCompleted: true }),
      lesson("Bài tập: Xếp loại học lực theo điểm", "exercise", 15 ),
    ]),
    chapter("Vòng lặp", "Lặp lại thao tác với for, while và vòng lặp lồng nhau", [
      lesson("Vòng lặp for", "video", 12),
      lesson("Vòng lặp lồng nhau", "exercise", 18),
      lesson("Quiz: Vòng lặp cơ bản", "quiz", 10),
    ]),
    chapter("Hàm và Mảng một chiều", "Tổ chức chương trình bằng hàm và thao tác trên mảng", [
      lesson("Định nghĩa và gọi hàm", "video", 14, { isLocked: true }),
      lesson("Khai báo và duyệt mảng", "article", 10, { isLocked: true }),
      lesson("Dự án nhỏ: Quản lý điểm sinh viên", "project", 40, { isLocked: true }),
    ]),
  ],
});

const tuDuyLapTrinh = course({
  slug: "tu-duy-lap-trinh-co-ban",
  title: "Tư duy lập trình cơ bản",
  description: "Làm quen với thuật toán, lưu đồ và cách phân rã bài toán trước khi viết code.",
  thumbnail: "Δ",
  level: "none",
  durationHours: 8,
  technologies: [],
  outcomes: ["Đọc hiểu và vẽ lưu đồ thuật toán", "Phân rã bài toán thành các bước nhỏ"],
  status: "completed",
  progressPercent: 100,
  chapters: [
    chapter("Thuật toán là gì", "Khái niệm thuật toán và các bước giải quyết vấn đề", [
      lesson("Giới thiệu tư duy thuật toán", "video", 10, { isCompleted: true, isPreview: true }),
      lesson("Quiz: Nhận diện bài toán", "quiz", 8, { isCompleted: true }),
    ]),
    chapter("Lưu đồ và giả mã", "Biểu diễn thuật toán bằng lưu đồ và pseudocode", [
      lesson("Vẽ lưu đồ cơ bản", "article", 12, { isCompleted: true }),
      lesson("Bài tập: Viết giả mã cho 3 bài toán quen thuộc", "exercise", 20, { isCompleted: true }),
    ]),
  ],
});

const cauTrucDuLieuCoBan = course({
  slug: "cau-truc-du-lieu-co-ban",
  title: "Cấu trúc dữ liệu cơ bản",
  description: "Mảng, danh sách liên kết, ngăn xếp và hàng đợi qua các bài luyện tập có hướng dẫn.",
  thumbnail: "[ ]",
  level: "basic",
  durationHours: 20,
  technologies: ["C"],
  prerequisites: ["Đã hoàn thành Lập trình C cơ bản"],
  outcomes: ["Cài đặt danh sách liên kết đơn", "Sử dụng ngăn xếp và hàng đợi trong bài toán thực tế"],
  chapters: [
    chapter("Mảng nâng cao", "Mảng hai chiều và các thao tác thường gặp", [
      lesson("Mảng hai chiều", "video", 14),
      lesson("Bài tập: Ma trận chuyển vị", "exercise", 20),
    ]),
    chapter("Danh sách liên kết", "Cài đặt danh sách liên kết đơn và các thao tác cơ bản", [
      lesson("Con trỏ và cấp phát động", "video", 16),
      lesson("Cài đặt danh sách liên kết đơn", "exercise", 30),
    ]),
  ],
});

// ---------------------------------------------------------------------------
// Frontend Developer — fully-authored curriculum for HTML/CSS/JS cơ bản
// ---------------------------------------------------------------------------

const htmlCoBan = course({
  slug: "html-co-ban",
  title: "HTML cơ bản",
  description: "Cấu trúc trang web, thẻ ngữ nghĩa và biểu mẫu HTML.",
  thumbnail: "</>",
  level: "none",
  durationHours: 10,
  technologies: ["HTML"],
  outcomes: ["Xây dựng cấu trúc trang bằng thẻ ngữ nghĩa", "Tạo biểu mẫu nhập liệu hợp lệ"],
  status: "completed",
  progressPercent: 100,
  instructor: "Nguyễn Minh Anh · Frontend Mentor tại CodeMentor",
  rating: 4.7,
  ratingCount: 1240,
  studentCount: 15800,
  chapters: [
    chapter("Cấu trúc tài liệu HTML", "Thẻ cơ bản, ngữ nghĩa và cách trình duyệt đọc HTML", [
      lesson("Thẻ HTML cơ bản", "video", 10, { isCompleted: true, isPreview: true }),
      lesson("Thẻ ngữ nghĩa (semantic)", "article", 8, { isCompleted: true }),
    ]),
    chapter("Biểu mẫu và bảng", "Thu thập dữ liệu người dùng và trình bày bảng biểu", [
      lesson("Form và các loại input", "video", 12, { isCompleted: true }),
      lesson("Bài tập: Xây dựng form đăng ký", "exercise", 25, { isCompleted: true }),
    ]),
    chapter("Semantic HTML & Accessibility cơ bản", "Viết HTML dễ tiếp cận và thân thiện với SEO", [
      lesson("ARIA và accessibility cơ bản", "video", 14, { isPreview: true }),
      lesson("Chuẩn SEO on-page với thẻ meta", "article", 9),
      lesson("Quiz: Semantic HTML", "quiz", 8),
    ]),
  ],
});

const cssCoBan = course({
  slug: "css-co-ban",
  title: "CSS cơ bản",
  description: "Box model, layout Flexbox/Grid và các kỹ thuật định dạng giao diện cốt lõi.",
  thumbnail: "css",
  level: "none",
  durationHours: 14,
  technologies: ["CSS"],
  prerequisites: ["Đã hoàn thành HTML cơ bản"],
  outcomes: ["Dựng layout bằng Flexbox và Grid", "Áp dụng box model và selector chính xác"],
  status: "in-progress",
  progressPercent: 40,
  instructor: "Trần Gia Bảo · Frontend Mentor tại CodeMentor",
  rating: 4.6,
  ratingCount: 980,
  studentCount: 12300,
  chapters: [
    chapter("Box Model & Selector", "Cách CSS tính toán kích thước và chọn phần tử", [
      lesson("Box model", "video", 10, { isCompleted: true, isPreview: true }),
      lesson("Selector và độ ưu tiên (specificity)", "article", 10, { isCompleted: true }),
    ]),
    chapter("Flexbox và Grid", "Hai hệ thống layout hiện đại của CSS", [
      lesson("Flexbox cơ bản", "video", 16),
      lesson("CSS Grid cơ bản", "video", 16),
      lesson("Bài tập: Dựng layout trang landing page", "exercise", 30),
    ]),
    chapter("Responsive Design & Animation cơ bản", "Thích ứng nhiều màn hình và tạo chuyển động cơ bản", [
      lesson("Media query và mobile-first", "video", 14, { isPreview: true }),
      lesson("Transition và animation cơ bản", "video", 12),
      lesson("Bài tập: Responsive hóa trang landing page", "exercise", 25),
    ]),
  ],
});

const javascriptCoBan = course({
  slug: "javascript-co-ban",
  title: "JavaScript cơ bản",
  description: "Biến, hàm, DOM và xử lý sự kiện — nền tảng để học React sau này.",
  thumbnail: "js",
  level: "basic",
  durationHours: 22,
  technologies: ["JavaScript"],
  prerequisites: ["Đã hoàn thành HTML & CSS cơ bản"],
  outcomes: ["Thao tác DOM và xử lý sự kiện", "Làm việc với mảng, object và hàm bậc cao"],
  instructor: "Lê Thị Hồng Nhung · Frontend Mentor tại CodeMentor",
  rating: 4.8,
  ratingCount: 2100,
  studentCount: 21400,
  chapters: [
    chapter("Cú pháp cơ bản", "Biến, kiểu dữ liệu và toán tử trong JavaScript", [
      lesson("Biến, kiểu dữ liệu, toán tử", "video", 14, { isPreview: true }),
      lesson("Quiz: Cú pháp cơ bản", "quiz", 8),
    ]),
    chapter("Hàm và DOM", "Định nghĩa hàm và thao tác với cây DOM", [
      lesson("Hàm và phạm vi biến (scope)", "video", 14),
      lesson("Thao tác DOM cơ bản", "video", 16),
      lesson("Bài tập: To-do list bằng JavaScript thuần", "exercise", 35),
    ]),
    chapter("Làm việc với API & Bất đồng bộ", "Promise, async/await và gọi dữ liệu từ API thật", [
      lesson("Promise và async/await", "video", 16, { isPreview: true }),
      lesson("Gọi API bằng fetch", "article", 10),
      lesson("Bài tập: Ứng dụng thời tiết gọi API thật", "exercise", 40),
    ]),
  ],
});

// ---------------------------------------------------------------------------
// Backend Java — fully-authored curriculum for Java Core + Spring Boot REST API
// ---------------------------------------------------------------------------

const javaCore = course({
  slug: "java-core",
  title: "Java Core",
  description: "Cú pháp Java, OOP cơ bản và Collections Framework.",
  thumbnail: "Jv",
  level: "basic",
  durationHours: 26,
  technologies: ["Java"],
  outcomes: ["Nắm vững OOP trong Java", "Sử dụng thành thạo Collections Framework"],
  status: "in-progress",
  progressPercent: 30,
  chapters: [
    chapter("Cú pháp và Kiểu dữ liệu", "Biến, kiểu dữ liệu và toán tử trong Java", [
      lesson("Cú pháp Java cơ bản", "video", 14, { isCompleted: true, isPreview: true }),
      lesson("Kiểu dữ liệu nguyên thủy và tham chiếu", "article", 10, { isCompleted: true }),
    ]),
    chapter("Lập trình hướng đối tượng", "Lớp, đối tượng, kế thừa và đa hình", [
      lesson("Class và Object", "video", 16),
      lesson("Kế thừa và đa hình", "video", 18),
      lesson("Bài tập: Mô hình hóa hệ thống quản lý thư viện", "exercise", 40),
    ]),
  ],
});

const springBootRestApi = course({
  slug: "spring-boot-rest-api",
  title: "Spring Boot REST API",
  description: "Xây dựng REST API với Spring Boot, JPA và xử lý lỗi chuẩn hóa.",
  thumbnail: "Sb",
  level: "intermediate",
  durationHours: 28,
  technologies: ["Java", "Spring Boot"],
  prerequisites: ["Đã hoàn thành Java Core"],
  outcomes: ["Xây dựng REST API CRUD hoàn chỉnh", "Kết nối cơ sở dữ liệu bằng Spring Data JPA"],
  chapters: [
    chapter("Khởi tạo dự án Spring Boot", "Cấu trúc dự án và các annotation cốt lõi", [
      lesson("Spring Boot Starter và cấu trúc dự án", "video", 14, { isPreview: true }),
      lesson("Controller và Request Mapping", "video", 16),
    ]),
    chapter("Kết nối dữ liệu với JPA", "Entity, Repository và truy vấn dữ liệu", [
      lesson("Entity và Repository", "video", 18),
      lesson("Bài tập: API quản lý sản phẩm CRUD", "exercise", 45),
    ]),
  ],
});

// ---------------------------------------------------------------------------
// Roadmaps
// ---------------------------------------------------------------------------

export const learningRoadmaps: LearningRoadmap[] = [
  {
    id: nextId("roadmap"),
    slug: "nhap-mon",
    title: "Lộ trình Nhập môn Lập trình",
    thumbnail: "{ }",
    shortDescription: "Xuất phát điểm cho người chưa từng viết một dòng code nào.",
    description:
      "Lộ trình xây dựng tư duy lập trình từ số 0 — bắt đầu với thuật toán cơ bản, làm quen cú pháp qua C, sau đó mở rộng sang cấu trúc dữ liệu và Java trước khi bước vào các lộ trình chuyên sâu.",
    field: "foundation",
    level: "none",
    technologies: ["C", "C++", "Java", "Git"],
    estimatedHours: 96,
    prerequisites: ["Không yêu cầu kiến thức nền — bắt đầu từ con số 0"],
    learningOutcomes: [
      "Xây dựng tư duy giải quyết vấn đề bằng thuật toán",
      "Thành thạo cú pháp và các cấu trúc điều khiển cơ bản",
      "Làm quen OOP cơ bản và quy trình làm việc với Git",
    ],
    targetAudience: ["Người chưa biết lập trình", "Sinh viên năm nhất ngành CNTT"],
    courses: [
      tuDuyLapTrinh,
      laptrinhCCoBan,
      cauTrucDuLieuCoBan,
      shallowCourse("java-core-nhap-mon", "Java Core", "Làm quen cú pháp Java và OOP cơ bản.", "Jv", "basic", 20, ["Java"], 3, 9),
      shallowCourse("java-oop-co-ban", "Java OOP cơ bản", "Lớp, đối tượng, kế thừa và đa hình qua ví dụ thực tế.", "OOP", "basic", 18, ["Java"], 3, 8),
      shallowCourse("git-github-co-ban", "Git và GitHub cơ bản", "Quy trình làm việc với version control trong dự án thực tế.", "git", "none", 8, ["Git"], 2, 5),
      shallowCourse("du-an-tong-hop-nhap-mon", "Bài tập & dự án tổng hợp", "Vận dụng toàn bộ kiến thức nhập môn vào một dự án nhỏ hoàn chỉnh.", "★", "basic", 12, ["C", "Java"], 1, 4),
    ],
    popularity: 92,
    updatedAt: "2026-07-30",
    userProgress: { completedCourses: 2, totalCourses: 7, percent: 34 },
  },
  {
    id: nextId("roadmap"),
    slug: "frontend-developer",
    title: "Lộ trình Frontend Developer",
    thumbnail: "</>",
    shortDescription: "Từ HTML/CSS đến React — đủ hành trang để làm Frontend Developer.",
    description:
      "Lộ trình toàn diện cho hướng Frontend: xây nền tảng HTML/CSS/JavaScript vững chắc, làm quen TypeScript, sau đó tiến vào React/Next.js, làm việc với REST API và hoàn thiện bằng một dự án frontend thực chiến.",
    field: "frontend",
    level: "basic",
    technologies: ["HTML", "CSS", "JavaScript", "TypeScript", "React"],
    estimatedHours: 140,
    prerequisites: ["Biết sử dụng máy tính cơ bản, chưa cần biết lập trình trước"],
    learningOutcomes: [
      "Xây dựng giao diện web responsive từ đầu",
      "Thành thạo JavaScript hiện đại và TypeScript",
      "Xây dựng ứng dụng React/Next.js kết nối REST API",
    ],
    targetAudience: ["Người muốn trở thành Web Developer", "Người đang học Frontend tự học"],
    courses: [
      htmlCoBan,
      cssCoBan,
      shallowCourse("responsive-web-design", "Responsive Web Design", "Thiết kế giao diện thích ứng nhiều kích thước màn hình.", "rwd", "basic", 10, ["CSS"], 2, 6),
      javascriptCoBan,
      shallowCourse("javascript-nang-cao", "JavaScript nâng cao", "Closures, async/await, module và các pattern JS hiện đại.", "js+", "intermediate", 18, ["JavaScript"], 3, 10),
      shallowCourse("typescript", "TypeScript", "Kiểu dữ liệu tĩnh cho JavaScript — interface, generic và type-safety.", "ts", "intermediate", 14, ["TypeScript"], 3, 8),
      shallowCourse("react-nextjs", "React hoặc Next.js", "Component, hooks, quản lý state và routing trong ứng dụng React/Next.js.", "⚛", "intermediate", 30, ["React", "Next.js"], 4, 14),
      shallowCourse("rest-api-frontend", "Làm việc với REST API", "Gọi API, xử lý bất đồng bộ và quản lý trạng thái dữ liệu.", "API", "intermediate", 12, ["REST"], 2, 6),
      shallowCourse("testing-frontend", "Testing Frontend", "Unit test và integration test cho ứng dụng frontend.", "test", "experienced", 10, ["Jest"], 2, 6),
      shallowCourse("du-an-frontend-hoan-chinh", "Dự án Frontend hoàn chỉnh", "Xây dựng và triển khai một ứng dụng frontend hoàn chỉnh từ đầu đến cuối.", "★", "intermediate", 24, ["React", "TypeScript"], 1, 5),
    ],
    popularity: 88,
    updatedAt: "2026-07-28",
    userProgress: { completedCourses: 1, totalCourses: 10, percent: 14 },
  },
  {
    id: nextId("roadmap"),
    slug: "backend-java",
    title: "Lộ trình Backend Java",
    thumbnail: "Jv",
    shortDescription: "Xây dựng API và hệ thống backend vững chắc với Java & Spring Boot.",
    description:
      "Lộ trình đi từ Java Core đến xây dựng REST API hoàn chỉnh với Spring Boot, kết nối cơ sở dữ liệu qua JPA và bảo mật hệ thống bằng Spring Security.",
    field: "backend",
    level: "intermediate",
    technologies: ["Java", "Spring Boot", "SQL"],
    estimatedHours: 120,
    prerequisites: ["Đã nắm cú pháp Java cơ bản hoặc hoàn thành lộ trình Nhập môn Lập trình"],
    learningOutcomes: [
      "Xây dựng REST API CRUD hoàn chỉnh với Spring Boot",
      "Thiết kế cơ sở dữ liệu quan hệ và dùng JPA hiệu quả",
      "Bảo mật API bằng Spring Security",
    ],
    targetAudience: ["Người muốn trở thành Backend Developer", "Sinh viên đã học Java Core"],
    courses: [
      javaCore,
      springBootRestApi,
      shallowCourse("spring-boot-nang-cao", "Spring Boot nâng cao", "Validation, exception handling và cấu trúc dự án chuẩn production.", "Sb+", "intermediate", 16, ["Spring Boot"], 3, 9),
      shallowCourse("jpa-database", "JPA & Database", "Thiết kế schema, quan hệ bảng và tối ưu truy vấn.", "db", "intermediate", 16, ["SQL", "JPA"], 3, 8),
      shallowCourse("spring-security", "Spring Security", "Xác thực, phân quyền và JWT trong ứng dụng Spring.", "sec", "experienced", 14, ["Spring Security"], 2, 6),
      shallowCourse("du-an-backend-java", "Dự án Backend Java tổng hợp", "Xây dựng một hệ thống backend hoàn chỉnh có xác thực và cơ sở dữ liệu.", "★", "intermediate", 20, ["Java", "Spring Boot"], 1, 5),
    ],
    popularity: 74,
    updatedAt: "2026-07-20",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "fullstack-web",
    title: "Lộ trình Fullstack Web",
    thumbnail: "FS",
    shortDescription: "Làm chủ cả frontend lẫn backend để tự xây dựng một sản phẩm hoàn chỉnh.",
    description:
      "Kết hợp React ở frontend với Node.js/Express ở backend, thiết kế API và cơ sở dữ liệu, rồi triển khai một ứng dụng web hoàn chỉnh từ đầu đến cuối.",
    field: "fullstack",
    level: "intermediate",
    technologies: ["React", "Node.js", "SQL"],
    estimatedHours: 150,
    prerequisites: ["Biết HTML/CSS/JavaScript cơ bản"],
    learningOutcomes: [
      "Xây dựng frontend bằng React và backend bằng Node.js/Express",
      "Thiết kế API và cơ sở dữ liệu cho một sản phẩm thực tế",
      "Triển khai ứng dụng fullstack lên môi trường production cơ bản",
    ],
    targetAudience: ["Người muốn tự xây sản phẩm hoàn chỉnh", "Người đã biết frontend hoặc backend, muốn học phần còn lại"],
    courses: [
      shallowCourse("html-css-js-nen-tang", "HTML/CSS/JS Nền tảng", "Ôn lại nền tảng web trước khi vào React.", "</>", "basic", 20, ["HTML", "CSS", "JavaScript"], 3, 10),
      shallowCourse("react-frontend-fullstack", "React Frontend", "Xây dựng giao diện người dùng bằng React.", "⚛", "intermediate", 26, ["React"], 4, 12),
      shallowCourse("nodejs-express-backend", "Node.js & Express Backend", "Xây dựng server và API bằng Node.js/Express.", "Nd", "intermediate", 24, ["Node.js"], 3, 10),
      shallowCourse("database-api-design", "Database & API Design", "Thiết kế schema và chuẩn REST API nhất quán.", "db", "intermediate", 16, ["SQL"], 2, 6),
      shallowCourse("devops-co-ban", "Triển khai & DevOps cơ bản", "Đóng gói và triển khai ứng dụng lên server.", "ops", "experienced", 12, ["Docker"], 2, 5),
      shallowCourse("du-an-fullstack", "Dự án Fullstack", "Xây dựng một ứng dụng fullstack hoàn chỉnh có xác thực người dùng.", "★", "intermediate", 30, ["React", "Node.js"], 1, 6),
    ],
    popularity: 80,
    updatedAt: "2026-07-25",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "mobile-flutter",
    title: "Lộ trình Mobile Flutter",
    thumbnail: "Fl",
    shortDescription: "Xây dựng ứng dụng di động đa nền tảng với Flutter & Dart.",
    description:
      "Lộ trình đi từ ngôn ngữ Dart đến xây dựng giao diện, quản lý state và kết nối API trong một ứng dụng Flutter hoàn chỉnh chạy được trên cả Android và iOS.",
    field: "mobile",
    level: "basic",
    technologies: ["Dart", "Flutter"],
    estimatedHours: 90,
    prerequisites: ["Biết lập trình hướng đối tượng cơ bản"],
    learningOutcomes: [
      "Thành thạo cú pháp Dart và widget cơ bản của Flutter",
      "Quản lý state trong ứng dụng Flutter",
      "Kết nối ứng dụng di động với REST API",
    ],
    targetAudience: ["Người muốn trở thành Mobile Developer", "Người đã biết lập trình hướng đối tượng"],
    courses: [
      shallowCourse("dart-co-ban", "Dart cơ bản", "Cú pháp Dart và lập trình hướng đối tượng trong Dart.", "Dt", "basic", 14, ["Dart"], 2, 6),
      shallowCourse("flutter-ui-co-ban", "Flutter UI cơ bản", "Widget, layout và điều hướng trong Flutter.", "Fl", "basic", 20, ["Flutter"], 3, 9),
      shallowCourse("state-management-flutter", "State Management", "Quản lý trạng thái ứng dụng với Provider/Riverpod.", "st", "intermediate", 16, ["Flutter"], 2, 7),
      shallowCourse("api-flutter", "Kết nối API trong Flutter", "Gọi REST API và xử lý dữ liệu bất đồng bộ.", "API", "intermediate", 14, ["Flutter"], 2, 6),
      shallowCourse("du-an-mobile", "Dự án ứng dụng di động", "Xây dựng một ứng dụng di động hoàn chỉnh từ đầu đến cuối.", "★", "intermediate", 24, ["Flutter"], 1, 5),
    ],
    popularity: 58,
    updatedAt: "2026-07-15",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "data-ai-python",
    title: "Lộ trình Data & AI với Python",
    thumbnail: "DS",
    shortDescription: "Nền tảng xử lý dữ liệu và nhập môn Machine Learning bằng Python.",
    description:
      "Lộ trình cho hướng Data/AI: dùng Python xử lý dữ liệu, làm quen Pandas/NumPy, trực quan hóa dữ liệu và bước đầu tìm hiểu Machine Learning qua các dự án phân tích thực tế.",
    field: "data-ai",
    level: "intermediate",
    technologies: ["Python", "SQL"],
    estimatedHours: 110,
    prerequisites: ["Biết cú pháp Python cơ bản"],
    learningOutcomes: [
      "Xử lý và làm sạch dữ liệu với Pandas/NumPy",
      "Trực quan hóa dữ liệu để rút ra insight",
      "Xây dựng mô hình Machine Learning cơ bản",
    ],
    targetAudience: ["Người muốn trở thành Data/AI Engineer", "Người đã biết Python cơ bản"],
    courses: [
      shallowCourse("python-xu-ly-du-lieu", "Python cho xử lý dữ liệu", "Cấu trúc dữ liệu Python và làm việc với file dữ liệu.", "py", "basic", 16, ["Python"], 2, 7),
      shallowCourse("pandas-numpy", "Thư viện Pandas & NumPy", "Xử lý dữ liệu dạng bảng và tính toán số học hiệu quả.", "pd", "intermediate", 20, ["Python"], 3, 9),
      shallowCourse("truc-quan-hoa-du-lieu", "Trực quan hóa dữ liệu", "Biểu đồ và dashboard bằng Matplotlib/Seaborn.", "viz", "intermediate", 14, ["Python"], 2, 6),
      shallowCourse("nhap-mon-machine-learning", "Nhập môn Machine Learning", "Các thuật toán học máy cơ bản và quy trình huấn luyện mô hình.", "ml", "experienced", 26, ["Python"], 3, 10),
      shallowCourse("du-an-phan-tich-du-lieu", "Dự án phân tích dữ liệu", "Thực hiện một dự án phân tích dữ liệu hoàn chỉnh.", "★", "intermediate", 20, ["Python"], 1, 5),
    ],
    popularity: 66,
    updatedAt: "2026-07-27",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "backend-nodejs",
    title: "Lộ trình Backend Node.js",
    thumbnail: "Nd",
    shortDescription: "Xây dựng API bằng JavaScript ở cả frontend lẫn backend.",
    description:
      "Lộ trình backend dùng chung ngôn ngữ JavaScript: xây dựng API với Node.js/Express, làm việc với MongoDB, và triển khai xác thực người dùng an toàn.",
    field: "backend",
    level: "basic",
    technologies: ["JavaScript", "Node.js"],
    estimatedHours: 95,
    prerequisites: ["Biết JavaScript cơ bản"],
    learningOutcomes: [
      "Xây dựng REST API bằng Node.js/Express",
      "Thiết kế dữ liệu với MongoDB",
      "Triển khai xác thực và phân quyền người dùng",
    ],
    targetAudience: ["Người đã biết JavaScript, muốn học backend", "Người muốn dùng một ngôn ngữ cho cả frontend & backend"],
    courses: [
      shallowCourse("javascript-cho-backend", "JavaScript cho Backend", "Async/await, module và môi trường chạy Node.js.", "js", "basic", 12, ["JavaScript"], 2, 6),
      shallowCourse("nodejs-express-co-ban", "Node.js & Express cơ bản", "Xây dựng server và routing với Express.", "Nd", "basic", 18, ["Node.js"], 3, 8),
      shallowCourse("mongodb", "Làm việc với MongoDB", "Thiết kế schema và truy vấn dữ liệu NoSQL.", "db", "intermediate", 16, ["MongoDB"], 2, 6),
      shallowCourse("xac-thuc-phan-quyen", "Xác thực & phân quyền", "JWT, session và bảo mật API cơ bản.", "sec", "intermediate", 14, ["Node.js"], 2, 5),
      shallowCourse("du-an-backend-nodejs", "Dự án Backend Node.js", "Xây dựng một API backend hoàn chỉnh có xác thực.", "★", "intermediate", 18, ["Node.js"], 1, 5),
    ],
    popularity: 62,
    updatedAt: "2026-07-10",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "react-nang-cao",
    title: "Lộ trình React Nâng cao",
    thumbnail: "⚛",
    shortDescription: "Đào sâu React cho người đã có nền tảng frontend cơ bản.",
    description:
      "Dành cho người đã biết React cơ bản, tập trung vào patterns nâng cao, quản lý state phức tạp, tối ưu hiệu năng và kiểm thử cho ứng dụng React quy mô lớn.",
    field: "frontend",
    level: "experienced",
    technologies: ["React", "TypeScript"],
    estimatedHours: 80,
    prerequisites: ["Đã hoàn thành lộ trình Frontend Developer hoặc tương đương"],
    learningOutcomes: [
      "Sử dụng thành thạo custom hooks và React patterns nâng cao",
      "Quản lý state phức tạp với Redux/Zustand",
      "Tối ưu hiệu năng và viết test cho ứng dụng React lớn",
    ],
    targetAudience: ["Frontend Developer muốn nâng cao kỹ năng React", "Người chuẩn bị phỏng vấn vị trí Senior Frontend"],
    courses: [
      shallowCourse("react-hooks-nang-cao", "React Hooks nâng cao", "Custom hooks và các pattern quản lý logic tái sử dụng.", "⚛", "experienced", 16, ["React"], 2, 7),
      shallowCourse("state-management-react", "Quản lý State (Redux/Zustand)", "So sánh và áp dụng các thư viện quản lý state phổ biến.", "st", "experienced", 18, ["Redux", "Zustand"], 3, 8),
      shallowCourse("toi-uu-hieu-nang-react", "Tối ưu hiệu năng React", "Memoization, code-splitting và profiling ứng dụng React.", "perf", "experienced", 14, ["React"], 2, 6),
      shallowCourse("testing-ci-frontend", "Testing & CI cho Frontend", "Viết test tự động và tích hợp CI cho frontend.", "test", "experienced", 12, ["Jest"], 2, 5),
      shallowCourse("du-an-react-lon", "Dự án React quy mô lớn", "Refactor và mở rộng một ứng dụng React quy mô lớn.", "★", "experienced", 20, ["React", "TypeScript"], 1, 5),
    ],
    popularity: 54,
    updatedAt: "2026-07-05",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "csharp-dotnet",
    title: "Lộ trình Backend C# / .NET",
    thumbnail: "C#",
    shortDescription: "Xây dựng API doanh nghiệp với C# và ASP.NET Core.",
    description:
      "Lộ trình backend theo hướng .NET: cú pháp C#, OOP, xây dựng Web API bằng ASP.NET Core và làm việc với cơ sở dữ liệu qua Entity Framework Core.",
    field: "backend",
    level: "intermediate",
    technologies: ["C#", ".NET"],
    estimatedHours: 105,
    prerequisites: ["Biết lập trình hướng đối tượng cơ bản"],
    learningOutcomes: [
      "Thành thạo cú pháp C# và OOP nâng cao",
      "Xây dựng Web API với ASP.NET Core",
      "Làm việc với cơ sở dữ liệu qua Entity Framework Core",
    ],
    targetAudience: ["Người muốn làm backend trong môi trường doanh nghiệp .NET"],
    courses: [
      shallowCourse("csharp-co-ban", "C# cơ bản", "Cú pháp, kiểu dữ liệu và cấu trúc điều khiển trong C#.", "C#", "basic", 16, ["C#"], 2, 7),
      shallowCourse("oop-csharp", "Lập trình hướng đối tượng C#", "Lớp, kế thừa, interface và generic trong C#.", "OOP", "intermediate", 18, ["C#"], 3, 8),
      shallowCourse("aspnet-core-api", "ASP.NET Core Web API", "Xây dựng REST API với ASP.NET Core.", "api", "intermediate", 22, [".NET"], 3, 9),
      shallowCourse("entity-framework-core", "Entity Framework Core", "ORM và truy vấn dữ liệu với Entity Framework Core.", "ef", "intermediate", 16, [".NET"], 2, 6),
      shallowCourse("du-an-backend-dotnet", "Dự án Backend .NET", "Xây dựng một hệ thống backend hoàn chỉnh bằng .NET.", "★", "intermediate", 18, ["C#", ".NET"], 1, 5),
    ],
    popularity: 48,
    updatedAt: "2026-06-28",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "thi-dau-thuat-toan",
    title: "Lộ trình Luyện thi đấu Thuật toán",
    thumbnail: "Δ",
    shortDescription: "Nâng cao tư duy thuật toán cho các kỳ thi lập trình và phỏng vấn.",
    description:
      "Lộ trình chuyên sâu về cấu trúc dữ liệu và thuật toán nâng cao — quy hoạch động, đồ thị và kỹ thuật tối ưu — dành cho người chuẩn bị thi đấu lập trình hoặc phỏng vấn kỹ thuật.",
    field: "foundation",
    level: "experienced",
    technologies: ["C++"],
    estimatedHours: 100,
    prerequisites: ["Đã vững cấu trúc dữ liệu và giải thuật cơ bản"],
    learningOutcomes: [
      "Phân tích độ phức tạp thuật toán chính xác",
      "Giải quyết bài toán bằng quy hoạch động và đồ thị",
      "Luyện phản xạ giải đề trong thời gian giới hạn",
    ],
    targetAudience: ["Người chuẩn bị thi đấu lập trình", "Người ôn luyện phỏng vấn thuật toán"],
    courses: [
      shallowCourse("do-phuc-tap-thuat-toan", "Độ phức tạp thuật toán", "Phân tích Big-O và đánh giá hiệu năng thuật toán.", "O(n)", "intermediate", 10, ["C++"], 2, 6),
      shallowCourse("cau-truc-du-lieu-nang-cao", "Cấu trúc dữ liệu nâng cao", "Cây, heap, DSU và các cấu trúc dữ liệu nâng cao.", "[ ]", "experienced", 22, ["C++"], 3, 9),
      shallowCourse("quy-hoach-dong", "Quy hoạch động", "Kỹ thuật quy hoạch động qua các dạng bài kinh điển.", "dp", "experienced", 24, ["C++"], 3, 10),
      shallowCourse("do-thi-thuat-toan-duyet", "Đồ thị & thuật toán duyệt", "BFS, DFS, Dijkstra và các bài toán trên đồ thị.", "graph", "experienced", 24, ["C++"], 3, 9),
      shallowCourse("luyen-de-thi-dau-tong-hop", "Luyện đề thi đấu tổng hợp", "Giải đề tổng hợp theo thời gian thi thực tế.", "★", "experienced", 20, ["C++"], 1, 6),
    ],
    popularity: 40,
    updatedAt: "2026-06-15",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "devops-cloud",
    title: "Lộ trình DevOps & Cloud cơ bản",
    thumbnail: "Ops",
    shortDescription: "Đưa ứng dụng từ máy cá nhân lên môi trường triển khai có thể lặp lại và quan sát được.",
    description: "Lộ trình thực hành cho lập trình viên muốn hiểu phần vận hành sản phẩm: Linux, Docker, CI/CD, cấu hình môi trường và các nguyên tắc triển khai an toàn trên cloud.",
    field: "backend",
    level: "intermediate",
    technologies: ["Git", "Docker", "Node.js"],
    estimatedHours: 72,
    prerequisites: ["Đã từng hoàn thành một ứng dụng web hoặc API nhỏ", "Biết thao tác Git cơ bản"],
    learningOutcomes: ["Đóng gói ứng dụng bằng Docker", "Thiết lập pipeline kiểm tra và triển khai tự động", "Đọc log và xử lý sự cố triển khai cơ bản"],
    targetAudience: ["Backend hoặc Fullstack Developer muốn tự triển khai sản phẩm", "Người chuẩn bị làm việc trong nhóm có CI/CD"],
    courses: [
      shallowCourse("linux-cho-lap-trinh-vien", "Linux cho lập trình viên", "Thao tác file, tiến trình, biến môi trường và quyền truy cập trên Linux.", "Linux", "basic", 12, ["Linux"], 2, 8),
      shallowCourse("docker-co-ban", "Docker & Container", "Đóng gói ứng dụng, dùng volume và network cho môi trường phát triển.", "Docker", "intermediate", 16, ["Docker"], 3, 10),
      shallowCourse("cicd-github-actions", "CI/CD với GitHub Actions", "Tự động lint, test và build mỗi khi thay đổi mã nguồn.", "CI", "intermediate", 14, ["Git"], 2, 8),
      shallowCourse("cloud-deployment", "Triển khai lên Cloud", "Cấu hình môi trường, secrets và release cho một ứng dụng web.", "Cloud", "intermediate", 16, ["Docker"], 3, 9),
      shallowCourse("devops-capstone", "Dự án: Pipeline phát hành", "Thiết lập pipeline hoàn chỉnh cho một ứng dụng Node.js có API và frontend.", "★", "experienced", 14, ["Node.js", "Docker"], 1, 5),
    ],
    popularity: 76,
    updatedAt: "2026-08-01",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "kiem-thu-tu-dong",
    title: "Lộ trình Kiểm thử phần mềm & QA Automation",
    thumbnail: "QA",
    shortDescription: "Biến yêu cầu sản phẩm thành kịch bản kiểm thử, báo lỗi rõ ràng và tự động hóa các luồng quan trọng.",
    description: "Học cách đọc yêu cầu nghiệp vụ, thiết kế test case, kiểm thử API và tự động hóa hành trình người dùng để đảm bảo chất lượng trước khi phát hành.",
    field: "foundation",
    level: "basic",
    technologies: ["JavaScript", "Git", "Node.js"],
    estimatedHours: 64,
    prerequisites: ["Biết sử dụng trình duyệt và công cụ phát triển cơ bản"],
    learningOutcomes: ["Viết test case bám sát quy tắc nghiệp vụ", "Kiểm thử REST API có dữ liệu biên", "Tự động hóa luồng web quan trọng"],
    targetAudience: ["Sinh viên muốn tìm hiểu nghề QA", "Developer muốn nâng chất lượng mã và quy trình review"],
    courses: [
      shallowCourse("nen-tang-kiem-thu", "Nền tảng kiểm thử phần mềm", "Phân biệt test level, test type và vòng đời lỗi.", "Test", "basic", 10, ["Git"], 2, 7),
      shallowCourse("viet-test-case", "Viết Test Case theo nghiệp vụ", "Tạo kịch bản cho đăng ký, thanh toán và quản lý đơn hàng.", "Case", "basic", 12, ["JavaScript"], 2, 8),
      shallowCourse("api-testing", "Kiểm thử REST API", "Kiểm tra status, schema, phân quyền và các tình huống dữ liệu biên.", "API", "intermediate", 14, ["Node.js"], 2, 8),
      shallowCourse("ui-automation", "Tự động hóa UI", "Tự động hóa các luồng người dùng quan trọng trên trình duyệt.", "Auto", "intermediate", 16, ["JavaScript"], 3, 10),
      shallowCourse("qa-project", "Dự án: Quality gate", "Xây dựng checklist và bộ smoke test cho một sản phẩm đặt lịch.", "★", "intermediate", 12, ["JavaScript", "Git"], 1, 5),
    ],
    popularity: 61,
    updatedAt: "2026-07-31",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "database-engineering",
    title: "Lộ trình Database Engineering",
    thumbnail: "DB",
    shortDescription: "Thiết kế dữ liệu đáng tin cậy, truy vấn hiệu quả và hỗ trợ ứng dụng tăng trưởng bền vững.",
    description: "Từ mô hình hóa dữ liệu nghiệp vụ đến SQL nâng cao, indexing, transaction và sao lưu: lộ trình giúp bạn xây dựng nền tảng dữ liệu vững cho các ứng dụng thực tế.",
    field: "backend",
    level: "intermediate",
    technologies: ["SQL", "Python"],
    estimatedHours: 78,
    prerequisites: ["Biết lập trình cơ bản và làm quen với bảng dữ liệu"],
    learningOutcomes: ["Thiết kế schema có khóa và ràng buộc phù hợp", "Tối ưu truy vấn bằng index và kế hoạch thực thi", "Xử lý transaction, backup và dữ liệu thay đổi an toàn"],
    targetAudience: ["Backend Developer cần làm chủ SQL", "Data Analyst muốn hiểu nền tảng dữ liệu vận hành"],
    courses: [
      shallowCourse("database-modeling", "Mô hình hóa dữ liệu nghiệp vụ", "Chuyển yêu cầu bán hàng, đặt lịch thành bảng và quan hệ rõ ràng.", "ERD", "basic", 14, ["SQL"], 3, 9),
      shallowCourse("sql-truy-van-nang-cao", "SQL truy vấn nâng cao", "CTE, window function và truy vấn phân tích cho báo cáo.", "SQL", "intermediate", 18, ["SQL"], 3, 10),
      shallowCourse("index-query-performance", "Index & hiệu năng truy vấn", "Đọc execution plan và chọn index đúng cho API thường dùng.", "idx", "intermediate", 14, ["SQL"], 2, 8),
      shallowCourse("transaction-data-integrity", "Transaction & toàn vẹn dữ liệu", "Giữ dữ liệu chính xác trong các nghiệp vụ thanh toán và tồn kho.", "TX", "intermediate", 14, ["SQL"], 2, 7),
      shallowCourse("database-project", "Dự án: CSDL thương mại", "Thiết kế và đánh giá CSDL cho hệ thống bán hàng đa chi nhánh.", "★", "experienced", 18, ["SQL", "Python"], 1, 6),
    ],
    popularity: 70,
    updatedAt: "2026-07-29",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "ui-ux-cho-frontend",
    title: "Lộ trình UI/UX cho Frontend Developer",
    thumbnail: "UI",
    shortDescription: "Thiết kế giao diện dễ hiểu, có hệ thống và chuyển thành mã frontend chất lượng.",
    description: "Lộ trình kết nối tư duy trải nghiệm người dùng với công việc frontend: bố cục, màu sắc, design token, responsive và accessibility cho sản phẩm số.",
    field: "frontend",
    level: "basic",
    technologies: ["JavaScript", "React"],
    estimatedHours: 58,
    prerequisites: ["Biết HTML/CSS cơ bản hoặc đang học frontend"],
    learningOutcomes: ["Tổ chức layout và hierarchy rõ ràng", "Xây dựng component nhất quán từ design token", "Đánh giá accessibility và responsive trước khi bàn giao"],
    targetAudience: ["Frontend Developer muốn làm giao diện có chiều sâu", "Người muốn xây portfolio sản phẩm chỉn chu"],
    courses: [
      shallowCourse("ui-foundation", "Nền tảng UI", "Màu sắc, typography, spacing và nguyên tắc tạo hierarchy.", "UI", "basic", 10, ["JavaScript"], 2, 7),
      shallowCourse("responsive-layout-system", "Responsive Layout System", "Tạo grid, breakpoint và component thích ứng nhiều màn hình.", "RWD", "basic", 12, ["JavaScript"], 2, 8),
      shallowCourse("design-system-frontend", "Design System cho Frontend", "Xây token, component states và quy ước tái sử dụng.", "DS", "intermediate", 14, ["React"], 3, 9),
      shallowCourse("accessibility-frontend", "Accessibility thực chiến", "Kiểm tra bàn phím, semantic và thông báo trạng thái giao diện.", "a11y", "intermediate", 10, ["React"], 2, 6),
      shallowCourse("ui-portfolio-project", "Dự án: Dashboard quản lý", "Hoàn thiện dashboard responsive từ wireframe tới React component.", "★", "intermediate", 12, ["React"], 1, 5),
    ],
    popularity: 68,
    updatedAt: "2026-07-30",
    userProgress: null,
  },
  {
    id: nextId("roadmap"),
    slug: "data-engineering-python",
    title: "Lộ trình Data Engineering với Python",
    thumbnail: "DE",
    shortDescription: "Thu thập, làm sạch và tổ chức dòng dữ liệu để đội ngũ có thể phân tích tin cậy.",
    description: "Đi từ file dữ liệu rời rạc đến pipeline có cấu trúc: Python, SQL, kiểm tra chất lượng dữ liệu và mô hình kho dữ liệu phục vụ báo cáo vận hành.",
    field: "data-ai",
    level: "intermediate",
    technologies: ["Python", "SQL", "Git"],
    estimatedHours: 92,
    prerequisites: ["Nắm cú pháp Python và SQL cơ bản"],
    learningOutcomes: ["Xây dựng pipeline nhập và biến đổi dữ liệu", "Áp dụng kiểm tra chất lượng dữ liệu", "Thiết kế bảng dữ liệu phục vụ dashboard"],
    targetAudience: ["Người hướng tới Data Engineer", "Data Analyst muốn tự động hóa xử lý dữ liệu"],
    courses: [
      shallowCourse("python-data-pipeline", "Python cho Data Pipeline", "Đọc file, gọi API và tổ chức bước xử lý dữ liệu có thể tái chạy.", "py", "basic", 16, ["Python"], 3, 10),
      shallowCourse("sql-data-warehouse", "SQL cho Data Warehouse", "Mô hình fact/dimension và truy vấn bảng dữ liệu phân tích.", "SQL", "intermediate", 18, ["SQL"], 3, 10),
      shallowCourse("data-quality", "Data Quality & Validation", "Phát hiện dữ liệu thiếu, trùng và bất thường trước khi xuất báo cáo.", "DQ", "intermediate", 14, ["Python", "SQL"], 2, 8),
      shallowCourse("orchestration-basics", "Điều phối pipeline cơ bản", "Lên lịch, theo dõi trạng thái và xử lý lỗi của từng bước dữ liệu.", "Flow", "intermediate", 16, ["Python"], 3, 9),
      shallowCourse("data-engineering-project", "Dự án: Pipeline doanh thu", "Tạo pipeline tổng hợp dữ liệu đơn hàng cho dashboard quản trị.", "★", "experienced", 18, ["Python", "SQL"], 1, 6),
    ],
    popularity: 73,
    updatedAt: "2026-08-02",
    userProgress: null,
  },
];
