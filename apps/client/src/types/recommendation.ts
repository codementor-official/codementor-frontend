/**
 * Một mục do `recommendation-service` xếp hạng. Cùng một hình dạng cho lộ trình, khóa học,
 * bài tập, bài viết và nhóm học tập — thẻ hiển thị chỉ khác ở chỗ dẫn đi đâu.
 */
export interface RecommendedItem {
  id: string;
  slug: string;
  title: string;
  kind: "roadmap" | "course" | "exercise" | "article" | "group";
  /** Lĩnh vực (`frontend`/`backend`/…) của lộ trình và khóa học; ba loại còn lại không có. */
  field: string | null;
  /** `none`/`basic`/`intermediate`/`experienced` — lộ trình và khóa học. */
  level: string | null;
  /** `easy`/`medium`/`hard` — chỉ bài tập. */
  difficulty: string | null;
  technologies: string[];
  /**
   * Tên chủ đề. Bài viết và nhóm không có lĩnh vực lẫn trình độ để hiện lên thẻ — đây là
   * thứ duy nhất mô tả được chúng ngoài tiêu đề.
   */
  tags: string[];
  score: number;
  /** Độ phổ biến đã chuẩn hóa 0..100 TRONG tập đề xuất này, không phải con số tuyệt đối. */
  popularity: number;
  /** Lý do được đề xuất, câu đầu là câu đáng hiện lên thẻ. */
  reasons: string[];
}

export interface RecommendationList {
  /**
   * `false` khi học viên tắt gợi ý hoặc chưa có hồ sơ/lịch sử dùng để cá nhân hóa.
   * Khi đó danh sách xếp theo mức phổ biến chung.
   */
  personalized: boolean;
  items: RecommendedItem[];
}
