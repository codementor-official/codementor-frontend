import StackIcon from "tech-stack-icons";

/**
 * Logo nhà cung cấp cho nút đăng nhập xã hội.
 *
 * Google lấy từ `tech-stack-icons` — thư viện đã có sẵn trong dự án và chính là thứ
 * bản thiết kế gốc của trang đăng nhập dùng. Bộ icon đó KHÔNG có Facebook (chỉ có logo
 * Meta, một dấu vô cực, người dùng không nhận ra là "đăng nhập Facebook"), nên chữ "f"
 * được vẽ thẳng bằng SVG: thêm cả một dependency cho đúng một glyph là không đáng.
 *
 * Cả hai đều vẽ trong khung 20×20 để hai nút cao bằng nhau và icon thẳng hàng.
 */
export function GoogleIcon() {
  return <StackIcon name="google" className="h-5 w-5 shrink-0" />;
}

export function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" fill="#1877F2" r="12" />
      <path
        d="M16.671 15.47 17.203 12h-3.328V9.75c0-.949.465-1.874 1.956-1.874h1.513V4.922s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669V12H7.078v3.47h3.047v8.385a12.13 12.13 0 0 0 3.75 0V15.47h2.796Z"
        fill="#fff"
      />
    </svg>
  );
}
