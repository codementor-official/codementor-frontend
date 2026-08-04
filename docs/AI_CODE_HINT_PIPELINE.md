# Pipeline AI đọc code và sinh gợi ý ngắn

## 1. Mục tiêu

Codey không cần sinh lời giải hoàn chỉnh. Nhiệm vụ của Codey là xác định trở ngại gần nhất của người học và trả về **một gợi ý ngắn, có thể thực hiện ngay**.

Trợ lý AI chuyên sâu là luồng riêng, có thể phân tích toàn bộ lời giải, độ phức tạp và đề xuất tái cấu trúc code.

## 2. Dữ liệu cần gửi cho backend

Frontend chỉ gửi dữ liệu khi người dùng chủ động hỏi Codey hoặc sau khi chạy test:

```ts
interface CodeHintRequest {
  problemId: string;
  language: "c" | "cpp" | "java" | "python" | "javascript";
  sourceCode: string;
  cursor?: { line: number; column: number };
  selectedCode?: string;
  compilerDiagnostics?: Array<{
    line: number;
    column: number;
    severity: "error" | "warning";
    message: string;
  }>;
  testSummary?: Array<{
    input: string;
    expected: string;
    actual?: string;
    passed: boolean;
  }>;
  question?: string;
}
```

Không nên gửi liên tục theo từng phím bấm. Khi cần phân tích tự động, dùng debounce khoảng 1–2 giây và chỉ gửi nếu hash của code đã thay đổi.

## 3. Thuật toán xử lý đề xuất

### Bước 1 — Chuẩn hóa và bảo vệ dữ liệu

1. Giới hạn kích thước source code.
2. Xóa token, mật khẩu hoặc URL bí mật nếu phát hiện.
3. Chuẩn hóa line ending và loại phần code sinh tự động không cần thiết.
4. Tạo `codeHash = SHA256(problemId + language + normalizedCode + testSummary)` để cache kết quả.

### Bước 2 — Phân tích xác định trước bằng compiler và AST

Ưu tiên công cụ xác định trước khi gọi mô hình ngôn ngữ:

1. Compile hoặc parse code trong sandbox.
2. Lấy lỗi cú pháp, lỗi kiểu dữ liệu và warning.
3. Tạo AST bằng Tree-sitter hoặc parser tương ứng ngôn ngữ.
4. Trích xuất hàm, vòng lặp, nhánh điều kiện, biến và lời gọi hàm.
5. Đối chiếu test thất bại để xác định nhánh code có khả năng gây lỗi.

Ví dụ: nếu `delta < 0` thất bại và AST không có nhánh xử lý số âm, hệ thống có thể đưa gợi ý bằng rule mà chưa cần gọi AI.

### Bước 3 — Bộ luật gợi ý nhanh

Áp dụng theo thứ tự ưu tiên:

1. `compiler_error`: gợi ý tại dòng lỗi đầu tiên.
2. `runtime_error`: giải thích loại lỗi và dữ liệu gây lỗi.
3. `failed_test`: so sánh expected/actual và nhánh điều kiện liên quan.
4. `edge_case_missing`: tìm trường hợp biên chưa xuất hiện trong AST.
5. `complexity_risk`: cảnh báo khi cấu trúc thuật toán không đáp ứng ràng buộc.
6. Nếu không rule nào đủ chắc chắn, mới chuyển context rút gọn sang LLM.

### Bước 4 — Tạo context cho LLM

Context không nên chỉ chứa source code. Nó cần gồm:

- Mô tả và ràng buộc bài toán.
- Ngôn ngữ đang dùng.
- Source code có đánh số dòng.
- Vị trí con trỏ hoặc đoạn đang được chọn.
- Diagnostics từ compiler.
- Tóm tắt test đạt/thất bại, không gửi hidden input nhạy cảm.
- Các node AST quan trọng và độ phức tạp ước tính.
- Câu hỏi hiện tại của người học.

Prompt hệ thống nên quy định:

```text
Bạn là Codey, trợ lý gợi ý ngắn.
- Không viết lời giải hoàn chỉnh.
- Chỉ nêu một vấn đề quan trọng nhất.
- Tối đa 60 từ tiếng Việt.
- Nếu có thể, nhắc dòng code hoặc cấu trúc liên quan.
- Kết thúc bằng một hành động người học có thể làm ngay.
```

### Bước 5 — Ép đầu ra có cấu trúc

```ts
interface CodeHintResponse {
  category: "syntax" | "logic" | "edge_case" | "complexity" | "testing";
  line?: number;
  hint: string;
  nextAction: string;
  confidence: number;
  source: "rule" | "llm";
}
```

Backend phải kiểm tra schema, giới hạn độ dài và loại bỏ code lời giải trước khi trả về frontend.

## 4. Pseudocode

```text
function generateShortHint(request):
    normalized = sanitizeAndNormalize(request)
    cached = cache.get(hash(normalized))
    if cached exists:
        return cached

    diagnostics = compileInSandbox(normalized)
    astSummary = parseAndSummarizeAST(normalized.sourceCode)
    testAnalysis = compareTestResults(normalized.testSummary)

    ruleHint = applyHintRules(diagnostics, astSummary, testAnalysis)
    if ruleHint.confidence >= 0.85:
        return validateAndCache(ruleHint)

    context = buildCompactContext(
        problem,
        normalized,
        diagnostics,
        astSummary,
        testAnalysis
    )

    aiHint = llm.generate(context, SHORT_HINT_SCHEMA)
    return validateAndCache(aiHint)
```

## 5. Phân biệt Codey và Trợ lý AI

| Thành phần | Codey | Trợ lý AI |
|---|---|---|
| Mục đích | Gỡ vướng ngay lúc code | Phân tích chuyên sâu |
| Context | Lỗi gần nhất, test gần nhất, vị trí con trỏ | Toàn bộ đề, code, lịch sử hỏi đáp |
| Độ dài | Một gợi ý dưới 60 từ | Có thể giải thích nhiều bước |
| Tần suất | Nhanh, cache mạnh | Chỉ khi người dùng chủ động mở |
| Đáp án hoàn chỉnh | Không | Vẫn nên ưu tiên hướng dẫn thay vì làm hộ |

## 6. API tối thiểu

```http
POST /api/ai/code-hint
Authorization: Bearer <token>
Content-Type: application/json
```

Response:

```json
{
  "category": "edge_case",
  "line": 8,
  "hint": "Nhánh hiện tại mới xử lý delta dương và bằng 0.",
  "nextAction": "Thêm trường hợp delta âm và kiểm tra output yêu cầu.",
  "confidence": 0.94,
  "source": "rule"
}
```

## 7. Yêu cầu an toàn và vận hành

- Compile code trong sandbox bị giới hạn CPU, bộ nhớ và thời gian.
- Không ghi source code vào log thông thường.
- Rate limit theo người dùng và bài tập.
- Không gửi hidden test case đầy đủ cho mô hình.
- Cache theo code hash để giảm chi phí và độ trễ.
- Gắn `requestId`, thời gian phản hồi và nguồn `rule/llm` để theo dõi chất lượng.
- Cho phép người học đánh giá “Hữu ích/Không hữu ích” để cải thiện rule và prompt.
