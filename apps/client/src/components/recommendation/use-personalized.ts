"use client";

import { useEffect, useState } from "react";
import type { RecommendationList } from "@/types/recommendation";

/** Một mục danh mục đầy đủ, kèm lý do nó được xếp lên vị trí này. */
export interface Ranked<T> {
  item: T;
  reason?: string;
}

export interface PersonalizedState<T> {
  items: Ranked<T>[];
  /**
   * `false` khi học viên chưa làm khảo sát hoặc đã tắt gợi ý thích ứng — danh sách khi đó
   * là bảng phổ biến chung. Nơi gọi dùng cờ này để quyết định có nói "dành cho bạn" không,
   * và trên `/explore` là để quyết định có dùng danh sách này hay giữ nội dung cũ.
   */
  personalized: boolean;
  isLoading: boolean;
  error: string | null;
}

const IDLE: PersonalizedState<never> = {
  items: [],
  personalized: false,
  isLoading: false,
  error: null,
};

/**
 * Ghép thứ hạng từ `recommendation-service` với bản ghi danh mục đầy đủ.
 *
 * Cần cả hai vì service chỉ xếp hạng: nó trả id, tiêu đề và lý do, không trả ảnh bìa, tác
 * giả, số chương hay mô tả. Muốn vẽ bằng đúng loại thẻ mà trang vẫn đang dùng thì phải hỏi
 * danh mục lấy phần còn lại.
 *
 * Ghép theo id trên CẢ danh mục thay vì lọc theo id ở server: `forbidNonWhitelisted` biến
 * một tham số truy vấn mới thành 400 trên mọi bản backend chưa kịp deploy, và các trang
 * danh mục vốn đã tải nguyên danh mục theo đúng cách này.
 *
 * Mục nào không tìm thấy trong danh mục thì bỏ — thà thiếu một thẻ còn hơn một thẻ trống
 * một nửa thông tin.
 */
export function usePersonalized<T extends { id: string }>(
  loadRecommendations: () => Promise<RecommendationList>,
  loadCatalogue: () => Promise<{ items: T[] }>,
  enabled = true,
): PersonalizedState<T> {
  const [state, setState] = useState<PersonalizedState<T>>(
    enabled ? { ...IDLE, isLoading: true } : IDLE,
  );

  useEffect(() => {
    if (!enabled) {
      setState(IDLE);
      return;
    }
    let cancelled = false;
    setState({ ...IDLE, isLoading: true });

    Promise.all([loadRecommendations(), loadCatalogue()])
      .then(([ranking, catalogue]) => {
        if (cancelled) return;
        const byId = new Map(catalogue.items.map((item) => [item.id, item]));
        setState({
          items: (ranking.items ?? []).flatMap((ranked) => {
            const item = byId.get(ranked.id);
            return item ? [{ item, reason: ranked.reasons[0] }] : [];
          }),
          personalized: ranking.personalized,
          isLoading: false,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const message =
          cause instanceof Error ? cause.message : "Không tải được đề xuất từ máy chủ.";
        setState({ items: [], personalized: false, isLoading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
    // Hai hàm nạp là closure mới mỗi lần render ở nơi gọi; phụ thuộc vào chúng là tải lại
    // vô hạn. `enabled` là thứ duy nhất thực sự đổi kết quả.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}

/**
 * Danh sách đề xuất này có đáng thay thế nội dung mặc định không.
 *
 * Hai điều kiện, và phải đủ cả hai: hồ sơ có được dùng để xếp hạng (`personalized`), và
 * còn lại thứ gì đó sau khi ghép với danh mục. Thiếu một trong hai thì "dành cho bạn" chỉ
 * là cái nhãn dán lên đúng bảng phổ biến mà người dùng vẫn thấy.
 */
export function hasPersonalizedContent<T>(state: PersonalizedState<T>): boolean {
  return state.personalized && state.items.length > 0;
}
