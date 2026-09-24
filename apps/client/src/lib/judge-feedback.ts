import type { JudgeVerdict } from "@/types/judge";

type JudgeFeedback = {
  title: string;
  guidance: string;
};

function likelyDifferentLanguage(selectedLanguage: string, sourceCode: string) {
  const pythonSyntax =
    /^\s*(?:async\s+)?def\s+[A-Za-z_]\w*\s*\(|^\s*class\s+[A-Za-z_]\w*\s*[^\n]*:\s*$/m;
  const javascriptSyntax =
    /^\s*(?:export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(|^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=/m;

  if (
    (selectedLanguage === "JavaScript" || selectedLanguage === "TypeScript") &&
    pythonSyntax.test(sourceCode)
  ) {
    return "Python";
  }
  if (selectedLanguage === "Python" && javascriptSyntax.test(sourceCode)) {
    return "JavaScript";
  }
  return null;
}

/** A learner-facing explanation; raw judge output belongs behind a details control. */
export function judgeFailureFeedback({
  verdict,
  stderr,
  language,
  sourceCode,
  availableLanguages,
}: {
  verdict: JudgeVerdict;
  stderr?: string | null;
  language: string;
  sourceCode: string;
  availableLanguages: string[];
}): JudgeFeedback | null {
  if (verdict === "accepted" || verdict === "wrong_answer") return null;

  const error = stderr ?? "";
  const detectedLanguage = likelyDifferentLanguage(language, sourceCode);
  const syntaxFailure = /\b(?:SyntaxError|IndentationError|TabError)\b/i.test(
    error,
  );

  // Only suggest a mismatch when the judge actually reported a syntax failure.
  // A valid mixed-language snippet (for example a Python string containing JS) is not enough.
  if (detectedLanguage && (syntaxFailure || verdict === "compile_error")) {
    return {
      title: `Mã có vẻ viết bằng ${detectedLanguage}, nhưng đang chạy bằng ${language}.`,
      guidance: availableLanguages.includes(detectedLanguage)
        ? `Hãy chọn ${detectedLanguage} trong menu ngôn ngữ rồi chạy lại, hoặc viết lại mã theo cú pháp ${language}.`
        : `Bài này chưa hỗ trợ ${detectedLanguage}. Hãy viết lại mã theo cú pháp ${language}.`,
    };
  }

  if (verdict === "timeout") {
    return {
      title: "Chương trình chạy quá thời gian cho phép.",
      guidance:
        "Kiểm tra vòng lặp không dừng và thử giảm số lần duyệt dữ liệu.",
    };
  }
  if (verdict === "memory_exceeded") {
    return {
      title: "Chương trình dùng quá bộ nhớ cho phép.",
      guidance:
        "Kiểm tra dữ liệu được lưu trong bộ nhớ và tránh tạo bản sao không cần thiết.",
    };
  }
  if (verdict === "skipped") {
    return {
      title: "Test này chưa được chạy.",
      guidance: "Hãy sửa lỗi ở test trước đó rồi chạy lại.",
    };
  }
  if (verdict === "compile_error") {
    return {
      title: `Không biên dịch được mã ${language}.`,
      guidance:
        "Kiểm tra thông báo lỗi gốc trong chi tiết kỹ thuật, đặc biệt là dòng đầu tiên có tên file hoặc số dòng.",
    };
  }
  if (syntaxFailure) {
    return {
      title: `Mã chưa đúng cú pháp ${language}.`,
      guidance:
        "Kiểm tra dấu ngoặc, dấu câu và cách khai báo hàm. Có thể mở chi tiết kỹ thuật bên dưới để xem lỗi gốc.",
    };
  }
  if (/\b(?:ReferenceError|NameError)\b/i.test(error)) {
    return {
      title: "Có tên biến hoặc hàm chưa được khai báo.",
      guidance:
        "Kiểm tra chính tả tên và phạm vi của biến hoặc hàm trước khi dùng.",
    };
  }
  if (/\bTypeError\b/i.test(error)) {
    return {
      title: "Chương trình thao tác với một giá trị không phù hợp.",
      guidance:
        "Kiểm tra dữ liệu đầu vào và giá trị của biến trước dòng gây lỗi.",
    };
  }
  return {
    title: "Chương trình dừng trước khi trả kết quả.",
    guidance:
      "Kiểm tra mã và dữ liệu đầu vào; mở chi tiết kỹ thuật nếu bạn cần tìm dòng lỗi cụ thể.",
  };
}

export function technicalJudgeOutput(value?: string | null) {
  const clean = value?.replace(/\u001b\[[0-9;]*m/g, "").trim() ?? "";
  return clean.length > 5000
    ? `${clean.slice(0, 5000)}\n… Đã rút gọn chi tiết lỗi.`
    : clean;
}
