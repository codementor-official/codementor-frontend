/**
 * 4 số cuối của tài khoản nhận tiền, phần còn lại che bằng 4 chấm.
 *
 * Chấm vẽ bằng CSS chứ không dùng ký tự "•": glyph bullet mỗi font một cỡ, nằm lệch đường
 * cơ sở và đứng cạnh dấu "·" thì to nhỏ không đều. Luôn đúng 4 chấm — độ dài thật của số tài
 * khoản cũng là thông tin không nên lộ.
 */
export function MaskedAccount({
  accountNumber,
  className = "",
}: {
  accountNumber: string | null | undefined;
  className?: string;
}) {
  const last4 = (accountNumber ?? "").trim().slice(-4);
  if (!last4) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 align-middle whitespace-nowrap ${className}`}>
      <span aria-hidden="true" className="inline-flex items-center gap-[3px]">
        {[0, 1, 2, 3].map((dot) => (
          <span className="size-[5px] rounded-full bg-current opacity-70" key={dot} />
        ))}
      </span>
      <span className="sr-only">tài khoản kết thúc bằng</span>
      <span className="tabular-nums tracking-wide">{last4}</span>
    </span>
  );
}
