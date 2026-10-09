/**
 * Self-check cho luật kiểm form dùng chung. Kho chưa có test runner, chạy thẳng bằng Node
 * (cần hook resolve import không đuôi, giống `slug.test.ts`):
 *
 *   node --import <hook phân giải .ts> packages/utils/src/validate.test.ts
 *
 * Mỗi luật ở đây là bản sao một ràng buộc backend — test giữ cho bản sao không trôi.
 */
import assert from "node:assert/strict";
import {
  dateRange,
  decimal,
  email,
  functionName,
  githubHandle,
  handle,
  integer,
  isClean,
  length,
  promotion,
  reason,
  search,
  toNumber,
} from "./validate";

// integer — ô số giữ chuỗi; trống hợp lệ khi optional.
assert.equal(integer("", "Số"), undefined);
assert.equal(integer("  ", "Số", { optional: false }), "Số không được để trống");
assert.equal(integer("12", "Số", { min: 0, max: 100 }), undefined);
assert.equal(integer("012", "Số", { min: 0, max: 100 }), undefined);
// Số âm: báo khoảng, không báo "không phải số nguyên".
assert.equal(integer("-5", "Thời gian giữ", { min: 0 }), "Thời gian giữ phải từ 0 trở lên");
assert.equal(integer("-", "Số", { min: 0 }), "Số phải là số nguyên");
assert.equal(integer("1e3", "Số", { min: 0 }), "Số phải là số nguyên");
assert.equal(integer("1.5", "Số", { min: 0 }), "Số phải là số nguyên");
assert.equal(integer("129601", "Thời gian giữ", { min: 0, max: 129600 }), "Thời gian giữ tối đa 129.600");
assert.equal(integer("999", "Rút tối thiểu", { min: 1000 }), "Rút tối thiểu phải từ 1.000 trở lên");

// decimal — % giảng viên hưởng (backend lưu bps nguyên nên tối đa 2 chữ số thập phân).
assert.equal(decimal("80.01", "Tỷ lệ", { min: 0, max: 100 }), undefined);
assert.equal(decimal("80,5", "Tỷ lệ", { min: 0, max: 100 }), undefined);
assert.equal(decimal("80.001", "Tỷ lệ", { min: 0, max: 100 }), "Tỷ lệ tối đa 2 chữ số thập phân");
assert.equal(decimal("-1", "Tỷ lệ", { min: 0, max: 100 }), "Tỷ lệ phải từ 0 trở lên");
assert.equal(decimal("100.5", "Tỷ lệ", { min: 0, max: 100 }), "Tỷ lệ tối đa 100");
assert.equal(decimal("abc", "Tỷ lệ"), "Tỷ lệ phải là số");
assert.equal(decimal("", "Tỷ lệ", { optional: false }), "Tỷ lệ không được để trống");
assert.equal(toNumber("80,5"), 80.5);
assert.equal(Math.round(toNumber("80.01") * 100), 8001);

// length — đếm trên chuỗi đã trim.
assert.equal(length("", "Tên", { max: 10 }), undefined);
assert.equal(length("", "Tên", { min: 2, max: 10 }), "Tên không được để trống");
assert.equal(length(" a ", "Tên", { min: 2, max: 10 }), "Tên tối thiểu 2 ký tự");
assert.equal(length("  ab  ", "Tên", { min: 2, max: 2 }), undefined);
assert.equal(length("abcd", "Tên", { max: 3 }), "Tên tối đa 3 ký tự (đang có 4)");
assert.equal(length("", "Tên", { max: 3, optional: false }), "Tên không được để trống");

// email — khớp Email.PATTERN ở core-service.
assert.equal(email("a@b.co"), undefined);
assert.equal(email("a@b"), "Email không hợp lệ");
assert.equal(email("a@b.c"), "Email không hợp lệ");
assert.equal(email(""), "Email không được để trống");

// handle — backend hạ chữ thường trước khi kiểm.
assert.equal(handle(""), undefined);
assert.equal(handle("GiaSi"), undefined);
assert.notEqual(handle("ab"), undefined);
assert.notEqual(handle("-abc"), undefined);
assert.notEqual(handle("a".repeat(31)), undefined);
assert.equal(handle("a".repeat(30)), undefined);
assert.equal(handle("gia_si-1"), undefined);

// githubHandle — luật trong User.updateProfile.
assert.equal(githubHandle(""), undefined);
assert.equal(githubHandle("a"), undefined);
assert.equal(githubHandle("Octo-Cat"), undefined);
assert.notEqual(githubHandle("octo_cat"), undefined);
assert.notEqual(githubHandle("a".repeat(40)), undefined);

// search — chỉ lỗi khi quá trần; trống/khoảng trắng là "không lọc".
assert.equal(search("", 100), undefined);
assert.equal(search("   ", 100), undefined);
assert.equal(search("a".repeat(100), 100), undefined);
assert.equal(search("a".repeat(101), 100), "Từ khóa tối đa 100 ký tự");

// reason — 3–500, bắt buộc.
assert.equal(reason(""), "Lý do không được để trống");
assert.equal(reason("ab"), "Lý do tối thiểu 3 ký tự");
assert.equal(reason("abc"), undefined);
assert.equal(reason("a".repeat(501)), "Lý do tối đa 500 ký tự (đang có 501)");

// dateRange.
assert.equal(dateRange("2026-10-01", "2026-10-01"), undefined);
assert.equal(dateRange("2026-10-02", "2026-10-01"), "Ngày kết thúc phải từ ngày bắt đầu trở đi");
assert.equal(dateRange("2026-10-01T10:00", "2026-10-01T10:00", { strict: true }), "Ngày kết thúc phải sau thời điểm bắt đầu");
assert.equal(dateRange("", "2026-10-01"), undefined);

// promotion — theo giá.
const ok = promotion({ label: "Sale", startsAt: "2026-10-01T00:00", endsAt: "2026-10-02T00:00", salePrice: "99000", listPrice: 199000 });
assert.ok(isClean(ok));
const bad = promotion({ label: "A", startsAt: "2026-10-02T00:00", endsAt: "2026-10-01T00:00", salePrice: "199000", listPrice: 199000 });
assert.equal(bad.label, "Tên chương trình tối thiểu 2 ký tự");
assert.equal(bad.endsAt, "Thời điểm kết thúc phải sau thời điểm bắt đầu");
assert.equal(bad.salePrice, "Giá ưu đãi phải thấp hơn giá niêm yết (199.000 ₫)");
assert.equal(promotion({ label: "Sale", startsAt: "", endsAt: "", salePrice: "" }).salePrice, "Giá ưu đãi không được để trống");
assert.equal(promotion({ label: "Sale", startsAt: "", endsAt: "" }).startsAt, "Chọn thời điểm bắt đầu");
// promotion — theo phần trăm.
assert.equal(promotion({ label: "Sale", startsAt: "a", endsAt: "b", discount: "012" }).discount, undefined);
assert.equal(promotion({ label: "Sale", startsAt: "a", endsAt: "b", discount: "100" }).discount, "Mức giảm tối đa 99");
assert.equal(promotion({ label: "Sale", startsAt: "a", endsAt: "b", discount: "" }).discount, "Mức giảm không được để trống");
assert.equal(promotion({ label: "Sale", startsAt: "a", endsAt: "b" }).discount, undefined);

// functionName — bản sao FUNCTION_NAME_PATTERN + RESERVED_WORDS ở exercise-service.
assert.equal(functionName("solve_quadratic"), undefined);
assert.equal(functionName("two_sum2"), undefined);
assert.equal(functionName(""), "Tên hàm không được để trống");
assert.notEqual(functionName("SolveIt"), undefined);
assert.notEqual(functionName("2sum"), undefined);
assert.notEqual(functionName("two-sum"), undefined);
assert.equal(functionName("class"), 'Tên hàm "class" trùng từ khoá của Python/JavaScript/Java');
assert.equal(functionName("lambda"), 'Tên hàm "lambda" trùng từ khoá của Python/JavaScript/Java');

console.log("validate.test.ts OK");
