/**
 * Tách câu trả lời đang chảy về của Trợ lý AI thành hai khối, để vẽ NGAY trong lúc stream.
 *
 * Bản sao luật tách của `app/tutor/answer.py::split_answer` ở ai-service. Bản đó mới là bản
 * quyết định: sau khi stream xong, server đối chiếu từng trích đoạn với text nguồn và gửi về
 * `grounding` — giao diện vẽ lượt đã xong từ `grounding`, không từ đây. Ở đây chỉ để người dùng
 * thấy chữ chảy ra đúng khối thay vì một bãi văn bản có dấu mốc.
 */
export const QUOTES = "<<<TRICH_DAN>>>";
export const EXPLAIN = "<<<GIAI_THICH>>>";

const TRAILING_SOURCE = /\[(S\d+)\]\s*$/;
const WRAPPING_QUOTES = /^["'“”‘’«»]+|["'“”‘’«»]+$/g;
/** Đuôi một dấu mốc còn đang chảy dở ("<<<GIA"), không được hiện ra như chữ. */
const PARTIAL_MARKER = /<{1,3}[A-Z_]*>{0,2}$/;

export interface StreamingAnswer {
  /** Trích đoạn ĐANG viết, chưa đối chiếu. Đoạn cuối có thể chưa có mã nguồn. */
  quotes: { sourceId: string | null; quote: string }[];
  explanation: string;
}

export function splitAnswer(raw: string): StreamingAnswer {
  const text = raw.replace(/\r\n/g, "\n").replace(PARTIAL_MARKER, "");
  if (!text.includes(QUOTES) && !text.includes(EXPLAIN)) {
    return { quotes: [], explanation: text.trim() };
  }
  const at = text.indexOf(EXPLAIN);
  const head = at === -1 ? text : text.slice(0, at);
  const explanation = at === -1 ? "" : text.slice(at + EXPLAIN.length).trim();
  const section = head.includes(QUOTES) ? head.slice(head.indexOf(QUOTES) + QUOTES.length) : "";
  const quotes = section
    .split(/\n[ \t]*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim().replace(/^>\s?/, ""))
        .filter(Boolean)
        .join(" ")
        .trim(),
    )
    .filter(Boolean)
    .map((body) => {
      const match = TRAILING_SOURCE.exec(body);
      const quote = (match ? body.slice(0, match.index) : body).trim().replace(WRAPPING_QUOTES, "").trim();
      return { sourceId: match?.[1] ?? null, quote };
    })
    .filter((item) => item.quote);
  return { quotes, explanation };
}
