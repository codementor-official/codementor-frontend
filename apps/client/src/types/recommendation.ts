/**
 * Một mục do `recommendation-service` xếp hạng. Cùng một hình dạng cho lộ trình, khóa học
 * và bài tập — thẻ hiển thị chỉ khác ở chỗ dẫn đi đâu.
 */
export interface RecommendedItem {
  id: string;
  slug: string;
  title: string;
  kind: "roadmap" | "course" | "exercise";
  /** Lĩnh vực (`frontend`/`backend`/…) của lộ trình và khóa học; bài tập không có. */
  field: string | null;
  /** `none`/`basic`/`intermediate`/`experienced` — lộ trình và khóa học. */
  level: string | null;
  /** `easy`/`medium`/`hard` — chỉ bài tập. */
  difficulty: string | null;
  technologies: string[];
  score: number;
  /** Lý do được đề xuất, câu đầu là câu đáng hiện lên thẻ. */
  reasons: string[];
}

export interface RecommendationList {
  /**
   * `false` khi học viên tắt gợi ý thích ứng hoặc chưa làm khảo sát — danh sách khi đó là
   * bảng phổ biến chung, không dùng gì trong hồ sơ cá nhân.
   */
  personalized: boolean;
  items: RecommendedItem[];
}
