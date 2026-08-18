/**
 * realtime-service, nối THẲNG chứ không qua Kong: gateway chưa cấu hình nâng cấp
 * WebSocket, và đây là kết nối sống lâu chứ không phải request/response cần rate limit.
 *
 * Viết đủ `process.env.NEXT_PUBLIC_*` ra một lần ở đây: Next chỉ thay giá trị lúc build
 * khi biểu thức được viết nguyên vẹn, nên tra cứu động sẽ ra `undefined` ở production mà
 * dev vẫn chạy.
 */
export const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3009";
