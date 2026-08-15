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
      const responseBody = await parseResponseBody(response);
      throw new ApiClientError(
        "Request failed with status " + response.status,
        response.status,
        responseBody,
      );
    }

    return (await parseResponseBody(response)) as T;
  };
}

function isJsonBody(body: BodyInit | Record<string, unknown>): body is Record<string, unknown> {
  return Object.getPrototypeOf(body) === Object.prototype;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}
