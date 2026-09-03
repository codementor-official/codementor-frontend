/**
 * Self-check cho sinh slug. Kho này chưa có test runner nào, nên chạy thẳng:
 *
 *   pnpm --filter @codementor/utils exec tsx src/slug.test.ts
 *
 * Cùng quy ước với các `*.test.ts` bên `apps/client`.
 */
import assert from "node:assert/strict";
import { retitleSlug, slug as slugRule, slugify } from "./validate";

// Dấu tiếng Việt và "đ" phải rụng TRƯỚC khi lọc ký tự, nếu không cả từ biến mất.
assert.equal(slugify("Đệ quy và quay lui"), "de-quy-va-quay-lui");
assert.equal(slugify("  Spring Boot 3.0: bắt đầu  "), "spring-boot-3-0-bat-dau");
assert.equal(slugify("♥♥♥"), "");
assert.equal(slugify("a".repeat(100)).length, 70);
// Kết quả phải qua được chính luật kiểm slug của form.
assert.equal(slugRule(slugify("Đệ quy và quay lui")), undefined);

// Slug vẫn là bản sinh từ tiêu đề cũ → đi theo tiêu đề mới.
assert.equal(retitleSlug("de-quy", "Đệ quy", "Đệ quy nâng cao"), "de-quy-nang-cao");
// Slug đặt tay (hoặc backend gắn hậu tố chống trùng) → giữ nguyên.
assert.equal(retitleSlug("de-quy-2k5", "Đệ quy", "Đệ quy nâng cao"), "de-quy-2k5");
// Bài mới chưa có gì → sinh từ tiêu đề đầu tiên.
assert.equal(retitleSlug("", "", "Đệ quy"), "de-quy");

console.log("slug.test.ts OK");
