/**
 * Không còn nút "Last 28 days": nó không lọc gì cả, bấm vào không có phản hồi nào. Một
 * điều khiển chết khiến người dùng nghĩ hệ thống hỏng chứ không nghĩ là chưa làm — và ở
 * đây nó còn ngụ ý mọi con số bên dưới là của 28 ngày, trong khi chúng là toàn bộ lịch sử.
 *
 * Muốn lọc theo khoảng thời gian thì cần tham số ở cả bốn endpoint đang gọi, đó là việc
 * riêng của nó.
 */
export function DashboardHeader() {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Bảng điều khiển</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Số liệu toàn bộ nền tảng, đọc trực tiếp từ cơ sở dữ liệu.
      </p>
    </div>
  );
}
