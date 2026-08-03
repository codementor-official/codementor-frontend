export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  code?: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  role: string;
  readMinutes: number;
  tag: string;
  publishedAt: string;
  sections: ArticleSection[];
  takeaway: string;
}

export const articles: Article[] = [
  {
    slug: "hieu-big-o-trong-10-phut",
    title: "Hiểu Big-O trong 10 phút, không cần toán cao cấp",
    excerpt: "Cách ước lượng độ phức tạp thuật toán bằng trực giác trước khi đụng tới công thức.",
    author: "Nguyễn Minh Anh",
    role: "Mentor Thuật toán",
    readMinutes: 8,
    tag: "Thuật toán",
    publishedAt: "28/07/2026",
    takeaway: "Đếm số lần công việc lặp lại khi dữ liệu tăng, thay vì cố nhớ công thức.",
    sections: [
      {
        heading: "Big-O trả lời câu hỏi nào?",
        paragraphs: [
          "Big-O không đo thời gian chạy tuyệt đối. Nó mô tả tốc độ công việc tăng lên khi dữ liệu đầu vào lớn dần.",
          "Với bài đầu tiên, hãy bỏ qua hằng số và máy tính đang dùng. Điều quan trọng là vòng lặp có phải chạy lại theo từng phần tử hay không.",
        ],
      },
      {
        heading: "Đếm vòng lặp bằng mắt",
        paragraphs: [
          "Một vòng lặp qua n phần tử là O(n). Hai vòng lặp lồng nhau, mỗi vòng chạy n lần, tạo ra n × n công việc nên là O(n²).",
          "Nếu mỗi lần lặp bạn chia đôi vùng tìm kiếm, số bước chỉ tăng rất chậm: đó là trực giác của O(log n).",
        ],
        code: "for (let i = 0; i < numbers.length; i++) {\n  total += numbers[i];\n}\n// Mỗi phần tử được xử lý một lần → O(n)",
      },
      {
        heading: "Một quy trình đủ dùng khi làm bài",
        paragraphs: [
          "Xác định thao tác tốn thời gian nhất, đếm số lần nó có thể diễn ra, rồi giữ lại thành phần tăng nhanh nhất. Sau đó kiểm tra lại các trường hợp biên như mảng rỗng hoặc dữ liệu đã sắp xếp.",
          "Thói quen này giúp bạn lựa chọn giải pháp phù hợp trước khi bắt đầu tối ưu code.",
        ],
      },
    ],
  },
  {
    slug: "7-loi-css-layout-tren-mobile",
    title: "7 lỗi CSS layout khiến giao diện vỡ trên mobile",
    excerpt: "Những bẫy phổ biến với Flexbox, Grid và overflow — kèm cách sửa từng trường hợp.",
    author: "Trần Gia Bảo",
    role: "Mentor Frontend",
    readMinutes: 11,
    tag: "Frontend",
    publishedAt: "25/07/2026",
    takeaway: "Ưu tiên layout co giãn, kiểm tra nội dung dài và thử màn hình hẹp từ đầu.",
    sections: [
      {
        heading: "Đừng khóa chiều rộng cho nội dung",
        paragraphs: [
          "Một thẻ có width cố định rất dễ tràn khi nhãn dài hoặc màn hình hẹp. Dùng max-width, minmax và khoảng đệm linh hoạt để layout có chỗ thở.",
          "Trong flex container, thêm min-w-0 cho phần nội dung văn bản để truncate và overflow hoạt động đúng.",
        ],
      },
      {
        heading: "Grid cần điểm chuyển rõ ràng",
        paragraphs: [
          "Một lưới ba cột không nên bị ép tồn tại trên điện thoại. Hãy để một cột là mặc định, sau đó mở rộng dần khi không gian đủ.",
          "Cách viết mobile-first giúp CSS dễ đọc và tránh phải ghi đè quá nhiều ở cuối file.",
        ],
        code: ".cards { display: grid; grid-template-columns: 1fr; gap: 16px; }\n@media (min-width: 768px) {\n  .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n}",
      },
      {
        heading: "Kiểm tra bằng nội dung thật",
        paragraphs: [
          "Tên người dùng dài, trạng thái nhiều chữ và bảng dữ liệu là ba tình huống thường làm lộ lỗi layout. Đừng chỉ thử bằng lorem ipsum ngắn.",
          "Trước khi bàn giao, kiểm tra tối thiểu ở 320px, 768px và desktop; đồng thời thử zoom trình duyệt để xem hierarchy có còn rõ ràng không.",
        ],
      },
    ],
  },
  {
    slug: "dat-ten-rest-api-de-bao-tri",
    title: "REST API: đặt tên endpoint sao cho người sau còn hiểu",
    excerpt: "Quy ước đặt tên, phiên bản hóa và mã lỗi nhất quán cho API thực tế.",
    author: "Lê Thị Hồng Nhung",
    role: "Mentor Backend",
    readMinutes: 9,
    tag: "Backend",
    publishedAt: "21/07/2026",
    takeaway: "Tên API nên mô tả tài nguyên và hành động nhất quán, không mô tả màn hình gọi nó.",
    sections: [
      { heading: "Bắt đầu từ tài nguyên", paragraphs: ["Ưu tiên danh từ số nhiều như /users, /assignments; dùng HTTP method để diễn đạt thao tác."] },
      { heading: "Giữ phản hồi dễ dự đoán", paragraphs: ["Một cấu trúc lỗi nhất quán giúp frontend và người dùng hiểu điều gì cần xử lý tiếp theo."] },
    ],
  },
  {
    slug: "sql-index-khi-nao-can-dung",
    title: "Khi nào nên thêm index cho truy vấn SQL?",
    excerpt: "Đọc execution plan và nhận biết các truy vấn cần tối ưu trước khi thêm index.",
    author: "Phạm Quốc Bảo",
    role: "Mentor Database",
    readMinutes: 7,
    tag: "Database",
    publishedAt: "18/07/2026",
    takeaway: "Index tốt dựa trên truy vấn thật, không phải danh sách cột nghe có vẻ quan trọng.",
    sections: [
      { heading: "Quan sát trước khi tối ưu", paragraphs: ["Dùng execution plan để biết database đang quét bảng, lọc hay sắp xếp ở đâu."] },
      { heading: "Ưu tiên truy vấn nóng", paragraphs: ["Tập trung vào các truy vấn chậm, chạy thường xuyên và tác động rõ đến trải nghiệm người dùng."] },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
