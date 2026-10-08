export * from "./validate";
export * from "./video";
export * from "./video-player";
export * from "./csv";
export * from "./print-document";
export * from "./holding-period";

export function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}
