import { AlertCircle } from "lucide-react";

/**
 * Hai trạng thái mà quản trị viên đã đọc nội dung rồi trả về kèm lý do. Cùng một danh
 * sách ở mọi màn: khoá học, lộ trình, bài code và bài viết dùng chung máy trạng thái duyệt.
 */
export function needsFix(status: string): boolean {
  return status === "changes_requested" || status === "rejected";
}

/**
 * Lý do bị trả lại, hiện ở dòng danh sách.
 *
 * Trước đây lý do chỉ nằm trong ngăn chi tiết của riêng bài viết, nên một giảng viên có
 * mười khoá học phải mở từng cái ra mới biết cái nào cần sửa — mà bảng điều khiển thì
 * bảo họ "có mục bị gửi lại". Chỉ điểm ngay trên hàng là thứ biến câu đó thành hành động.
 */
export function ReviewFlag({ status }: { status: string }) {
  if (!needsFix(status)) return null;
  return (
    <span
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive"
      title="Quản trị viên đã trả nội dung này lại — mở ra để đọc lý do"
    >
      <AlertCircle aria-hidden="true" className="size-3.5" />
      Cần bạn sửa lại
    </span>
  );
}

/**
 * Toàn văn lý do, hiện trong ngăn chi tiết.
 *
 * `role="alert"` vì đây là thứ duy nhất trên màn nói cho tác giả biết họ phải làm gì
 * tiếp theo — nó không được lẫn vào giữa các trường của biểu mẫu.
 */
export function ReviewNotice({ status, reason }: { status: string; reason: string | null }) {
  if (!needsFix(status)) return null;
  return (
    <p
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      <strong>
        {status === "rejected" ? "Quản trị viên từ chối" : "Quản trị viên trả lại"}:
      </strong>{" "}
      {reason?.trim() ? reason : "không nêu lý do"}
    </p>
  );
}

/**
 * Bạn đã xin gỡ nội dung đang công khai này — vẫn `published` cho tới khi admin quyết.
 * Không còn nút "Gỡ xuống" nào khác xuất hiện trong lúc chờ, nhưng bản thân trạng thái
 * chờ đó phải hiện ra, nếu không giảng viên sẽ tưởng yêu cầu đã biến mất.
 */
export function RemovalPendingNotice({
  status,
  removalRequested,
  reason,
}: {
  status: string;
  removalRequested: boolean;
  reason: string | null;
}) {
  if (status !== "published" || !removalRequested) return null;
  return (
    <p
      className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
      role="status"
    >
      <strong>Đang chờ quản trị viên duyệt gỡ.</strong> {reason?.trim() ? `Lý do bạn nêu: ${reason}` : ""}
    </p>
  );
}
