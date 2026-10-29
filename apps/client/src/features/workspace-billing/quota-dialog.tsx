"use client";

import { useCallback, useState } from "react";
import { Gauge } from "lucide-react";
import { Modal } from "@codementor/ui";
import { formatBytes } from "@codementor/utils";
import { Button } from "@/components/ui/button";
import { quotaRefusal, type QuotaRefusal } from "./api";

interface Shown {
  refusal: QuotaRefusal;
  /** Only the group owner pays; members are told about capacity, never asked to buy. */
  owner: boolean;
}

/**
 * Explains a plan-limit refusal where it happened. Returns `true` from `handle` when the error
 * was a quota refusal (and is now shown), so callers fall back to their usual error otherwise.
 */
export function useQuotaDialog() {
  const [shown, setShown] = useState<Shown | null>(null);
  const handle = useCallback((error: unknown, owner: boolean) => {
    const refusal = quotaRefusal(error);
    if (!refusal) return false;
    setShown({ refusal, owner });
    return true;
  }, []);
  /** For refusals decided in the browser before any request, e.g. a file that is too large. */
  const show = useCallback((refusal: QuotaRefusal, owner: boolean) => setShown({ refusal, owner }), []);
  const dialog = <QuotaDialog shown={shown} onClose={() => setShown(null)} />;
  return { handle, show, dialog };
}

function QuotaDialog({ shown, onClose }: { shown: Shown | null; onClose: () => void }) {
  if (!shown) return null;
  const { refusal, owner } = shown;
  const copy = describe(refusal, owner);
  return (
    <Modal
      open
      onClose={onClose}
      title={copy.title}
      width="sm"
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            {owner ? "Để sau" : "Đã hiểu"}
          </Button>
          {owner && refusal.code !== "WORKSPACE_ENTITLEMENT_UNAVAILABLE" && (
            <Button size="sm" href="/workspace/pricing">
              Xem các gói
            </Button>
          )}
        </>
      }
    >
      <div className="flex gap-3">
        <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-2 text-sm leading-relaxed text-text">
          <p>{copy.body}</p>
          {copy.figures && (
            <p className="rounded-md bg-border-soft px-3 py-2 font-medium text-navy">{copy.figures}</p>
          )}
          {copy.hint && <p className="text-text-muted">{copy.hint}</p>}
        </div>
      </div>
    </Modal>
  );
}

function describe({ code, message, details: d }: QuotaRefusal, owner: boolean) {
  const plan = d.plan ? `gói ${d.plan}` : "gói hiện tại";
  switch (code) {
    case "WORKSPACE_GROUP_LIMIT_REACHED":
      return {
        title: "Bạn đã dùng hết lượt sở hữu nhóm",
        body: `${capitalize(plan)} cho phép sở hữu tối đa ${d.limit} nhóm học tập.`,
        figures: d.used !== undefined ? `Đang sở hữu ${d.used} / ${d.limit} nhóm` : null,
        hint: "Nhóm đã lưu trữ vẫn tính vào hạn mức. Nâng cấp để tạo thêm nhóm.",
      };
    case "WORKSPACE_MEMBER_LIMIT_REACHED":
      return owner
        ? {
            title: "Nhóm đã đủ thành viên",
            body: message || `Nhóm đã đạt số thành viên tối đa của ${plan}.`,
            figures: d.used !== undefined && d.limit !== undefined ? `${d.used} / ${d.limit} thành viên` : null,
            hint: "Mời bớt thành viên không còn tham gia, hoặc nâng cấp để nhận thêm người.",
          }
        : {
            title: "Nhóm đã đủ thành viên",
            body: "Nhóm này đã đạt số thành viên tối đa nên chưa nhận thêm người.",
            figures: null,
            hint: "Bạn có thể liên hệ Chủ nhóm hoặc thử lại sau.",
          };
    case "WORKSPACE_STORAGE_LIMIT_REACHED":
      return {
        title: owner ? "Workspace đã hết dung lượng" : "Nhóm đã hết dung lượng tài liệu",
        body: owner
          ? `Tệp này không còn vừa với dung lượng ${d.limit !== undefined ? formatBytes(d.limit) : ""} của ${plan} cho các nhóm bạn sở hữu.`
          : "Dung lượng tài liệu của nhóm này đã đầy nên chưa tải thêm tệp được.",
        figures:
          owner && d.used !== undefined && d.limit !== undefined
            ? `Đã dùng ${formatBytes(d.used)} / ${formatBytes(d.limit)}${d.requested ? ` · tệp cần ${formatBytes(d.requested)}` : ""}`
            : null,
        hint: owner ? "Xoá vĩnh viễn tài liệu trong thùng rác để giải phóng dung lượng, hoặc nâng cấp gói." : "Hãy báo Chủ nhóm để dọn bớt tài liệu.",
      };
    case "WORKSPACE_FILE_SIZE_EXCEEDED":
      return {
        title: "Tệp vượt giới hạn tải lên",
        body: `Tệp đã chọn${d.requested ? ` (${formatBytes(d.requested)})` : ""} lớn hơn giới hạn ${d.limit !== undefined ? formatBytes(d.limit) : ""} mỗi tệp của ${plan}.`,
        figures: null,
        hint: owner ? "Nén tệp hoặc nâng cấp để tải tệp lớn hơn." : "Hãy nén tệp hoặc chia nhỏ trước khi tải lên.",
      };
    case "WORKSPACE_AI_LIMIT_REACHED":
      return {
        title: "Đã hết lượt hỏi AI tháng này",
        body: owner
          ? `Các nhóm bạn sở hữu đã dùng hết ${d.limit ?? ""} lượt hỏi Trợ lý AI tài liệu của ${plan} trong tháng này.`
          : "Nhóm này đã dùng hết lượt hỏi Trợ lý AI của tháng. Lượt mới được cấp vào đầu tháng sau.",
        figures: owner && d.used !== undefined ? `Đã dùng ${d.used} / ${d.limit} lượt` : null,
        hint: owner ? "Lượt mới được cấp vào ngày 1 hằng tháng, hoặc nâng cấp để có thêm lượt." : "Bạn có thể báo Chủ nhóm.",
      };
    case "WORKSPACE_FEATURE_LOCKED":
      return {
        title: "Tính năng của gói trả phí",
        body: owner
          ? message
          : `Tính năng này chưa có trong ${plan} của Chủ nhóm.`,
        figures: null,
        hint: owner
          ? "Các gói từ Plus trở lên có hạn nộp, giao bài cho từng thành viên, soạn bài bằng AI và thống kê chi tiết."
          : "Bạn vẫn giao bài cho cả nhóm, không đặt hạn nộp. Hãy báo Chủ nhóm nếu cần tính năng này.",
      };
    case "WORKSPACE_GROUP_READ_ONLY":
    case "WORKSPACE_GROUP_HIDDEN":
      return {
        title: code === "WORKSPACE_GROUP_HIDDEN" ? "Nhóm đang tạm ẩn" : "Nhóm đang ở chế độ chỉ đọc",
        body: message,
        figures: null,
        hint: owner
          ? "Gia hạn, nâng cấp hoặc dọn dẹp (xoá bớt thành viên, tài liệu, nhóm) để mở lại ngay. Dữ liệu không bị xoá."
          : "Dữ liệu của nhóm vẫn còn nguyên. Chủ nhóm mở lại được bất kỳ lúc nào.",
      };
    default:
      return { title: "Chưa thực hiện được", body: message || "Hệ thống gói Workspace tạm thời chưa sẵn sàng.", figures: null, hint: null };
  }
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
