export * from "./validate";
export * from "./video";

export function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}
