"use client";

import { useCallback, useState } from "react";

type Errors<K extends string> = Record<K, string | undefined>;

/**
 * Khi nào lỗi của một ô được HIỆN — luật dùng chung cho mọi form:
 *
 * - Ô người dùng chưa đụng tới thì chưa tô đỏ: form "Tạo mới" mở ra không được đỏ rực vì
 *   các ô bắt buộc còn trống.
 * - Ô đã sửa (giá trị khác lúc mở form) thì hiện lỗi ngay khi gõ — kể cả khi sửa xong lại
 *   xoá về như cũ.
 * - Bấm Lưu (`validate()`) thì hiện lỗi của MỌI ô và đưa focus tới ô sai đầu tiên. Vì vậy
 *   nút Lưu không cần khoá theo lỗi: khoá im lặng là thứ khiến người dùng không biết sai ở
 *   đâu.
 *
 * `values` là các ô đang có trên form (có thể ít khoá hơn `errors`); giá trị so bằng `!==`
 * nên chỉ đưa vào kiểu nguyên thuỷ.
 * `reset()` chụp lại mốc "lúc mở form" ở lần render kế tiếp — gọi khi mở lại một modal
 * dùng chung state, hoặc ngay sau khi nạp dữ liệu từ API vào form.
 */
export function useFieldErrors<K extends string>(
  values: Partial<Record<K, unknown>>,
  errors: Errors<K>,
) {
  const [initial, setInitial] = useState<Partial<Record<K, unknown>> | null>(values);
  const [dirty, setDirty] = useState<ReadonlySet<K>>(() => new Set());
  const [all, setAll] = useState(false);

  // Điều chỉnh state ngay trong render (mẫu React chính thức cho state suy ra từ props):
  // chụp mốc sau `reset()` và ghi nhận ô vừa bị sửa. Ô đã bẩn thì bẩn luôn.
  if (initial === null) setInitial(values);
  const keys = Object.keys(values) as K[];
  const newlyDirty = initial ? keys.filter((k) => !dirty.has(k) && values[k] !== initial[k]) : [];
  if (newlyDirty.length > 0) setDirty(new Set([...dirty, ...newlyDirty]));

  const visible = {} as Errors<K>;
  for (const k of Object.keys(errors) as K[]) {
    visible[k] = all || dirty.has(k) || newlyDirty.includes(k) ? errors[k] : undefined;
  }
  const valid = Object.values(errors).every((error) => error === undefined);
  // Ổn định qua các lần render để gọi được trong effect sau khi nạp dữ liệu.
  const reset = useCallback(() => {
    setInitial(null);
    setDirty(new Set());
    setAll(false);
  }, []);

  return {
    /** Lỗi để HIỆN — truyền cho `Field error`. */
    errors: visible,
    /** Mọi ô hợp lệ (kể cả ô chưa hiện lỗi). */
    valid,
    /** Gọi đầu hàm Lưu: hiện mọi lỗi, focus ô sai đầu tiên, trả `false` nếu còn lỗi. */
    validate(): boolean {
      setAll(true);
      if (!valid && typeof window !== "undefined") {
        // Nút vừa bấm đang giữ focus: đi ngược lên tới tổ tiên GẦN NHẤT có ô sai, để một
        // trang có hai form (phương thức nhận tiền + yêu cầu rút) không nhảy sang form kia.
        const origin = document.activeElement;
        window.requestAnimationFrame(() => {
          const selector = '[aria-invalid="true"]';
          let scope: Element | null = origin;
          while (scope && !scope.querySelector(selector)) scope = scope.parentElement;
          (scope ?? document).querySelector<HTMLElement>(selector)?.focus();
        });
      }
      return valid;
    },
    /** Chụp lại mốc "lúc mở form" — gọi sau khi nạp dữ liệu hoặc khi mở lại modal. */
    reset,
  };
}
