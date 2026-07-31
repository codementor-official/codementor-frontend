export interface PathExercise {
  title: string;
  difficulty: "Cơ bản" | "Trung bình" | "Nâng cao";
  xp: number;
  done?: boolean;
}

export interface PathLesson {
  name: string;
  done?: boolean;
  exercises: PathExercise[];
}

export interface PathChapter {
  name: string;
  lessons: PathLesson[];
}

export interface PathDetail {
  title: string;
  desc: string;
  rating: string;
  level: string;
  duration: string;
  students: string;
  prerequisites: string[];
  technologies: string[];
  whatYouLearn: string[];
  chapters: PathChapter[];
}

export const pathDetails: Record<string, PathDetail> = {
  "nhap-mon": {
    title: "Nhập môn Lập trình",
    desc: "Biến, cấu trúc điều kiện và vòng lặp qua các bài luyện tập thực hành bằng C/C++.",
    rating: "4.8",
    level: "Cơ bản",
    duration: "2 tháng",
    students: "3.240",
    prerequisites: [
      "Không yêu cầu kiến thức nền — bắt đầu từ con số 0",
      "Máy tính có thể cài trình biên dịch C/C++ hoặc Python",
    ],
    technologies: ["C", "C++", "Python"],
    whatYouLearn: [
      "Khai báo biến và các kiểu dữ liệu cơ bản",
      "Cấu trúc điều kiện if/else, switch",
      "Vòng lặp for/while và vòng lặp lồng nhau",
      "Viết và tổ chức chương trình bằng hàm",
      "Thao tác cơ bản trên mảng một chiều",
    ],
    chapters: [
      {
        name: "Chương 1: Biến và Kiểu dữ liệu",
        lessons: [
          {
            name: "Bài 1: Khai báo và gán giá trị biến",
            done: true,
            exercises: [
              { title: "Tính chu vi & diện tích hình chữ nhật", difficulty: "Cơ bản", xp: 30, done: true },
              { title: "Hoán đổi giá trị hai biến", difficulty: "Cơ bản", xp: 30, done: true },
            ],
          },
          {
            name: "Bài 2: Các kiểu dữ liệu cơ bản và ép kiểu",
            done: true,
            exercises: [{ title: "Ép kiểu và làm tròn số thực", difficulty: "Cơ bản", xp: 30, done: true }],
          },
        ],
      },
      {
        name: "Chương 2: Cấu trúc điều kiện",
        lessons: [
          {
            name: "Bài 1: Câu lệnh if / else",
            exercises: [
              { title: "Giải Phương trình Bậc hai", difficulty: "Cơ bản", xp: 50 },
              { title: "Xếp loại học lực theo điểm", difficulty: "Cơ bản", xp: 40 },
            ],
          },
          {
            name: "Bài 2: Toán tử so sánh và logic",
            exercises: [{ title: "Kiểm tra năm nhuận", difficulty: "Cơ bản", xp: 40 }],
          },
        ],
      },
      {
        name: "Chương 3: Vòng lặp",
        lessons: [
          {
            name: "Bài 1: Vòng lặp for",
            exercises: [
              { title: "In bảng cửu chương", difficulty: "Cơ bản", xp: 40 },
              { title: "Tính tổng dãy số 1..n", difficulty: "Cơ bản", xp: 40 },
            ],
          },
          {
            name: "Bài 2: Vòng lặp lồng nhau",
            exercises: [{ title: "Vẽ tam giác sao (*)", difficulty: "Trung bình", xp: 60 }],
          },
        ],
      },
      {
        name: "Chương 4: Hàm và Mảng một chiều",
        lessons: [
          {
            name: "Bài 1: Định nghĩa và gọi hàm",
            exercises: [{ title: "Viết hàm kiểm tra số nguyên tố", difficulty: "Trung bình", xp: 60 }],
          },
          {
            name: "Bài 2: Khai báo và duyệt mảng",
            exercises: [
              { title: "Tính tổng phần tử mảng", difficulty: "Cơ bản", xp: 40 },
              { title: "Tìm phần tử lớn nhất trong mảng", difficulty: "Cơ bản", xp: 40 },
            ],
          },
        ],
      },
    ],
  },
};

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function getPathDetail(slug: string): PathDetail {
  return (
    pathDetails[slug] ?? {
      title: slugToTitle(slug),
      desc: "Lộ trình đang được biên soạn — nội dung chi tiết sẽ sớm cập nhật.",
      rating: "4.6",
      level: "Cơ bản",
      duration: "3 tháng",
      students: "1.000",
      prerequisites: ["Nên hoàn thành lộ trình Nhập môn Lập trình trước khi bắt đầu"],
      technologies: [],
      whatYouLearn: [
        "Nắm vững kiến thức cốt lõi của chủ đề",
        "Luyện tập qua các bài tập tăng dần độ khó",
        "Nhận gợi ý AI theo 3 mức khi gặp khó",
      ],
      chapters: [
        {
          name: "Chương 1: Tổng quan",
          lessons: [{ name: "Bài 1: Giới thiệu", exercises: [] }],
        },
      ],
    }
  );
}
