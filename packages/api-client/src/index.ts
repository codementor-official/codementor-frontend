import { joinUrl } from "@codementor/utils";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Safe server validation messages, without rendering internal 5xx payloads. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status >= 500) return 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại hoặc kiểm tra trạng thái trước khi tạo giao dịch mới.';
    const body = error.body;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && message.every(item => typeof item === 'string')) return message.join('. ');
    }
  }
  return error instanceof Error ? error.message : 'Không thực hiện được yêu cầu.';
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  fetchImplementation?: typeof fetch;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
}

export function createApiClient({
  baseUrl,
  getAccessToken,
  fetchImplementation = fetch,
}: ApiClientOptions) {
  return async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    const token = await getAccessToken?.();
    if (token) headers.set("Authorization", "Bearer " + token);

    let body = options.body;
    if (body && isJsonBody(body)) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await fetchImplementation(joinUrl(baseUrl, path), {
      ...options,
      headers,
      body: body as BodyInit | null | undefined,
    });

    if (!response.ok) {
      // Body lỗi rỗng hoặc hỏng (vd. 502 từ gateway) vẫn phải thành ApiClientError có mã lỗi.
      const responseBody = await parseResponseBody(response).catch(() => undefined);
      throw new ApiClientError(readableMessage(response.status, responseBody), response.status, responseBody);
    }

    return (await parseResponseBody(response)) as T;
  };
}

/** Câu backend gửi kèm nếu có; không thì câu tiếng Việt theo mã lỗi, không bao giờ là "Request failed…". */
function readableMessage(status: number, body: unknown): string {
  const message =
    body && typeof body === "object" && "message" in body ? (body as { message: unknown }).message : undefined;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(". ");
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 403) return "Bạn chưa có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy nội dung yêu cầu.";
  if (status === 429) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  if (status >= 500) return "Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.";
  return "Không thực hiện được yêu cầu.";
}

function isJsonBody(body: BodyInit | Record<string, unknown>): body is Record<string, unknown> {
  return Object.getPrototypeOf(body) === Object.prototype;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}
