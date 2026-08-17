"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button, Modal } from "@codementor/ui";

/**
 * Chặn rời trang khi bản nháp chưa lưu.
 *
 * Hai đường rời trang, hai cơ chế:
 *   - Đóng tab / F5 / gõ URL khác: `beforeunload`, hộp thoại của chính trình duyệt. Không
 *     đổi được nội dung câu chữ, và đó là quy định của trình duyệt chứ không phải lựa chọn.
 *   - Bấm một liên kết trong ứng dụng: App Router không có hook chặn điều hướng, nên bắt
 *     sự kiện click ở pha capture trước khi <Link> kịp xử lý, rồi tự đẩy router đi sau khi
 *     người dùng xác nhận.
 *
 * Điều hướng do code gọi thẳng (`router.push` sau khi xoá) cố tình KHÔNG bị chặn: lúc đó
 * bản ghi vừa bị xoá, hỏi có muốn lưu nữa không là vô nghĩa.
 *
 * ponytail: nút Back/Forward của trình duyệt không bị chặn — chặn được `popstate` chỉ bằng
 * cách bơm thêm history entry, và cái giá là lịch sử duyệt bị bẩn ở mọi trang studio.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    const onClick = (event: MouseEvent) => {
      // Bấm chuột giữa, Ctrl/Cmd-click… đều mở tab mới: trang hiện tại ở nguyên đó.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]") as
        | HTMLAnchorElement
        | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      setPending(url.pathname + url.search);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const dialog = (
    <Modal
      description="Thay đổi chưa lưu sẽ mất nếu bạn rời khỏi trang này."
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => setPending(null)} type="button" variant="outline">
            Ở lại trang
          </Button>
          <Button
            onClick={() => {
              const target = pending;
              setPending(null);
              if (target) router.push(target);
            }}
            type="button"
          >
            Rời đi, không lưu
          </Button>
        </div>
      }
      onClose={() => setPending(null)}
      open={pending !== null}
      title="Bản nháp chưa được lưu"
      width="sm"
    >
      <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        Bấm “Lưu” trên thanh trên cùng của studio trước khi rời đi để giữ lại những gì bạn
        vừa sửa.
      </p>
    </Modal>
  );

  return dialog;
}
