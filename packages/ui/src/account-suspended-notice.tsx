/** Hộp thư nhận kháng cáo khi tài khoản bị khoá. */
export const APPEAL_EMAIL = "codementor.official@gmail.com";

/** Mã backend/BFF trả khi tài khoản đang bị khoá — frontend dựa vào nó để đăng xuất và báo. */
export const ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED";

/**
 * Thông báo đỏ cho tài khoản bị tạm khoá: vì sao không vào được và cách kháng cáo. Hiện ở trang
 * đăng nhập, cả khi đăng nhập bị từ chối lẫn khi đang dùng thì bị đăng xuất.
 */
export function AccountSuspendedNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="alert"
      className={`rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive ${className}`}
    >
      <p className="font-semibold">Tài khoản của bạn đang bị tạm khoá.</p>
      <p className="mt-1 leading-relaxed">
        Tài khoản bị khoá do nội dung vi phạm quy định của CodeMentor. Nếu bạn cho rằng đây là nhầm lẫn và
        muốn kháng cáo, hãy liên hệ{" "}
        <a href={`mailto:${APPEAL_EMAIL}`} className="font-semibold underline underline-offset-2">
          {APPEAL_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
