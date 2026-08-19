import type { TypeIR } from "@codementor/solve";

/**
 * Mã khởi tạo KHÔNG sinh ở đây.
 *
 * Nó sinh phía judge (`POST /judge/starter`), cùng module sinh ra driver bao quanh bài của
 * học viên. Lý do là một ràng buộc chứ không phải sở thích: chữ ký trong mã khởi tạo phải
 * khớp tuyệt đối với chữ ký driver gọi, và cách duy nhất bảo đảm điều đó là để một chỗ duy
 * nhất sinh cả hai. Một bảng ánh xạ kiểu thứ hai viết bằng TypeScript sẽ lệch — và lúc lệch
 * thì học viên nhận một bài không thể nào giải đúng, còn giảng viên không hiểu tại sao.
 *
 * Còn lại ở file này chỉ là thứ thuần giao diện.
 */

/**
 * Giá trị mặc định khi thêm một tham số mới vào ô nhập test case.
 *
 * Ô nhập nhận JSON, nên giá trị khởi tạo phải là JSON hợp lệ của đúng kiểu đó — bỏ trống thì
 * ô nào cũng đỏ ngay lúc vừa mở ra.
 */
export function defaultValueFor(type: TypeIR | undefined): unknown {
  switch (type?.kind) {
    case "float":
    case "int":
    case "long":
      return 0;
    case "bool":
      return false;
    case "string":
      return "";
    case "list":
      return [];
    case "map":
      return {};
    default:
      return null;
  }
}
